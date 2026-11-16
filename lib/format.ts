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

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
