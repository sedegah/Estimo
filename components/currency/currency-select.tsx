"use client";

import { CURRENCIES, getExchangeRates, type CurrencyCode } from "@/lib/currency";
import { useCurrency } from "./currency-provider";

/**
 * The currency picker that sits in the header. Prices are stored in cedis; this only
 * changes how they are shown.
 */
export function CurrencySelect() {
  const { currency, setCurrency, ratesAsOf } = useCurrency();
  const rate = getExchangeRates()[currency];

  return (
    <label className="currency-field">
      <span className="currency-label">Currency</span>
      <select
        className="currency-select"
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        aria-label="Display currency"
        title={
          currency === "GHS"
            ? "Prices are in cedis"
            : `1 ${currency} = GH₵${(1 / rate).toFixed(2)} · ${ratesAsOf ? `rates updated ${new Date(ratesAsOf).toLocaleString("en-GH")}` : "live rates"}`
        }
      >
        {CURRENCIES.map((option) => (
          <option key={option.code} value={option.code}>
            {option.symbol} {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
