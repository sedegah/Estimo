// Recomputes the priced total for a few templates so the number can be traced.
import { calculate, getTemplateSpaces, getTemplate } from "../lib/quantity-engine/index.ts";
import { priceQuantities } from "../lib/quantity-engine/catalogue.ts";
import { CATALOGUE_MATERIALS } from "../lib/data/catalogue.ts";

const response = await fetch("https://estimo-api.sedegahkimathi.workers.dev/catalogue");
const body = await response.json();
const prices = {};
for (const item of body.items ?? []) {
  if (typeof item.price_ghs === "number") {
    prices[item.id] = { price: item.price_ghs, brand: item.price_brand ?? null, source: item.price_source ?? null, updatedAt: item.price_updated_at ?? null };
  }
}
const catalogue = new Map();
for (const material of CATALOGUE_MATERIALS) catalogue.set(material.id, { id: material.id, name: material.name, unit: material.unit });

for (const templateId of ["T011", "T014", "T017"]) {
  const template = getTemplate(templateId);
  const spaces = getTemplateSpaces(templateId);
  for (const specLevel of ["standard", "premium"]) {
    const result = calculate({ templateId, specLevel, spaces, projectType: template.projectType });
    const lines = priceQuantities(result.materialQuantities, prices, catalogue);
    const priced = lines.filter((line) => line.unitPrice !== null);
    const total = priced.reduce((sum, line) => sum + (line.amount ?? 0), 0);
    console.log(
      `${templateId} ${specLevel}: ${priced.length}/${lines.length} priced -> GHS ${total.toFixed(2)}` +
        `  (${template.name}, ${result.totals.floor_area_m2} m2)`,
    );
    for (const line of priced) {
      console.log(`   ${line.catalogueName}: ${line.purchaseQuantity} ${line.catalogueUnit} x ${line.unitPrice} = ${(line.amount ?? 0).toFixed(2)}`);
    }
  }
}
