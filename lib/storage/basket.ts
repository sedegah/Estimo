/**
 * Browser-local estimate basket.
 *
 * The basket is guest state: it lives in localStorage so the estimate survives a
 * reload without a backend. Components subscribe to BASKET_EVENT for updates.
 */
import type { BasketItem } from "@/lib/types";

const STORAGE_KEY = "estimo_guest_estimate_v1";

export const BASKET_EVENT = "estimo-basket-change";

export function readBasket(): BasketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as BasketItem[]) : [];
  } catch {
    return [];
  }
}

export function writeBasket(items: BasketItem[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(BASKET_EVENT));
}

export function basketUnitCount(items: BasketItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
