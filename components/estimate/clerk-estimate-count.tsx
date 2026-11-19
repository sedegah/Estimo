"use client";

import { useUser } from "@clerk/nextjs";
import { EstimateBasketLink } from "./estimate-basket-link";

/**
 * The cart belongs to guests: it holds the estimate they are building before they
 * have an account. It shows until Clerk positively says somebody is signed in, so
 * it never disappears while Clerk is still loading (or when it cannot load at all).
 */
export function ClerkEstimateCount() {
  const { isLoaded, isSignedIn } = useUser();
  if (isLoaded && isSignedIn) return null;
  return <EstimateBasketLink />;
}
