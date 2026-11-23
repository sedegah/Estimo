import fs from "node:fs";

const path = "lib/quantity-engine/catalogue.ts";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldMerge = `    if (existing) {
      existing.quantity = Math.round((existing.quantity + quantity) * 10) / 10;
      existing.engineeringQuantity = Math.round((existing.engineeringQuantity + material.engineering_quantity) * 10) / 10;
      existing.purchaseQuantity = Math.round((existing.purchaseQuantity + purchase) * 10) / 10;
      existing.trace = [...existing.trace, ...material.trace];
      continue;
    }`;

const newMerge = `    if (existing) {
      existing.quantity = Math.round((existing.quantity + quantity) * 10) / 10;
      existing.engineeringQuantity = Math.round((existing.engineeringQuantity + material.engineering_quantity) * 10) / 10;
      existing.purchaseQuantity = Math.round((existing.purchaseQuantity + purchase) * 10) / 10;
      // a merged line (phase + neutral, for example) must total both runs
      existing.amount =
        existing.unitPrice == null ? null : Math.round(existing.unitPrice * existing.quantity * 100) / 100;
      existing.trace = [...existing.trace, ...material.trace];
      continue;
    }`;

if (!text.includes(oldMerge)) throw new Error("merge block not found");
text = text.replace(oldMerge, newMerge);
fs.writeFileSync(path, text);
console.log("merged priced lines now total every run");
