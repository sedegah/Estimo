/** Display formatting helpers (Ghana locale). */

export function formatGhs(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

/** Whole-cedi amounts, or null when the value is unknown. */
export function formatGhsOrNull(value: number | null): string | null {
  return value == null ? null : formatGhs(value, 0);
}

const UNIT_LABELS: Record<string, string> = {
  m: "per metre",
  "No.": "each",
  length: "per length",
  roll: "per roll",
  set: "per set",
  strip: "per strip",
  lot: "per lot",
  bag: "per bag",
  coil: "per coil",
  box: "per box",
  pack: "per pack",
  pair: "per pair",
};

/** "per metre", "each", ... — the basis a catalogue price is quoted on. */
export function materialUnitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? `per ${unit.toLowerCase()}`;
}

/** Price text with the unit basis attached: "GHS 382.76 per metre". Single pieces
 * ("No.") are quoted on their own, so no basis is appended: "GHS 15". */
export function formatPrice(price: number, unit: string): string {
  const amount = Number.isInteger(price) ? price.toLocaleString("en-GH") : price.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return unit === "No." ? `GHS ${amount}` : `GHS ${amount} ${materialUnitLabel(unit)}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
