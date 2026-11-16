/**
 * Last setup draft, kept in the browser so a returning user can continue where
 * they stopped. Written from the setup screen, read by the saved-projects page.
 */
import type { Counts, FittingQuality } from "@/lib/estimate-model";

export type EstimateDraft = {
  template: string;
  counts: Counts;
  quality: FittingQuality;
  updatedAt: string;
};

const STORAGE_KEY = "estimo_draft_v1";

export const DRAFT_EVENT = "estimo-draft-change";

export function readDraft(): EstimateDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EstimateDraft;
    return parsed && typeof parsed.template === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Omit<EstimateDraft, "updatedAt">): void {
  if (typeof window === "undefined") return;
  const entry: EstimateDraft = { ...draft, updatedAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  window.dispatchEvent(new Event(DRAFT_EVENT));
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(DRAFT_EVENT));
}

export function draftHref(draft: EstimateDraft): string {
  const params = new URLSearchParams({ template: draft.template, quality: draft.quality });
  for (const [key, value] of Object.entries(draft.counts ?? {})) params.set(key, String(value));
  return `/quick-estimate?${params.toString()}`;
}
