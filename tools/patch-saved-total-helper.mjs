import fs from "node:fs";

const path = "app/(app)/projects/[id]/page.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// one total, computed from the saved lines
text = text.replace(
  `    const area = takeOff.spaces.reduce(
      (sum, space) => sum + space.length_m * space.width_m * Math.max(1, space.quantity ?? 1),
      0,
    );`,
  `    const area = takeOff.spaces.reduce(
      (sum, space) => sum + space.length_m * space.width_m * Math.max(1, space.quantity ?? 1),
      0,
    );
    const savedItems = project.items ?? [];
    const savedTotal = savedItems.length ? pricedTotal(savedItems) : project.totalGhs;`,
);

text = text.replace(
  `      const items = project.items ?? [];
      const known = items.reduce((sum, line) => (line.priceGhs == null ? sum : sum + line.priceGhs * line.quantity), 0);
      const response = await fetch("/api/estimates/pdf", {`,
  `      const items = savedItems;
      const response = await fetch("/api/estimates/pdf", {`,
);

text = text.replace(
  `          total: project.totalGhs ?? Math.round(known * 100) / 100,`,
  `          total: savedTotal ?? undefined,`,
);

text = text.replace(
  `                    {project.totalGhs != null
                      ? formatGhs(project.totalGhs)
                      : formatGhs(project.items.reduce((sum, line) => sum + (line.priceGhs == null ? 0 : line.priceGhs * line.quantity), 0))}`,
  `                    {savedTotal != null ? formatGhs(savedTotal) : "Pending"}`,
);

text = text.replace(
  `                      {project.items.filter((line) => line.priceGhs != null).length} of {project.items.length} priced`,
  `                      {pricedCount(savedItems)} of {savedItems.length} priced`,
);

text = text.replace(
  `              {project.totalGhs != null ? \` · \${formatGhs(project.totalGhs)}\` : ""}`,
  `              {savedTotal != null ? \` · \${formatGhs(savedTotal)}\` : ""}`,
);

if (!text.includes("pricedTotal")) throw new Error("total helper not wired");
if (!text.includes('from "@/lib/estimate-total"')) {
  const importLine = 'import { formatDate, formatGhs } from "@/lib/format";';
  if (!text.includes(importLine)) throw new Error("format import not found");
  text = text.replace(importLine, importLine + '\nimport { pricedCount, pricedTotal } from "@/lib/estimate-total";');
}

fs.writeFileSync(path, text);
console.log("saved estimate totals come from the shared helper");
