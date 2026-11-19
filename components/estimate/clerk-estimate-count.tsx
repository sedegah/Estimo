"use client";

import { EstimateBasketLink } from "./estimate-basket-link";

/**
 * The header always shows the estimate basket, signed in or not.
 * (It used to swap to a saved-estimate count once Clerk loaded, which made the
 * cart flash in and out on every page load.)
 */
export function ClerkEstimateCount() {
  return <EstimateBasketLink />;
}
