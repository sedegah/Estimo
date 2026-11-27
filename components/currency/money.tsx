"use client";

import { formatGhs } from "@/lib/format";
import { useCurrency } from "./currency-provider";

/**
 * Money rendered by a client component, so a page that is otherwise server-rendered
 * (the catalogue) still follows the currency picker. The first paint is cedis, the
 * provider applies the saved choice immediately after hydration.
 */
export function Money({ value, fractionDigits = 2 }: { value: number; fractionDigits?: number }) {
  useCurrency();
  return <>{formatGhs(value, fractionDigits)}</>;
}
