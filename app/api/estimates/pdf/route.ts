import { defaultCounts, projectType, type FittingQuality } from "@/lib/estimate-model";
import { buildEstimatePdf } from "@/lib/pdf/estimate-document";

export const runtime = "nodejs";

/** Streams a branded PDF for the estimate described by the query string. */
export async function GET(request: Request) {
  const url = new URL(request.url);
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
  const pdf = await buildEstimatePdf({ template: type.code, quality, counts, name });

  const filename = `${(name ?? type.label).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "estimo"}.pdf`;

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
