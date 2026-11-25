import { calculate, getTemplateSpaces } from "../lib/quantity-engine/index.ts";
import { priceQuantities } from "../lib/quantity-engine/catalogue.ts";
import { CATALOGUE_MATERIALS } from "../lib/data/catalogue.ts";

const api = "https://estimo-api.sedegahkimathi.workers.dev/catalogue";
const body = await (await fetch(api)).json();
const prices = {};
for (const item of body.items ?? []) {
  if (typeof item.price_ghs === "number") prices[item.id] = { price: item.price_ghs, brand: null, source: null, updatedAt: null };
}
const catalogue = new Map(CATALOGUE_MATERIALS.map((m) => [m.id, { id: m.id, name: m.name, unit: m.unit }]));
const spaces = getTemplateSpaces("T011");
const template = { projectType: "two_bedroom" };

function run(loads) {
  const result = calculate({ templateId: "T011", specLevel: "standard", spaces, projectType: template.projectType, specialLoads: loads });
  const lines = priceQuantities(result.materialQuantities, prices, catalogue);
  const total = Math.round(lines.reduce((sum, line) => sum + (line.amount ?? 0), 0) * 100) / 100;
  return { result, lines, total };
}

const base = run([]);
console.log(`base: GHS ${base.total} · ${base.lines.length} lines`);
const keys = base.lines.map((line) => line.catalogueId);

const loads = JSON.parse(await (await import("node:fs/promises")).readFile("lib/data/quantity-engine/special_loads.json", "utf8"));
for (const load of loads) {
  const withLoad = run([load.load_key]);
  const added = withLoad.lines.filter((line) => !keys.includes(line.catalogueId));
  const pending = added.filter((line) => line.unitPrice === null).map((line) => line.catalogueName);
  console.log(
    `${load.load_key.padEnd(24)} +GHS ${String(Math.round((withLoad.total - base.total) * 100) / 100).padStart(8)} · +${added.length} lines` +
      (pending.length ? ` · pending: ${pending.join(", ")}` : ""),
  );
}
