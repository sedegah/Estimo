"use client";

const API_URL = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";

type ClerkBridge = { session?: { getToken(): Promise<string | null> } };

export type AdminEstimate = import("./estimate-admin").AdminEstimate;
export type AdminAuditEntry = import("./estimate-admin").AdminAuditEntry;

export type AdminEstimateDetail = {
  estimate: AdminEstimate;
  snapshot: {
    items?: { name: string; quantity: number; unit: string; priceGhs: number | null }[];
    quantities?: {
      templateId?: string;
      specLevel?: string;
      ruleSet?: string;
      specialLoads?: string[];
      spaces?: {
        id: string;
        space_name: string;
        room_type: string;
        length_m: number;
        width_m: number;
        height_m: number;
        quantity?: number;
      }[];
    };
  } | null;
};

async function token(): Promise<string | null> {
  const clerk = (window as unknown as { Clerk?: ClerkBridge }).Clerk;
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const bearer = await token();
  if (!bearer) return null;
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function listAdminEstimates(params: { q?: string; template?: string } = {}): Promise<AdminEstimate[] | null> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.template) search.set("template", params.template);
  const body = await call<{ estimates?: AdminEstimate[] }>(`/admin/estimates${search.size ? `?${search}` : ""}`);
  return body?.estimates ?? null;
}

export async function getAdminEstimate(id: string): Promise<AdminEstimateDetail | null> {
  const body = await call<{ estimate: AdminEstimate; snapshot: AdminEstimateDetail["snapshot"] }>(
    `/admin/estimates/${encodeURIComponent(id)}`,
  );
  return body ? { estimate: body.estimate, snapshot: body.snapshot } : null;
}

export async function listAudit(params: { actor?: string; entity?: string; limit?: number } = {}): Promise<AdminAuditEntry[] | null> {
  const search = new URLSearchParams();
  if (params.actor) search.set("actor", params.actor);
  if (params.entity) search.set("entity", params.entity);
  search.set("limit", String(params.limit ?? 200));
  const body = await call<{ entries?: AdminAuditEntry[] }>(`/admin/audit?${search}`);
  return body?.entries ?? null;
}

export async function revertPrice(itemId: string): Promise<{ ok: boolean; price: number | null }> {
  const body = await call<{ ok: boolean; price: number | null }>("/admin/catalogue/prices/revert", {
    method: "POST",
    body: JSON.stringify({ itemId }),
  });
  return body ?? { ok: false, price: null };
}
