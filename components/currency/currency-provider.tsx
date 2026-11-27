"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadExchangeRates,
  ratesAsOf,
  readStoredCurrency,
  setDisplayCurrency,
  storeCurrency,
  type CurrencyCode,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  ratesAsOf: string | null;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "GHS",
  setCurrency: () => undefined,
  ratesAsOf: null,
});

/**
 * Holds the display currency and the rates behind it. Changing the currency re-renders
 * the tree, so every formatter (which reads the module-level display) shows the new
 * currency; the amounts themselves stay in cedis.
 */
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("GHS");
  const [asOf, setAsOf] = useState<string | null>(null);

  useEffect(() => {
    const saved = readStoredCurrency();
    setDisplayCurrency(saved);
    setCurrencyState(saved);
    void loadExchangeRates().then(() => setAsOf(ratesAsOf()));
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency: (code) => {
        setDisplayCurrency(code);
        storeCurrency(code);
        setCurrencyState(code);
        setAsOf(ratesAsOf());
      },
      ratesAsOf: asOf,
    }),
    [currency, asOf],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
