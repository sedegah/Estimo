"use client";

import { useUser } from "@clerk/nextjs";
import { EstimateBasketLink } from "./estimate-basket-link";
import { SavedEstimateCount } from "./saved-estimate-count";

/**
 * Signed-in users see the number of estimates they have; guests see the basket
 * count instead.
 */
export function ClerkEstimateCount() {
  const { isLoaded, isSignedIn } = useUser();

  if (isLoaded && isSignedIn) return <SavedEstimateCount />;
  return <EstimateBasketLink />;
}
