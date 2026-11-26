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

/** No I, O, 0 or 1: a code gets read aloud and typed back. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** A short reference for one estimate, e.g. EST-7K3M9Q. */
function nextCode(used: Set<string>): string {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    let body = "";
    for (let index = 0; index < 6; index += 1) {
      body += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    const code = `EST-${body}`;
    if (!used.has(code)) {
      used.add(code);
      return code;
    }
  }
  return `EST-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

/** Estimates nobody has opened for this long are cleared. */
export const RETENTION_DAYS = 40;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** The later of "saved" and "opened": an estimate stays alive while it is being used. */
const lastSeen = (entry: SavedEstimate): string =>
  entry.lastAccessedAt ?? entry.updatedAt ?? entry.createdAt;

const expiredAt = (entry: SavedEstimate, now = Date.now()): boolean => {
  const seen = Date.parse(lastSeen(entry));
  return Number.isFinite(seen) && now - seen > RETENTION_MS;
};

/** When an estimate was last written, which is how the list is ordered. */
const savedAt = (entry: SavedEstimate): string => entry.updatedAt ?? entry.createdAt;

const newestFirst = (a: SavedEstimate, b: SavedEstimate): number => savedAt(b).localeCompare(savedAt(a));

export function listSavedEstimates(): SavedEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const deleted = new Set(readDeleted());
    const entries = (parsed as SavedEstimate[]).filter((entry) => !deleted.has(entry.id));
    // estimates saved before codes existed get one now, in place, so the reference shown
    // on a card never changes once a person has read it out
    if (entries.some((entry) => !entry.code)) {
      const used = new Set(entries.map((entry) => entry.code).filter(Boolean) as string[]);
      for (const entry of entries) if (!entry.code) entry.code = nextCode(used);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      } catch {}
    }
    const live = entries.filter((entry) => !expiredAt(entry));
    if (live.length !== entries.length) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(live));
      } catch {}
    }
    return live.sort(newestFirst);
  } catch {
    return [];
  }
}

function persist(next: SavedEstimate[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(SAVED_EVENT));
}

export function saveEstimate(entry: Omit<SavedEstimate, "id" | "createdAt">): SavedEstimate {
  const now = new Date().toISOString();
  const existing = listSavedEstimates();
  const used = new Set(existing.map((saved) => saved.code).filter(Boolean) as string[]);
  const saved: SavedEstimate = {
    ...entry,
    id: `est-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code: entry.code ?? nextCode(used),
    createdAt: now,
    updatedAt: now,
  };
  persist([saved, ...existing]);
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

/**
 * Marks an estimate as just used, so opening it keeps it inside the retention window.
 * Deliberately does not reorder the list or fire the saved event.
 */
export function touchSavedEstimate(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedEstimate[]) : [];
    if (!Array.isArray(parsed)) return;
    const now = new Date().toISOString();
    let changed = false;
    const next = parsed.map((entry) => {
      if (entry.id !== id) return entry;
      changed = true;
      return { ...entry, lastAccessedAt: now };
    });
    if (changed) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

/** Removes estimates past the retention window and returns their ids, for server cleanup. */
export function purgeExpiredEstimates(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as SavedEstimate[]) : [];
    if (!Array.isArray(parsed)) return [];
    const expired = parsed.filter((entry) => expiredAt(entry));
    if (!expired.length) return [];
    const keep = parsed.filter((entry) => !expiredAt(entry));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keep));
    return expired.map((entry) => entry.id);
  } catch {
    return [];
  }
}

export function getSavedEstimate(id: string): SavedEstimate | null {
  return listSavedEstimates().find((entry) => entry.id === id) ?? null;
}

export function updateSavedEstimate(id: string, patch: Partial<Omit<SavedEstimate, "id" | "createdAt">>): SavedEstimate | null {
  const current = listSavedEstimates();
  const existing = current.find((entry) => entry.id === id);
  if (!existing) return null;
  // saving an existing project moves it to the top of the list
  const now = new Date().toISOString();
  const next: SavedEstimate = { ...existing, ...patch, updatedAt: now, lastAccessedAt: now };
  persist(current.map((entry) => (entry.id === id ? next : entry)));
  return next;
}

/**
 * Signed-in sync. The server list is merged into the browser rather than replacing
 * it, so an estimate saved a moment ago cannot vanish while its upload is in flight.
 * Entries only held in this browser are returned so the caller can push them.
 */
export function mergeSavedEstimates(entries: SavedEstimate[]): SavedEstimate[] {
  const deleted = new Set(readDeleted());
  const local = listSavedEstimates();
  const byId = new Map<string, SavedEstimate>();
  const usedCodes = new Set(local.map((entry) => entry.code).filter(Boolean) as string[]);

  for (const entry of local) byId.set(entry.id, entry);
  for (const entry of entries) {
    if (deleted.has(entry.id)) continue;
    const current = byId.get(entry.id);
    // the server copy wins normally, but a local edit that has not been pushed yet is
    // richer: keep the full take-off and the saved lines from whichever side has them
    byId.set(
      entry.id,
      current
        ? {
            ...current,
            ...entry,
            code: current.code ?? nextCode(usedCodes),
            items: entry.items?.length ? entry.items : current.items,
            quantities: current.quantities ?? entry.quantities,
            // ordering follows the latest save from either side
            updatedAt: [current.updatedAt, entry.updatedAt].filter(Boolean).sort().at(-1),
          }
        : { ...entry, code: entry.code ?? nextCode(usedCodes) },
    );
  }

  const merged = [...byId.values()]
    .filter((entry) => !deleted.has(entry.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  persist(merged);

  const serverIds = new Set(entries.map((entry) => entry.id));
  return merged.filter((entry) => !serverIds.has(entry.id));
}

/** Backwards-compatible name for callers that only want the merge. */
export function replaceSavedEstimates(entries: SavedEstimate[]): void {
  mergeSavedEstimates(entries);
}