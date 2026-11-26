"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { clerkEnabled } from "@/lib/env";
import { fetchServerEstimates, pushCreate } from "@/lib/api/estimates";
import { listSavedEstimates, mergeSavedEstimates } from "@/lib/storage/saved-estimates";
import { readOwner, reconcileOwner } from "@/lib/storage/reset";

/**
 * Keeps browser data tied to the signed-in account and synchronises it with the
 * per-user records in D1:
 * - first sign-in adopts guest work and uploads it;
 * - a different account wipes the previous account's local data;
 * - ending the session wipes it;
 * - every sign-in merges the account's estimates in, keeping anything this browser
 *   saved that has not reached the server yet (and uploading it).
 *
 * Clerk hooks only exist inside a ClerkProvider, so this component stays out of the tree
 * when the app was built without keys (local development, preview without secrets).
 */
export function SessionGuard() {
  if (!clerkEnabled) return null;
  return <SessionSync />;
}

function SessionSync() {
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
      if (!server) return;
      const localOnly = mergeSavedEstimates(server);
      for (const entry of localOnly) {
        await pushCreate(entry);
      }
    })();
  }, [isLoaded, isSignedIn, user]);

  return null;
}
