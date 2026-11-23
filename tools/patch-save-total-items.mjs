import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

text = text.replace(
  "    const saveLines = priceQuantities(result.materialQuantities, pricesNow, catalogueMap);\n    const saveTotal = pricedTotal(saveLines);",
  `    const saveLines = priceQuantities(result.materialQuantities, pricesNow, catalogueMap);
    const saveItems = saveLines.map((line) => ({
      name: line.catalogueName,
      quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
      unit: line.catalogueUnit,
      priceGhs: line.unitPrice,
    }));
    const saveTotal = pricedTotal(saveItems);`,
);

text = text.replace(
  `      items: saveLines.map((line) => ({
        name: line.catalogueName,
        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
        unit: line.catalogueUnit,
        priceGhs: line.unitPrice,
      })),`,
  `      items: saveItems,`,
);

fs.writeFileSync(path, text);
console.log("saved total computed from the saved items");
