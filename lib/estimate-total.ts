/**
 * The one way to total an estimate.
 *
 * A saved estimate is a snapshot: its lines carry the price they had when it was
 * saved, and every surface (estimate page, saved estimate, PDF, basket) adds them up
 * with this function so the same estimate can never show two different totals.
 */

export type EstimateLine = { name?: string; quantity: number; unit?: string; priceGhs?: number | null };

export function lineAmount(line: EstimateLine): number {
  return line.priceGhs == null ? 0 : line.priceGhs * line.quantity;
}

/** Total of the priced lines, to the pesewa. */
export function pricedTotal(lines: EstimateLine[]): number {
  return Math.round(lines.reduce((sum, line) => sum + lineAmount(line), 0) * 100) / 100;
}

export function pricedCount(lines: EstimateLine[]): number {
  return lines.filter((line) => line.priceGhs != null).length;
}

export function pendingCount(lines: EstimateLine[]): number {
  return lines.length - pricedCount(lines);
}
