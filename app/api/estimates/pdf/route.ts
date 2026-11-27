import { auth } from "@clerk/nextjs/server";
import { defaultCounts, projectType, type FittingQuality } from "@/lib/estimate-model";
import { buildEstimatePdf } from "@/lib/pdf/estimate-document";
import { clerkEnabled } from "@/lib/env";
import { verifyPdfToken } from "@/lib/pdf/token";

export const runtime = "nodejs";

type SavedLine = { name: string; quantity: number; unit: string; priceGhs: number | null };

const MAX_BODY_BYTES = 200_000;
const DISPLAY_CURRENCIES = new Set(["GHS", "USD", "GBP", "EUR"]);

/** Only known currencies and a sane rate reach the document. */
function displayMoney(source: { currency?: unknown; rate?: unknown }): { currency: string; rate: number } {
  const currency = typeof source.currency === "string" && DISPLAY_CURRENCIES.has(source.currency) ? source.currency : "GHS";
  const rate = typeof source.rate === "number" && Number.isFinite(source.rate) && source.rate > 0 && source.rate < 100_000 ? source.rate : 1;
  return { currency, rate: currency === "GHS" ? 1 : rate };
}

const MAX_LINES = 200;

/**
 * Estimate documents are built for signed-in accounts only: they can be expensive to
 * render and they carry the customer's take-off. Guests can view the estimate on the
 * page; downloading the document asks them to sign in.
 */
async function signedIn(): Promise<boolean> {
  if (!clerkEnabled) return true;
  const { userId } = await auth();
  return Boolean(userId);
}

function unauthorised(): Response {
  return new Response("Sign in to download this estimate.", {
    status: 401,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Streams a branded PDF for the estimate described by the query string. */
export async function GET(request: Request) {
  const url = new URL(request.url);

  // A signed link is how a guest downloads their own estimate; a session is how an
  // account does it. Anything else is refused before any work is done.
  const link = verifyPdfToken(url.searchParams.get("token"));
  if (!link && !(await signedIn())) return unauthorised();

  if (link) {
    const linkedType = projectType(link.template);

    if (link.items?.length) {
      const known = link.items.reduce((sum, line) => (line.priceGhs == null ? sum : sum + line.priceGhs * line.quantity), 0);
      const linkedPdf = await buildEstimatePdf({
        template: linkedType.code,
        quality: link.quality,
        counts: defaultCounts(linkedType.code),
        name: link.name,
        items: link.items,
        totalOverride: link.total ?? known,
        subtitle: link.subtitle,
        specialLoads: link.loads ?? [],
      });
      return pdfResponse(linkedPdf, link.name ?? linkedType.label);
    }

    const counts = defaultCounts(linkedType.code);
    for (const field of linkedType.fields) {
      const value = Number(link.counts[field.key] ?? counts[field.key] ?? 0);
      counts[field.key] = Number.isFinite(value) ? Math.max(0, Math.min(99, Math.round(value))) : 0;
    }
    const pdf = await buildEstimatePdf({
      template: linkedType.code,
      quality: link.quality,
      counts,
      name: link.name,
      specialLoads: link.loads ?? [],
    });
    return pdfResponse(pdf, link.name ?? linkedType.label);
  }
  const template = url.searchParams.get("template") ?? "HOME-2B";
  const type = projectType(template);
  const qualityParam = url.searchParams.get("quality");
  const quality: FittingQuality = qualityParam === "basic" || qualityParam === "premium" ? qualityParam : "standard";

  const counts = defaultCounts(type.code);
  for (const field of type.fields) {
    const raw = url.searchParams.get(field.key);
    if (raw !== null && raw !== "") counts[field.key] = Math.max(0, Math.min(99, Number(raw) || 0));
  }

  const name = url.searchParams.get("name")?.trim().slice(0, 80) || undefined;
  // load keys confirmed with the customer, listed on the estimate but not priced
  const specialLoads = (url.searchParams.get("loads") ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean)
    .slice(0, 20);
  const pdf = await buildEstimatePdf({ template: type.code, quality, counts, name, specialLoads });

  return pdfResponse(pdf, name ?? type.label);
}

/**
 * Renders the saved estimate exactly as the app shows it: its own priced lines,
 * total and special loads. Used by the saved estimate page so the document and the
 * screen can never disagree.
 */
export async function POST(request: Request) {
  if (!(await signedIn())) return unauthorised();

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new Response("Estimate too large", { status: 413 });
  }

  let body: {
    name?: string;
    template?: string;
    specLevel?: string;
    subtitle?: string;
    items?: SavedLine[];
    total?: number;
    specialLoads?: string[];
    specialLoadSummaries?: string[];
    specialLoadsDetail?: { name?: string; sizing?: string; status?: string; costGhs?: number | null }[];
    specialLoadsSubtotal?: number | null;
    specialLoadsPending?: number;
  };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const template = body.template ?? "HOME-2B";
  const type = projectType(template);
  const quality: FittingQuality =
    body.specLevel === "economy" ? "basic" : body.specLevel === "premium" ? "premium" : "standard";

  const items = (Array.isArray(body.items) ? body.items : [])
    .filter((line) => typeof line?.name === "string" && Number.isFinite(line.quantity))
    .slice(0, MAX_LINES)
    .map((line) => ({
      name: line.name.slice(0, 90),
      quantity: Math.max(0, Math.round(line.quantity)),
      unit: typeof line.unit === "string" ? line.unit.slice(0, 20) : "No.",
      priceGhs: typeof line.priceGhs === "number" ? line.priceGhs : null,
    }));

  const known = items.reduce((sum, line) => (line.priceGhs == null ? sum : sum + line.priceGhs * line.quantity), 0);
  const total = typeof body.total === "number" && Number.isFinite(body.total) ? body.total : known;
  const name = body.name?.trim().slice(0, 80) || type.label;

  const pdf = await buildEstimatePdf({
    template: type.code,
    quality,
    counts: defaultCounts(type.code),
    name,
    items,
    totalOverride: total,
    subtitle: typeof body.subtitle === "string" ? body.subtitle.slice(0, 120) : undefined,
    ...displayMoney(body as { currency?: unknown; rate?: unknown }),
    specialLoads: (Array.isArray(body.specialLoads) ? body.specialLoads : [])
      .filter((key) => typeof key === "string")
      .slice(0, 20),
    specialLoadSummaries: (Array.isArray(body.specialLoadSummaries) ? body.specialLoadSummaries : [])
      .filter((line): line is string => typeof line === "string" && line.trim().length > 0)
      .map((line) => line.slice(0, 160))
      .slice(0, 20),
    specialLoadsDetail: (Array.isArray(body.specialLoadsDetail) ? body.specialLoadsDetail : [])
      .filter((row) => row && typeof row.name === "string")
      .slice(0, 20)
      .map((row) => ({
        name: String(row.name).slice(0, 60),
        sizing: typeof row.sizing === "string" ? row.sizing.slice(0, 90) : "",
        status: typeof row.status === "string" ? row.status.slice(0, 40) : "",
        costGhs: typeof row.costGhs === "number" && Number.isFinite(row.costGhs) ? row.costGhs : null,
      })),
    specialLoadsSubtotal:
      typeof body.specialLoadsSubtotal === "number" && Number.isFinite(body.specialLoadsSubtotal)
        ? body.specialLoadsSubtotal
        : null,
    specialLoadsPending:
      typeof body.specialLoadsPending === "number" && Number.isFinite(body.specialLoadsPending)
        ? Math.max(0, Math.round(body.specialLoadsPending))
        : 0,
  });

  return pdfResponse(pdf, name);
}

function pdfResponse(pdf: Uint8Array, name: string): Response {
  const filename = `${name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "estimo"}.pdf`;
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // built fresh for every request: never served from a browser or edge cache
      "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
