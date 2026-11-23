import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

// shared total helper (same arithmetic as the saved estimate page)
if (!text.includes('from "@/lib/estimate-total"')) {
  const anchor = 'import { readBasket, writeBasket } from "@/lib/storage/basket";';
  if (!text.includes(anchor)) throw new Error("basket import not found");
  text = text.replace(anchor, 'import { pricedCount, pricedTotal } from "@/lib/estimate-total";\n' + anchor);
}

text = text.replace(
  /const total = useMemo\(\s*\(\) => lines\.reduce\(\(sum, line\) => sum \+ \(line\.amount \?\? 0\), 0\),\s*\[lines\],\s*\);/,
  "const total = useMemo(() => pricedTotal(lines), [lines]);",
);
text = text.replace(
  /const pricedCount = lines\.filter\(\(line\) => line\.unitPrice !== null\)\.length;/,
  "const pricedCountValue = pricedCount(lines);",
);
text = text.replace(/(?<![\w."])pricedCount(?!Value|,)(?!\.)/g, "pricedCountValue");

// saving files the estimate and clears it out of the basket
const oldAdd = text.match(/  \/\*\* Adds the take-off to the basket[\s\S]*?\n  \};/);
if (!oldAdd) throw new Error("addToEstimate block not found");

const newAdd = `  /** Saves the estimate to Saved projects and takes it out of the basket. */
  const addToEstimate = () => {
    const groupId = \`qty:\${templateId}:\${specLevel}\`;
    const saved = saveEstimateNow();
    if (!saved) return;

    // the estimate now lives in Saved projects, so it must not linger in the basket
    writeBasket(readBasket().filter((item) => item.groupId !== groupId));

    const where = props.signedIn ? "your account" : "this browser";
    setAdded(\`\${lines.length} materials saved to \${where}.\`);
  };`;

text = text.replace(oldAdd[0], newAdd);

const oldLabel = `            Add {lines.length} materials to estimate`;
const newLabel = `            Save estimate`;
if (text.includes(oldLabel)) text = text.replace(oldLabel, newLabel);

fs.writeFileSync(path, text);
console.log("save files the estimate and clears the basket group");
