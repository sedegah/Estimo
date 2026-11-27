/**
 * Display currency.
 *
 * Every price in the app is stored in cedis. This module converts for display only: the
 * estimate, the saved project and the PDF stay in GHS, so a rate change never alters
 * what an estimate is worth. Rates come from exchangerate-api's free endpoint (GHS base,
 * CORS enabled) and are cached for half a day; a small fallback keeps the UI sensible
 * offline.
 */
export type CurrencyCode = "GHS" | "USD" | "GBP" | "EUR";

export const CURRENCIES: { code: CurrencyCode; label: string; short: string; symbol: string }[] = [
  { code: "GHS", label: "Cedis", short: "GHS", symbol: "GH₵" },
  { code: "USD", label: "US dollar", short: "USD", symbol: "$" },
  { code: "GBP", label: "Pound", short: "GBP", symbol: "£" },
  { code: "EUR", label: "Euro", short: "EUR", symbol: "€" },
];

const CURRENCY_KEY = "estimo_currency_v1";
const RATE_KEY = "estimo_exchange_rates_v1";
const RATE_URL = "https://open.er-api.com/v6/latest/GHS";
const API_BASE = (
  process.env.NEXT_PUBLIC_ESTIMO_API_URL?.trim() || "https://estimo-api.sedegahkimathi.workers.dev"
).replace(/\/$/, "");
/** Our worker keeps the daily rates in D1; the provider is the fallback. */
const API_RATES_URL = `${API_BASE}/rates`;
const RATE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

/** Used only until the first fetch succeeds; roughly the current market. */
const FALLBACK_RATES: Record<CurrencyCode, number> = { GHS: 1, USD: 0.084, GBP: 0.064, EUR: 0.077 };

let display: CurrencyCode = "GHS";
let rates: Record<CurrencyCode, number> = { ...FALLBACK_RATES };
let ratesUpdatedAt: string | null = null;

/**
 * format.ts is deliberately import-free, so the chosen currency and rates are published
 * on globalThis for it to read. Publishing the market fallbacks at module load means a
 * dollar price is never accidentally 1:1 with a cedi one, even before the first fetch.
 */
function publish(): void {
  (globalThis as { __estimoMoney?: { currency: CurrencyCode; rates: Record<CurrencyCode, number> } }).__estimoMoney = {
    currency: display,
    rates,
  };
}
publish();

export const isCurrency = (value: unknown): value is CurrencyCode =>
  value === "GHS" || value === "USD" || value === "GBP" || value === "EUR";

export function readStoredCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "GHS";
  const saved = window.localStorage.getItem(CURRENCY_KEY);
  return isCurrency(saved) ? saved : "GHS";
}

export function storeCurrency(code: CurrencyCode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENCY_KEY, code);
}

export function setDisplayCurrency(code: CurrencyCode): void {
  display = code;
  publish();
}

export function getDisplayCurrency(): CurrencyCode {
  return display;
}

export function getExchangeRates(): Record<CurrencyCode, number> {
  return rates;
}

export function ratesAsOf(): string | null {
  return ratesUpdatedAt;
}

/** Sets rates directly (tests, or a cached copy loaded by the provider). */
export function setExchangeRates(next: Partial<Record<CurrencyCode, number>>, asOf = new Date().toISOString()): void {
  const merged = { ...rates };
  for (const code of ["GHS", "USD", "GBP", "EUR"] as const) {
    const value = next[code];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) merged[code] = value;
  }
  rates = merged;
  ratesUpdatedAt = asOf;
  publish();
}

function applyRates(payload: unknown): boolean {
  const body = payload as { rates?: Record<string, unknown> } | null;
  const source = body?.rates;
  if (!source) return false;
  const next = { ...FALLBACK_RATES };
  let seen = 0;
  for (const code of ["USD", "GBP", "EUR"] as const) {
    const value = Number(source[code]);
    if (Number.isFinite(value) && value > 0) {
      next[code] = value;
      seen += 1;
    }
  }
  if (!seen) return false;
  rates = next;
  ratesUpdatedAt = new Date().toISOString();
  publish();
  return true;
}

function readCache(): { rates: Record<string, number>; fetchedAt: number; updatedAt: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RATE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { rates?: Record<string, number>; fetchedAt?: number; updatedAt?: string };
    if (!parsed.rates || typeof parsed.fetchedAt !== "number") return null;
    return { rates: parsed.rates, fetchedAt: parsed.fetchedAt, updatedAt: parsed.updatedAt ?? "" };
  } catch {
    return null;
  }
}

/**
 * Loads the rates once: the cached copy when it is fresh enough, a network fetch
 * otherwise. A failed fetch keeps the cached (or fallback) numbers rather than blanks.
 */
export async function loadExchangeRates(): Promise<Record<CurrencyCode, number>> {
  const cached = readCache();
  if (cached && Date.now() - cached.fetchedAt < RATE_MAX_AGE_MS) {
    applyRates({ rates: cached.rates });
    ratesUpdatedAt = cached.updatedAt || ratesUpdatedAt;
    return rates;
  }
  try {
    let body: unknown = null;
    try {
      const stored = await fetch(API_RATES_URL, { headers: { accept: "application/json" } });
      if (stored.ok) body = await stored.json();
    } catch {}
    if (!applyRates(body)) {
      const response = await fetch(RATE_URL);
      if (!response.ok) throw new Error(`rates ${response.status}`);
      body = await response.json();
    }
    if (!applyRates(body)) throw new Error("rates malformed");
    try {
      window.localStorage.setItem(
        RATE_KEY,
        JSON.stringify({ rates, fetchedAt: Date.now(), updatedAt: ratesUpdatedAt }),
      );
    } catch {}
  } catch {
    if (cached) applyRates({ rates: cached.rates });
  }
  return rates;
}

/** Converts a cedi amount into the currency on display. */
/** The currency fields a PDF request carries, so the document prints what the site shows. */
export function displayMoneyPayload(): { currency: CurrencyCode; rate: number } {
  const code = getDisplayCurrency();
  return { currency: code, rate: getExchangeRates()[code] ?? 1 };
}

export function convertFromGhs(value: number, code: CurrencyCode = display): number {
  return value * (rates[code] ?? 1);
}

/** Money in the display currency, e.g. "GH₵19,922" or "US$1,677". */
export function formatMoney(valueGhs: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: display,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(convertFromGhs(valueGhs));
}
