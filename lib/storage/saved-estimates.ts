/**
 * Browser-local saved estimates, scoped by who is looking.
 *
 * A guest's work lives in the base key and is never shown to an account; an account's
 * estimates live under its own owner key, so signing out hides them without deleting
 * them. On sign-in the guest's estimates are moved into the account (and uploaded), which
 * is how work built before signing in becomes the account's — not how it is lost.
 */
import type { SavedEstimate } from "@/lib/types";

/**
 * The owner marker is read from the same key the reset module writes. Kept as a local
 * read so this module stays free of aliased imports and can be exercised by node --test.
 */
const OWNER_KEY = "estimo_owner_v1";
const currentOwner = (): string => {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(OWNER_KEY) ?? "";
};

const BASE_KEY = "estimo_saved_estimates_v1";
const DELETED_KEY = "estimo_deleted_estimates_v1";

/** The store for the person currently using the browser: guest or a Clerk user id. */
const keyFor = (owner: string): string => (owner ? `${BASE_KEY}:${owner}` : BASE_KEY);

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

function readAll(owner: string): SavedEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(keyFor(owner));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SavedEstimate[]) : [];
  } catch {
    return [];
  }
}

function writeAll(owner: string, next: SavedEstimate[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(owner), JSON.stringify(next));
  window.dispatchEvent(new Event(SAVED_EVENT));
}

/**
 * The estimates the current viewer may see: the guest's when signed out, the account's
 * when signed in. Another account's browser copy is never included.
 */
export function listSavedEstimates(owner: string = currentOwner()): SavedEstimate[] {
  if (typeof window === "undefined") return [];
  try {
    const deleted = new Set(readDeleted());
    const entries = readAll(owner).filter((entry) => !deleted.has(entry.id));
    // estimates saved before codes existed get one now, in place, so the reference shown
    // on a card never changes once a person has read it out
    if (entries.some((entry) => !entry.code)) {
      const used = new Set(entries.map((entry) => entry.code).filter(Boolean) as string[]);
      for (const entry of entries) if (!entry.code) entry.code = nextCode(used);
      try {
        window.localStorage.setItem(keyFor(owner), JSON.stringify(entries));
      } catch {}
    }
    const live = entries.filter((entry) => !expiredAt(entry));
    if (live.length !== entries.length) {
      try {
        window.localStorage.setItem(keyFor(owner), JSON.stringify(live));
      } catch {}
    }
    return live.sort(newestFirst);
  } catch {
    return [];
  }
}

export function saveEstimate(entry: Omit<SavedEstimate, "id" | "createdAt">): SavedEstimate {
  const owner = currentOwner();
  const now = new Date().toISOString();
  const existing = listSavedEstimates(owner);
  const used = new Set(existing.map((saved) => saved.code).filter(Boolean) as string[]);
  const saved: SavedEstimate = {
    ...entry,
    id: `est-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    code: entry.code ?? nextCode(used),
    createdAt: now,
    updatedAt: now,
  };
  writeAll(owner, [saved, ...existing]);
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
  const owner = currentOwner();
  writeAll(owner, listSavedEstimates(owner).filter((entry) => entry.id !== id));
}

/**
 * Moves the guest's estimates into an account. Returns what moved so the caller can
 * upload it; the base key is emptied, so a signed-in visitor can never see guest work.
 */
export function adoptGuestEstimates(owner: string): SavedEstimate[] {
  if (typeof window === "undefined" || !owner) return [];
  const guestEntries = readAll("");
  if (!guestEntries.length) return [];
  const accountEntries = readAll(owner);
  const known = new Set(accountEntries.map((entry) => entry.id));
  const moved = guestEntries.filter((entry) => !known.has(entry.id));
  writeAll(owner, [...moved, ...accountEntries]);
  window.localStorage.removeItem(BASE_KEY);
  window.dispatchEvent(new Event(SAVED_EVENT));
  return moved;
}

/**
 * Marks an estimate as just used, so opening it keeps it inside the retention window.
 * Deliberately does not reorder the list or fire the saved event.
 */
export function touchSavedEstimate(id: string): void {
  if (typeof window === "undefined") return;
  const owner = currentOwner();
  try {
    const entries = readAll(owner);
    const now = new Date().toISOString();
    let changed = false;
    const next = entries.map((entry) => {
      if (entry.id !== id) return entry;
      changed = true;
      return { ...entry, lastAccessedAt: now };
    });
    if (changed) window.localStorage.setItem(keyFor(owner), JSON.stringify(next));
  } catch {}
}

/** Removes estimates past the retention window and returns their ids, for server cleanup. */
export function purgeExpiredEstimates(owner: string = currentOwner()): string[] {
  if (typeof window === "undefined") return [];
  try {
    const entries = readAll(owner);
    const expired = entries.filter((entry) => expiredAt(entry));
    if (!expired.length) return [];
    window.localStorage.setItem(keyFor(owner), JSON.stringify(entries.filter((entry) => !expiredAt(entry))));
    return expired.map((entry) => entry.id);
  } catch {
    return [];
  }
}

export function getSavedEstimate(id: string): SavedEstimate | null {
  return listSavedEstimates().find((entry) => entry.id === id) ?? null;
}

export function updateSavedEstimate(id: string, patch: Partial<Omit<SavedEstimate, "id" | "createdAt">>): SavedEstimate | null {
  const owner = currentOwner();
  const current = listSavedEstimates(owner);
  const existing = current.find((entry) => entry.id === id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const next: SavedEstimate = { ...existing, ...patch, updatedAt: now, lastAccessedAt: now };
  writeAll(owner, current.map((entry) => (entry.id === id ? next : entry)));
  return next;
}

/**
 * Signed-in sync. The server list is merged into the account's browser copy rather than
 * replacing it, so an estimate saved a moment ago cannot vanish while its upload is in
 * flight. Entries only held in this browser are returned so the caller can push them.
 */
export function mergeSavedEstimates(entries: SavedEstimate[]): SavedEstimate[] {
  const owner = currentOwner();
  const deleted = new Set(readDeleted());
  const local = listSavedEstimates(owner);
  const byId = new Map<string, SavedEstimate>();
  const usedCodes = new Set(local.map((entry) => entry.code).filter(Boolean) as string[]);

  for (const entry of local) byId.set(entry.id, entry);
  for (const entry of entries) {
    if (deleted.has(entry.id)) continue;
    // a copy the server still holds but nobody has opened in time is not resurrected
    if (expiredAt(entry)) continue;
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

  const merged = [...byId.values()].filter((entry) => !deleted.has(entry.id)).sort(newestFirst);
  writeAll(owner, merged);

  const serverIds = new Set(entries.map((entry) => entry.id));
  return merged.filter((entry) => !serverIds.has(entry.id));
}

/** Backwards-compatible name for callers that only want the merge. */
export function replaceSavedEstimates(entries: SavedEstimate[]): void {
  mergeSavedEstimates(entries);
}
