import fs from "node:fs";

const path = "lib/estimate-model.ts";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// Labour is out of the estimate for now; the shares are re-normalised over materials.
text = text.replace(
  `  { label: "Earthing", share: 0.06 },
  { label: "Labour", share: 0.24 },
];`,
  `  { label: "Earthing", share: 0.06 },
];`,
);
text = text.replace('    Labour: "1 lot",\n', "");

fs.writeFileSync(path, text);
console.log("labour removed from the allowance lines");
