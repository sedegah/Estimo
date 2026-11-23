import fs from "node:fs";

const path = "components/quantities/quantity-view.tsx";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const oldTotal = `  const total = useMemo(
    () => lines.reduce((sum, line) => sum + (line.amount ?? 0), 0),
    [lines],
  );`;
const newTotal = `  const total = useMemo(() => pricedTotal(lines), [lines]);`;

const oldCount = 'const pricedCount = lines.filter((line) => line.unitPrice !== null).length;';
const newCount = 'const pricedCountValue = pricedCount(lines);';

let changed = false;
if (text.includes(oldTotal)) {
  text = text.replace(oldTotal, newTotal);
  changed = true;
}
if (text.includes(oldCount)) {
  text = text.replace(oldCount, newCount);
  changed = true;
}
text = text.replace(/(?<![\w.])pricedCount(?!Value)/g, "pricedCountValue");

if (!text.includes('from "@/lib/estimate-total"')) {
  const anchor = 'import { formatGhs } from "@/lib/format";';
  if (!text.includes(anchor)) throw new Error("format import not found");
  text = text.replace(anchor, anchor + '\nimport { pricedCount, pricedTotal } from "@/lib/estimate-total";');
}

if (!changed) throw new Error("total block not found");
fs.writeFileSync(path, text);
console.log("estimate page uses the shared total helper");
