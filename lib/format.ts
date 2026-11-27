/** Display formatting helpers (Ghana locale, display currency aware).
 *
 * The currency module publishes the chosen currency and rates on globalThis so this
 * module stays free of imports and remains loadable by node --test.
 */
type MoneyState = { currency: "GHS" | "USD" | "GBP" | "EUR"; rates: Record<string, number> };
const moneyState = (): MoneyState =>
  (globalThis as { __estimoMoney?: MoneyState }).__estimoMoney ?? {
    currency: "GHS",
    rates: { GHS: 1, USD: 0.084, GBP: 0.064, EUR: 0.077 },
  };

export function formatGhs(value: number, fractionDigits = 2): string {
  const { currency, rates } = moneyState();
  const converted = value * (rates[currency] ?? 1);
  // a whole-cedi amount converted to dollars needs its cents, or $0.51 prints as $1
  const digits = currency === "GHS" ? fractionDigits : Math.max(2, fractionDigits);
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(converted);
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

/** Counted stock reads "pcs", not "No."; measured stock keeps its own word. */
export function unitLabel(unit: string): string {
  if (unit === "No.") return "pcs";
  if (unit === "length") return "lengths";
  if (unit === "box") return "boxes";
  if (unit === "bag") return "bags";
  if (unit === "set") return "sets";
  if (unit === "lot") return "lots";
  return unit.toLowerCase();
}

/** "per metre", "each", ... — the basis a catalogue price is quoted on. */
export function materialUnitLabel(unit: string): string {
  return UNIT_LABELS[unit] ?? `per ${unit.toLowerCase()}`;
}

/** Price text with the unit basis attached: "GHS 382.76 per metre". Single pieces
 * ("No.") are quoted on their own, so no basis is appended: "GHS 15". */
export function formatPrice(price: number, unit: string): string {
  const amount = formatGhs(price, Number.isInteger(price) ? 0 : 2);
  return unit === "No." ? amount : `${amount} ${materialUnitLabel(unit)}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
