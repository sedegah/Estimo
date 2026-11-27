"use client";

import { CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { useCurrency } from "./currency-provider";

/**
 * The currency picker that sits in the header. Prices are stored in cedis; this only
 * changes how they are shown.
 */
export function CurrencySelect() {
  const { currency, setCurrency, ratesAsOf } = useCurrency();

  return (
    <label className="currency-field">
      <span className="currency-label">Currency</span>
      <select
        className="currency-select"
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        aria-label="Display currency"
        title={ratesAsOf ? `Exchange rates updated ${new Date(ratesAsOf).toLocaleString("en-GH")}` : "Exchange rates"}
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
