import fs from "node:fs";

const path = "lib/estimate-total.ts";
let text = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

text = text.replace(
  `export type EstimateLine = { name?: string; quantity: number; unit?: string; priceGhs?: number | null };

export function lineAmount(line: EstimateLine): number {
  return line.priceGhs == null ? 0 : line.priceGhs * line.quantity;
}`,
  `/** A line from either the live estimate (unit price + purchase quantity) or a saved
 * estimate (price + quantity). Both are added up here, so they cannot drift. */
export type EstimateLine = {
  name?: string;
  quantity?: number;
  purchaseQuantity?: number;
  unit?: string;
  priceGhs?: number | null;
  unitPrice?: number | null;
  amount?: number | null;
};

const unitPriceOf = (line: EstimateLine): number | null => line.priceGhs ?? line.unitPrice ?? null;

const quantityOf = (line: EstimateLine): number => line.quantity ?? line.purchaseQuantity ?? 0;

export function lineAmount(line: EstimateLine): number {
  if (typeof line.amount === "number") return line.amount;
  const price = unitPriceOf(line);
  return price == null ? 0 : price * quantityOf(line);
}`,
);

text = text.replace(
  "  return lines.filter((line) => line.priceGhs != null).length;",
  "  return lines.filter((line) => unitPriceOf(line) != null).length;",
);

fs.writeFileSync(path, text);
console.log("estimate-total handles live and saved line shapes");
