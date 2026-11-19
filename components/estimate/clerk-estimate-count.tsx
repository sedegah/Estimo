"use client";

import { useUser } from "@clerk/nextjs";
import { EstimateBasketLink } from "./estimate-basket-link";

/**
 * The cart belongs to guests: it holds the estimate they are building before they
 * have an account. Signed-in users have saved estimates instead, so it is hidden.
 */
export function ClerkEstimateCount() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) return null;
  return isSignedIn ? null : <EstimateBasketLink />;
}
