/**
 * Browser-local saved estimates.
 *
 * Estimates saved from the quick estimator or the material basket are kept here.
 * There is no account model: the store is the browser.
 */
import type { SavedEstimate } from "@/lib/types";

const STORAGE_KEY = "estimo_saved_estimates_v1";
const DELETED_KEY = "estimo_deleted_estimates_v1";

export const SAVED_EVENT = "estimo-saved-change";

export function listSavedEstimates(): SavedEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const deleted = new Set(readDeleted());
    return (parsed as SavedEstimate[]).filter((entry) => !deleted.has(entry.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

/** Ids deleted on purpose, so a later account sync cannot resurrect them. */
function readDeleted(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DELETED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function deleteSavedEstimate(id: string): void {
  try {
    const deleted = new Set(readDeleted());
    deleted.add(id);
    window.localStorage.setItem(DELETED_KEY, JSON.stringify([...deleted].slice(-200)));
  } catch {}
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

/** Replace the local cache with the server list (signed-in sync). */
export function replaceSavedEstimates(entries: SavedEstimate[]): void {
  const deleted = new Set(readDeleted());
  persist(entries.filter((entry) => !deleted.has(entry.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}