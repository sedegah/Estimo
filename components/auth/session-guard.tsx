"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { fetchServerEstimates, pushCreate } from "@/lib/api/estimates";
import { listSavedEstimates, replaceSavedEstimates } from "@/lib/storage/saved-estimates";
import { readOwner, reconcileOwner } from "@/lib/storage/reset";

/**
 * Keeps browser data tied to the signed-in account and synchronises it with the
 * per-user records in D1:
 * - first sign-in adopts guest work and uploads it;
 * - a different account wipes the previous account's local data;
 * - ending the session wipes it;
 * - every sign-in pulls the account's estimates back down.
 */
export function SessionGuard() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (!isLoaded) return;

    const signedIn = Boolean(isSignedIn && user);
    const owner = signedIn && user ? user.id : "";
    const firstSignIn = signedIn && !readOwner();

    reconcileOwner(owner);

    if (!signedIn) return;

    void (async () => {
      if (firstSignIn) {
        for (const entry of listSavedEstimates()) {
          await pushCreate(entry);
        }
      }
      const server = await fetchServerEstimates();
      if (server) replaceSavedEstimates(server);
    })();
  }, [isLoaded, isSignedIn, user]);

  return null;
}
