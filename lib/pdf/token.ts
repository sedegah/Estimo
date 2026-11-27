import crypto from "node:crypto";

/**
 * Short-lived, tamper-proof links for estimate PDFs.
 *
 * A guest can preview an estimate without an account, so the document is issued on a
 * signed link instead of an open endpoint: the payload travels inside the token, the
 * server never stores it, and it stops working after a few minutes.
 */

export type PdfLinkPayload = {
  template: string;
  quality: "basic" | "standard" | "premium";
  name?: string;
  counts: Record<string, number>;
  loads?: string[];
  items?: { name: string; quantity: number; unit: string; priceGhs: number | null }[];
  total?: number;
  subtitle?: string;
  /** Display currency the document should print, and its cedi rate. */
  currency?: string;
  rate?: number;
  /** Unix seconds. */
  exp: number;
};

export const PDF_LINK_TTL_SECONDS = 10 * 60;

function secret(): string {
  return (
    process.env.ESTIMO_PDF_SECRET ??
    process.env.CLERK_SECRET_KEY ??
    "estimo-local-development-only-secret"
  );
}

const encode = (value: string): string => Buffer.from(value, "utf8").toString("base64url");

const sign = (body: string): string =>
  crypto.createHmac("sha256", secret()).update(body).digest("base64url");

export function signPdfToken(payload: Omit<PdfLinkPayload, "exp">, ttlSeconds = PDF_LINK_TTL_SECONDS): string {
  const withExpiry: PdfLinkPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const body = encode(JSON.stringify(withExpiry));
  return `${body}.${sign(body)}`;
}

/** Returns the payload, or null when the token is forged, damaged or expired. */
export function verifyPdfToken(token: string | null | undefined): PdfLinkPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !crypto.timingSafeEqual(given, wanted)) return null;

  let payload: PdfLinkPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PdfLinkPayload;
  } catch {
    return null;
  }

  if (!payload || typeof payload.template !== "string") return null;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (!payload.counts || typeof payload.counts !== "object") return null;

  return payload;
}
