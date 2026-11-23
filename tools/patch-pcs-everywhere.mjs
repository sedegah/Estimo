import fs from "node:fs";

// 1) one unit vocabulary for the whole product
const formatPath = "lib/format.ts";
let format = fs.readFileSync(formatPath, "utf8").replace(/\r\n/g, "\n");
if (!format.includes("export function unitLabel")) {
  format = format.replace(
    '/** "per metre", "each", ... — the basis a catalogue price is quoted on. */',
    `/** Counted stock reads "pcs", not "No."; measured stock keeps its own word. */
export function unitLabel(unit: string): string {
  if (unit === "No.") return "pcs";
  if (unit === "length") return "lengths";
  if (unit === "box") return "boxes";
  if (unit === "bag") return "bags";
  if (unit === "set") return "sets";
  if (unit === "lot") return "lots";
  return unit.toLowerCase();
}

/** "per metre", "each", ... — the basis a catalogue price is quoted on. */`,
  );
  fs.writeFileSync(formatPath, format);
  console.log("format: unitLabel added");
}

// 2) saved estimate table
const savedPath = "app/(app)/projects/[id]/page.tsx";
let saved = fs.readFileSync(savedPath, "utf8").replace(/\r\n/g, "\n");
saved = saved.replace(
  '<td className="muted-cell">{line.quantity} {line.unit}</td>',
  '<td className="muted-cell">{line.quantity} {unitLabel(line.unit)}</td>',
);
saved = saved.replace(
  'import { pricedCount, pricedTotal } from "@/lib/estimate-total";',
  'import { pricedCount, pricedTotal } from "@/lib/estimate-total";\nimport { unitLabel } from "@/lib/format";',
);
fs.writeFileSync(savedPath, saved);

// 3) estimate page uses the shared vocabulary
const viewPath = "components/quantities/quantity-view.tsx";
let view = fs.readFileSync(viewPath, "utf8").replace(/\r\n/g, "\n");
view = view.replace(
  `<span className="quantities-unit">{UNIT_LABEL[line.catalogueUnit] ?? line.catalogueUnit.toLowerCase()}</span>`,
  `<span className="quantities-unit">{unitLabel(line.catalogueUnit)}</span>`,
);
if (!view.includes("unitLabel")) {
  view = view.replace(
    'import { pricedCount, pricedTotal } from "@/lib/estimate-total";',
    'import { pricedCount, pricedTotal } from "@/lib/estimate-total";\nimport { unitLabel } from "@/lib/format";',
  );
}
fs.writeFileSync(viewPath, view);

// 4) PDF quantity column
const pdfPath = "lib/pdf/estimate-document.ts";
let pdf = fs.readFileSync(pdfPath, "utf8").replace(/\r\n/g, "\n");
pdf = pdf.replace(
  'quantity: line.unit === "No." ? String(line.quantity) : `${line.quantity} ${line.unit === "length" ? "lengths" : line.unit}`,',
  'quantity: `${line.quantity} ${unitLabel(line.unit)}`,',
);
if (!pdf.includes("unitLabel")) {
  pdf = pdf.replace(
    'import { buildEstimatePdf } from "@/lib/pdf/estimate-document";',
    'import { buildEstimatePdf } from "@/lib/pdf/estimate-document";',
  );
  const anchor = 'import {\n  FITTINGS,';
  pdf = pdf.replace(anchor, 'import { unitLabel } from "@/lib/format";\n' + anchor);
}
fs.writeFileSync(pdfPath, pdf);
console.log("saved table, estimate table and PDF all say pcs");
