import { projectType, type FittingQuality } from "@/lib/estimate-model";
import { signPdfToken } from "@/lib/pdf/token";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 8_000;

/**
 * Issues a short-lived link for a guest's estimate. The payload is signed, not stored:
 * the PDF route can verify it without a session and without a database write, and the
 * link stops working after ten minutes.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return new Response("Estimate too large", { status: 413 });

  let body: {
    template?: string;
    quality?: string;
    name?: string;
    counts?: Record<string, unknown>;
    loads?: unknown[];
    items?: { name?: unknown; quantity?: unknown; unit?: unknown; priceGhs?: unknown }[];
    total?: number;
    subtitle?: string;
    currency?: string;
    rate?: number;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const template = typeof body.template === "string" ? body.template : "HOME-2B";
  const type = projectType(template);
  const quality: FittingQuality =
    body.quality === "basic" ? "basic" : body.quality === "premium" ? "premium" : "standard";

  // Only the fields this project type actually uses are accepted, and every count is
  // clamped, so a token cannot ask for an absurd document.
  const counts: Record<string, number> = {};
  for (const field of type.fields) {
    const value = Number((body.counts ?? {})[field.key] ?? 0);
    counts[field.key] = Number.isFinite(value) ? Math.max(0, Math.min(99, Math.round(value))) : 0;
  }

  const loads = Array.isArray(body.loads)
    ? body.loads.filter((key): key is string => typeof key === "string").slice(0, 20)
    : [];

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 80) : undefined;

  const items = (Array.isArray(body.items) ? body.items : [])
    .filter((line) => typeof line?.name === "string" && Number.isFinite(Number(line.quantity)))
    .slice(0, 200)
    .map((line) => ({
      name: String(line.name).slice(0, 90),
      quantity: Math.max(0, Math.round(Number(line.quantity))),
      unit: typeof line.unit === "string" ? line.unit.slice(0, 20) : "No.",
      priceGhs: typeof line.priceGhs === "number" ? line.priceGhs : null,
    }));

  const token = signPdfToken({
    template: type.code,
    quality,
    name,
    counts,
    loads,
    items: items.length ? items : undefined,
    total: typeof body.total === "number" && Number.isFinite(body.total) ? body.total : undefined,
    subtitle: typeof body.subtitle === "string" ? body.subtitle.slice(0, 120) : undefined,
    currency: typeof body.currency === "string" && ["GHS", "USD", "GBP", "EUR"].includes(body.currency) ? body.currency : undefined,
    rate: typeof body.rate === "number" && Number.isFinite(body.rate) && body.rate > 0 ? body.rate : undefined,
  });
  return Response.json(
    { url: `/api/estimates/pdf?token=${encodeURIComponent(token)}`, expiresInSeconds: 600 },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  return new Response("Use POST to request a download link.", { status: 405 });
}
