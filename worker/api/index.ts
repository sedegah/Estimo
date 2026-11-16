/**
 * ESTIMO data API worker.
 *
 * Every request must carry a Clerk session token. The token is verified against the
 * Clerk JWKS, the user id (`sub`) is hashed with a server pepper, and all reads and
 * writes are scoped to that owner key. D1 has no native row-level security, so this
 * worker is the equivalent enforcement point: a client can never ask for another
 * user's rows.
 *
 * Secrets:
 *   CLERK_PUBLISHABLE_KEY  — same public key the app uses (used to find the JWKS host)
 *   DB_PEPPER              — long random string, mixed into the owner hash
 */

type Env = {
  DB: D1Database;
  CLERK_PUBLISHABLE_KEY: string;
  DB_PEPPER: string;
};

type SessionClaims = { sub: string; exp?: number; nbf?: number; iss?: string };

const enc = new TextEncoder();

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function decodeJson(value: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
}

function frontendApiHost(publishableKey: string): string {
  const encoded = publishableKey.replace(/^pk_(test|live)_/, "");
  return atob(encoded).replace(/\$$/, "");
}

async function verifySession(token: string, publishableKey: string): Promise<SessionClaims | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const header = decodeJson(parts[0]) as { alg?: string; kid?: string };
  if (header.alg !== "RS256" || !header.kid) return null;

  const host = frontendApiHost(publishableKey);
  const jwksResponse = await fetch(`https://${host}/.well-known/jwks.json`);
  if (!jwksResponse.ok) return null;
  const jwks = (await jwksResponse.json()) as { keys?: Array<JsonWebKey & { kid?: string }> };
  const jwk = jwks.keys?.find((key) => key.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    base64UrlToBytes(parts[2]),
    enc.encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) return null;

  const claims = decodeJson(parts[1]) as SessionClaims;
  const now = Math.floor(Date.now() / 1000);
  if (claims.exp && claims.exp + 30 < now) return null;
  if (claims.nbf && claims.nbf - 30 > now) return null;
  if (!claims.sub) return null;

  return claims;
}

async function ownerKey(userId: string, pepper: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`${pepper}:${userId}`));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    },
  });
}

type EstimateRow = {
  id: string;
  name: string;
  template: string;
  quality: string;
  spaces: number;
  total_ghs: number | null;
  status: string;
  counts_json: string | null;
  created_at: string;
  updated_at: string;
};

async function listEstimates(env: Env, owner: string): Promise<Response> {
  const { results } = await env.DB
    .prepare(
      `SELECT id, name, template, quality, spaces, total_ghs, status, counts_json, created_at, updated_at
       FROM estimates WHERE owner_key = ? ORDER BY updated_at DESC LIMIT 200`,
    )
    .bind(owner)
    .all<EstimateRow>();
  return json({ ok: true, estimates: results ?? [] });
}

async function createEstimate(env: Env, owner: string, body: Record<string, unknown>): Promise<Response> {
  const name = String(body.name ?? "").trim();
  const template = String(body.template ?? "").trim();
  if (!name || !template) return json({ ok: false, error: "name and template are required" }, 400);

  // The client generates the id so local and server rows stay in sync.
  const clientId = typeof body.id === "string" && body.id.length <= 64 ? body.id : "";
  const id = clientId || crypto.randomUUID();
  const quality = String(body.quality ?? "standard");
  const spaces = Number(body.spaces ?? 0) || 0;
  const total = body.totalGhs === null || body.totalGhs === undefined ? null : Number(body.totalGhs);
  const status = String(body.status ?? (total ? "estimated" : "draft"));
  const counts = body.counts && typeof body.counts === "object" ? JSON.stringify(body.counts) : null;

  // users.id mirrors the owner hash so the foreign key stays valid.
  await env.DB
    .prepare("INSERT INTO users (id, role) VALUES (?, 'homeowner') ON CONFLICT(id) DO NOTHING")
    .bind(owner)
    .run();

  await env.DB
    .prepare(
      `INSERT INTO estimates (id, user_id, owner_key, name, template, quality, spaces, total_ghs, status, counts_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, owner, owner, name, template, quality, spaces, total, status, counts)
    .run();

  return json({ ok: true, id }, 201);
}

async function updateEstimate(env: Env, owner: string, id: string, body: Record<string, unknown>): Promise<Response> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (typeof body.name === "string") { fields.push("name = ?"); values.push(body.name.trim()); }
  if (typeof body.quality === "string") { fields.push("quality = ?"); values.push(body.quality); }
  if (typeof body.spaces === "number") { fields.push("spaces = ?"); values.push(body.spaces); }
  if (body.totalGhs === null || typeof body.totalGhs === "number") { fields.push("total_ghs = ?"); values.push(body.totalGhs); }
  if (typeof body.status === "string") { fields.push("status = ?"); values.push(body.status); }
  if (body.counts && typeof body.counts === "object") {
    fields.push("counts_json = ?");
    values.push(JSON.stringify(body.counts));
  }

  if (!fields.length) return json({ ok: false, error: "nothing to update" }, 400);

  fields.push("updated_at = datetime('now')");
  const result = await env.DB
    .prepare(`UPDATE estimates SET ${fields.join(", ")} WHERE id = ? AND owner_key = ?`)
    .bind(...values, id, owner)
    .run();

  if (!result.meta.changes) return json({ ok: false, error: "not_found" }, 404);
  return json({ ok: true });
}

async function deleteEstimate(env: Env, owner: string, id: string): Promise<Response> {
  const result = await env.DB.prepare("DELETE FROM estimates WHERE id = ? AND owner_key = ?").bind(id, owner).run();
  if (!result.meta.changes) return json({ ok: false, error: "not_found" }, 404);
  return json({ ok: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return json({ ok: true });

    const url = new URL(request.url);
    if (url.pathname === "/health" || url.pathname === "/") {
      return json({ ok: true, service: "estimo-data-api", storage: "d1", isolation: "owner_key" });
    }

    const header = request.headers.get("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return json({ ok: false, error: "unauthorized" }, 401);

    const claims = await verifySession(token, env.CLERK_PUBLISHABLE_KEY);
    if (!claims) return json({ ok: false, error: "invalid_session" }, 401);

    const owner = await ownerKey(claims.sub, env.DB_PEPPER);

    if (url.pathname === "/estimates" && request.method === "GET") return listEstimates(env, owner);
    if (url.pathname === "/estimates" && request.method === "POST") {
      return createEstimate(env, owner, (await request.json().catch(() => ({}))) as Record<string, unknown>);
    }

    const match = url.pathname.match(/^\/estimates\/([0-9a-fA-F-]{36})$/);
    if (match) {
      const id = match[1];
      if (request.method === "PATCH") {
        return updateEstimate(env, owner, id, (await request.json().catch(() => ({}))) as Record<string, unknown>);
      }
      if (request.method === "DELETE") return deleteEstimate(env, owner, id);
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
