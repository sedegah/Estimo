/**
 * Local data lifecycle.
 *
 * Estimates belong to the account that created them, but signing out must not destroy
 * work that has not reached the server yet: the stored estimates are the browser's copy
 * and are kept, then adopted by the next sign-in and uploaded. Only the choices that are
 * specific to a session (the in-progress draft, guest estimate and preferences) are
 * cleared when the account changes or a session ends.
 */

const SESSION_KEYS = [
  "estimo_guest_estimate_v1",
  "estimo_draft_v1",
  "estimo_preferences_v1",
];

/** Saved estimates are deliberately absent: losing them on sign-out is data loss. */
const DATA_KEYS = ["estimo_saved_estimates_v1", ...SESSION_KEYS];

const OWNER_KEY = "estimo_owner_v1";

export function readOwner(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(OWNER_KEY) ?? "";
}

export function writeOwner(owner: string): void {
  if (typeof window === "undefined") return;
  if (owner) window.localStorage.setItem(OWNER_KEY, owner);
  else window.localStorage.removeItem(OWNER_KEY);
}

/** Everything, including saved estimates. Used by a deliberate "delete my data". */
export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  for (const key of DATA_KEYS) window.localStorage.removeItem(key);
  window.dispatchEvent(new Event("estimo-saved-change"));
  window.dispatchEvent(new Event("estimo-basket-change"));
  window.dispatchEvent(new Event("estimo-draft-change"));
  window.dispatchEvent(new Event("estimo-preferences-change"));
}

/** Ends a session without throwing away the estimates this browser holds. */
export function clearSessionData(): void {
  if (typeof window === "undefined") return;
  for (const key of SESSION_KEYS) window.localStorage.removeItem(key);
  window.dispatchEvent(new Event("estimo-draft-change"));
  window.dispatchEvent(new Event("estimo-preferences-change"));
}

/**
 * Called whenever authentication state settles. Returns true when session data was
 * cleared. Saved estimates always survive: the next sign-in adopts them and pushes
 * anything the server does not have yet, which is what keeps an estimate across a
 * sign-out or a change of Clerk instance.
 */
export function reconcileOwner(nextOwner: string): boolean {
  const previous = readOwner();
  const signedIn = Boolean(nextOwner);

  if (signedIn && !previous) {
    // First sign-in: adopt whatever the guest built on this device.
    writeOwner(nextOwner);
    return false;
  }

  if (signedIn && previous && nextOwner !== previous) {
    // Different account on the same browser: start clean, but keep the saved estimates.
    clearSessionData();
    writeOwner(nextOwner);
    return true;
  }

  if (!signedIn && previous) {
    // Session ended: keep the estimates, drop the session's own state.
    clearSessionData();
    writeOwner("");
    return true;
  }

  return false;
}
