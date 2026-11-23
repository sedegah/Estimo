import fs from "node:fs";

const path = "lib/quantity-engine/catalogue.ts";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldBlock = `    const unitLength = link.unitLength ?? 3;
    const convert = link.convert === "metres-to-lengths";
    const quantity = convert
      ? Math.ceil(material.engineering_quantity / unitLength)
      : material.engineering_quantity;
    const purchase = convert ? quantity * unitLength : material.purchase_quantity;`;

const newBlock = `    // Everything a person sees is in catalogue units: lengths of conduit, metres of
    // cable, pieces of accessories. The engineering quantity stays in metres.
    const unitLength = link.unitLength ?? 3;
    const convert = link.convert === "metres-to-lengths";
    const quantity = convert
      ? Math.ceil(material.engineering_quantity / unitLength)
      : material.purchase_quantity;
    const purchase = quantity;`;

if (!text.includes(oldBlock)) throw new Error("priceQuantities block not found");
text = text.replace(oldBlock, newBlock);
fs.writeFileSync(path, text);
console.log("priced lines now count in catalogue units");
