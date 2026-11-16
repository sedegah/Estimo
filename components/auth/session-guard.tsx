"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { reconcileOwner } from "@/lib/storage/reset";

/**
 * Keeps browser data tied to the signed-in account:
 * - first sign-in adopts the guest work on this device;
 * - a different account wipes the previous account's local data;
 * - ending the session wipes it as well.
 */
export function SessionGuard() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;
    reconcileOwner(isSignedIn && user ? user.id : "");
  }, [isLoaded, isSignedIn, user]);

  return null;
}
