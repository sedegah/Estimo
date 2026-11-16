/**
 * Local data lifecycle.
 *
 * Estimates, drafts and the basket belong to the account that created them. When a
 * different account signs in — or a session ends — the previous account's local data
 * is wiped so one person never sees another person's projects.
 */

const DATA_KEYS = [
  "estimo_saved_estimates_v1",
  "estimo_guest_estimate_v1",
  "estimo_draft_v1",
  "estimo_preferences_v1",
];

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

export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  for (const key of DATA_KEYS) window.localStorage.removeItem(key);
  window.dispatchEvent(new Event("estimo-saved-change"));
  window.dispatchEvent(new Event("estimo-basket-change"));
  window.dispatchEvent(new Event("estimo-draft-change"));
  window.dispatchEvent(new Event("estimo-preferences-change"));
}

/**
 * Called whenever authentication state settles. Returns true when local data was
 * cleared because the account changed or the session ended.
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
    // Different account on the same browser.
    clearLocalData();
    writeOwner(nextOwner);
    return true;
  }

  if (!signedIn && previous) {
    // Session ended.
    clearLocalData();
    writeOwner("");
    return true;
  }

  return false;
}
