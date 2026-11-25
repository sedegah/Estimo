import fs from "node:fs";

// 1) the signed link can now carry the itemized lines too
const tokenPath = "lib/pdf/token.ts";
let token = fs.readFileSync(tokenPath, "utf8").replace(/\r\n/g, "\n");
token = token.replace(
  "  loads?: string[];",
  `  loads?: string[];
  items?: { name: string; quantity: number; unit: string; priceGhs: number | null }[];
  total?: number;
  subtitle?: string;`,
);
fs.writeFileSync(tokenPath, token);

// 2) link route accepts and clamps those lines
const linkPath = "app/api/estimates/pdf/link/route.ts";
let link = fs.readFileSync(linkPath, "utf8").replace(/\r\n/g, "\n");
link = link.replace(
  "    loads?: unknown[];\n  };",
  `    loads?: unknown[];
    items?: { name?: unknown; quantity?: unknown; unit?: unknown; priceGhs?: unknown }[];
    total?: number;
    subtitle?: string;
  };`,
);
link = link.replace(
  "  const token = signPdfToken({ template: type.code, quality, name, counts, loads });",
  `  const items = (Array.isArray(body.items) ? body.items : [])
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
  });`,
);
fs.writeFileSync(linkPath, link);

// 3) PDF route renders the signed lines when present
const pdfPath = "app/api/estimates/pdf/route.ts";
let pdf = fs.readFileSync(pdfPath, "utf8").replace(/\r\n/g, "\n");
pdf = pdf.replace(
  "  if (link) {\n    const linkedType = projectType(link.template);",
  `  if (link) {
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
`,
);
fs.writeFileSync(pdfPath, pdf);

// 4) the estimate page gets the button
const viewPath = "components/quantities/quantity-view.tsx";
let view = fs.readFileSync(viewPath, "utf8").replace(/\r\n/g, "\n");
if (!view.includes("downloadEstimatePdf")) {
  view = view.replace(
    "  /** Every line goes in, priced or not, so the estimate shows the full take-off. */",
    `  /** Downloads the current take-off as a PDF, signed in or as a short-lived link. */
  const downloadEstimatePdf = async () => {
    const body = JSON.stringify({
      name: \`\${templateName} estimate\`,
      template: props.templateCode ?? "HOME-2B",
      specLevel,
      subtitle: \`\${spaces.length} spaces · \${specLevel}\`,
      items: lines.map((line) => ({
        name: line.catalogueName,
        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
        unit: line.catalogueUnit,
        priceGhs: line.unitPrice,
      })),
      total: pricedTotal(lines),
      specialLoads: loads,
    });

    const save = async (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = \`\${(props.templateCode ?? "estimo").toLowerCase()}-estimate.pdf\`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    const direct = await fetch("/api/estimates/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (direct.ok) {
      await save(await direct.blob());
      return;
    }
    if (direct.status !== 401) return;

    const linkResponse = await fetch("/api/estimates/pdf/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!linkResponse.ok) return;
    const signed = (await linkResponse.json()) as { url?: string };
    if (!signed.url) return;
    const linked = await fetch(signed.url);
    if (linked.ok) await save(await linked.blob());
  };

  /** Every line goes in, priced or not, so the estimate shows the full take-off. */`,
  );
  view = view.replace(
    `          <button className="btn-amber" type="button" onClick={addToEstimate} disabled={!lines.length}>`,
    `          <button className="btn-outline" type="button" onClick={() => void downloadEstimatePdf()} disabled={!lines.length}>
            Download PDF
          </button>
          <button className="btn-amber" type="button" onClick={addToEstimate} disabled={!lines.length}>`,
  );
}
fs.writeFileSync(viewPath, view);
console.log("itemized estimate downloads a PDF");
