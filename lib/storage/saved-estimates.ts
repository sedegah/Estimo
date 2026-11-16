/**
 * Browser-local saved estimates.
 *
 * Estimates saved from the quick estimator or the material basket are kept here.
 * There is no account model: the store is the browser.
 */
import type { SavedEstimate } from "@/lib/types";

const STORAGE_KEY = "estimo_saved_estimates_v1";

export const SAVED_EVENT = "estimo-saved-change";

export function listSavedEstimates(): SavedEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return (parsed as SavedEstimate[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

function persist(next: SavedEstimate[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SAVED_EVENT));
}

export function saveEstimate(entry: Omit<SavedEstimate, "id" | "createdAt">): SavedEstimate {
  const saved: SavedEstimate = {
    ...entry,
    id: `est-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  persist([saved, ...listSavedEstimates()]);
  return saved;
}

export function deleteSavedEstimate(id: string): void {
  persist(listSavedEstimates().filter((entry) => entry.id !== id));
}

export function getSavedEstimate(id: string): SavedEstimate | null {
  return listSavedEstimates().find((entry) => entry.id === id) ?? null;
}

export function updateSavedEstimate(id: string, patch: Partial<Omit<SavedEstimate, "id" | "createdAt">>): SavedEstimate | null {
  const current = listSavedEstimates();
  const existing = current.find((entry) => entry.id === id);
  if (!existing) return null;
  const next: SavedEstimate = { ...existing, ...patch };
  persist(current.map((entry) => (entry.id === id ? next : entry)));
  return next;
}
