/**
 * Local preferences for estimates (currency/unit display). Kept in the browser
 * alongside the account and saved estimates.
 */

export type Preferences = {
  currency: "GHS" | "USD";
  unit: "metric" | "imperial";
};

const STORAGE_KEY = "estimo_preferences_v1";

export const PREFERENCES_EVENT = "estimo-preferences-change";

export const DEFAULT_PREFERENCES: Preferences = { currency: "GHS", unit: "metric" };

export function readPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(next: Preferences): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(PREFERENCES_EVENT));
}
