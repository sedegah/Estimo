import fs from "node:fs";

const modelPath = "lib/estimate-model.ts";
let model = fs.readFileSync(modelPath, "utf8").replace(/\r\n/g, "\n");

if (!model.includes("const shareTotal")) {
  model = model.replace(
    "  return LINES.map(({ label, share }) => {\n    const amount = Math.round((total * share) / 10) * 10;",
    "  const shareTotal = LINES.reduce((sum, line) => sum + line.share, 0);\n\n  return LINES.map(({ label, share }) => {\n    const amount = Math.round((total * (share / shareTotal)) / 10) * 10;",
  );
  fs.writeFileSync(modelPath, model);
  console.log("allowance shares normalised over materials");
}

const pdfPath = "lib/pdf/estimate-document.ts";
let pdf = fs.readFileSync(pdfPath, "utf8").replace(/\r\n/g, "\n");
pdf = pdf.replace('"Materials and labour."', '"Materials only."');
pdf = pdf.replace(
  '"Cables and conduit, sockets and switches, light fittings, distribution board and breakers,"',
  '"Cables and conduit, sockets and switches, light fittings, distribution board and breakers"',
);
pdf = pdf.replace(
  '"earthing and labour are allowance groups from the ESTIMO staging model.",',
  '"and earthing are allowance groups from the ESTIMO staging model. Labour is quoted separately.",',
);
fs.writeFileSync(pdfPath, pdf);
console.log("pdf copy no longer claims labour is included");
