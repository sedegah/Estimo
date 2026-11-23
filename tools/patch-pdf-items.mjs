import fs from "node:fs";

const path = "lib/pdf/estimate-document.ts";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// 1) inputs: an estimate built from the quantity engine can supply its own lines
text = text.replace(
  `  /** Load keys confirmed outside the estimate, listed but not priced. */
  specialLoads?: string[];
};`,
  `  /** Load keys confirmed outside the estimate, listed but not priced. */
  specialLoads?: string[];
  /** When present these priced lines are printed exactly as the app shows them. */
  items?: { name: string; quantity: number; unit: string; priceGhs: number | null }[];
  /** Total of those lines; defaults to their sum. */
  totalOverride?: number;
  subtitle?: string;
};`,
);

// 2) compute from the supplied lines when there are any
text = text.replace(
  `export async function buildEstimatePdf({ template, quality, counts, name, issuedAt = new Date(), specialLoads = [] }: Input): Promise<Uint8Array> {
  const type = projectType(template);
  const total = computeEstimate(type.code, counts, quality);
  const lines = estimateLines(total, type.code, counts);
  const fittings = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const spaces = totalSpaces(counts);`,
  `export async function buildEstimatePdf({ template, quality, counts, name, issuedAt = new Date(), specialLoads = [], items, totalOverride, subtitle }: Input): Promise<Uint8Array> {
  const type = projectType(template);
  const model = computeEstimate(type.code, counts, quality);
  const quantityLines = items?.map((line) => {
    const amount = line.priceGhs == null ? 0 : line.priceGhs * line.quantity;
    return {
      label: line.name,
      quantity: line.unit === "No." ? String(line.quantity) : \`\${line.quantity} \${line.unit === "length" ? "lengths" : line.unit}\`,
      unitPrice: line.priceGhs ?? 0,
      amount,
      pending: line.priceGhs == null,
    };
  });
  const total = totalOverride ?? (quantityLines ? quantityLines.reduce((sum, line) => sum + line.amount, 0) : model);
  const lines = quantityLines ?? estimateLines(model, type.code, counts);
  const fittings = FITTINGS.find((entry) => entry.value === quality)?.label ?? "Standard";
  const spaces = totalSpaces(counts);`,
);

// 3) subtitle line uses the supplied text when provided
text = text.replace(
  "page.drawText(`${type.label} · ${fittings} fittings · ${spaces} spaces`, {",
  'page.drawText(subtitle ?? `${type.label} · ${fittings} fittings · ${spaces} spaces`, {',
);

// 4) pending prices print as Pending instead of GHS 0
text = text.replace(
  "    rightText(page, money(line.unitPrice), columns.unit, y - 17, 9.5, font, MUTED);\n    rightStrong(page, money(line.amount), columns.amount, y - 17, 9.5, bold, NAVY);",
  '    if ("pending" in line && line.pending) {\n      rightText(page, "Pending", columns.unit, y - 17, 9.5, font, MUTED);\n      rightText(page, "—", columns.amount, y - 17, 9.5, font, MUTED);\n    } else {\n      rightText(page, money(line.unitPrice), columns.unit, y - 17, 9.5, font, MUTED);\n      rightStrong(page, money(line.amount), columns.amount, y - 17, 9.5, bold, NAVY);\n    }',
);

fs.writeFileSync(path, text);
console.log("pdf builder accepts priced lines");
