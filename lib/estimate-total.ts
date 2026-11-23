/**
 * The one way to total an estimate.
 *
 * A saved estimate is a snapshot: its lines carry the price they had when it was
 * saved, and every surface (estimate page, saved estimate, PDF, basket) adds them up
 * with this function so the same estimate can never show two different totals.
 */

/** A line from either the live estimate (unit price + purchase quantity) or a saved
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
}

/** Total of the priced lines, to the pesewa. */
export function pricedTotal(lines: EstimateLine[]): number {
  return Math.round(lines.reduce((sum, line) => sum + lineAmount(line), 0) * 100) / 100;
}

export function pricedCount(lines: EstimateLine[]): number {
  return lines.filter((line) => unitPriceOf(line) != null).length;
}

export function pendingCount(lines: EstimateLine[]): number {
  return lines.length - pricedCount(lines);
}
