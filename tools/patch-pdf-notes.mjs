import fs from "node:fs";

const path = "lib/pdf/estimate-document.ts";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// the right-hand notes describe what the total actually covers
text = text.replace(
  `  rightText(page, "Materials and labour.", cardRight, y - 30, 8.5, font, MUTED);
  rightText(page, "Illustrative planning figure, not a quotation.", cardRight, y - 43, 8.5, font, MUTED);`,
  `  rightText(page, quantityLines ? "Materials only, at catalogue prices." : "Materials and labour.", cardRight, y - 30, 8.5, font, MUTED);
  rightText(page, quantityLines ? "Preliminary take-off, not a quotation." : "Illustrative planning figure, not a quotation.", cardRight, y - 43, 8.5, font, MUTED);`,
);

// the build-up note only belongs to the allowance model
text = text.replace(
  `  strongText(page, "How this is built up", { x: margin, y, size: 10, font: bold, color: NAVY });
  y -= 16;
  const notes = [
    "Cables and conduit, sockets and switches, light fittings, distribution board and breakers,",
    "earthing and labour are allowance groups from the ESTIMO staging model.",
    "Prices are planning assumptions and are not verified supplier prices.",
  ];`,
  `  strongText(page, quantityLines ? "Basis" : "How this is built up", { x: margin, y, size: 10, font: bold, color: NAVY });
  y -= 16;
  const notes = quantityLines
    ? [
        "Quantities from the ESTIMO-GH-QTY-v1.0 rule set for the spaces in this estimate.",
        "Prices are catalogue prices at the time of issue; lines marked Pending are excluded",
        "from the total until a price is published.",
      ]
    : [
        "Cables and conduit, sockets and switches, light fittings, distribution board and breakers,",
        "earthing and labour are allowance groups from the ESTIMO staging model.",
        "Prices are planning assumptions and are not verified supplier prices.",
      ];`,
);

fs.writeFileSync(path, text);
console.log("pdf notes now match the total they describe");
