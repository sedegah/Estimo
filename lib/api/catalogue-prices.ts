import { cache } from "react";

// kept free of aliased imports: this module is exercised directly by node --test
const API_URL = (
  process.env.NEXT_PUBLIC_ESTIMO_API_URL?.trim() ||
  "https://api.estimo.live"
).replace(/\/$/, "");
const IMAGES_URL = process.env.NEXT_PUBLIC_ESTIMO_IMAGES_URL ?? `${API_URL}/images`;

export type LivePrice = {
  price: number;
  brand: string | null;
  source: string | null;
  updatedAt: string | null;
};

export type CatalogueData = {
  /** Material id → published price. */
  prices: Record<string, LivePrice>;
  /** Material id → R2 object key for its photo. */
  images: Record<string, string>;
};

type ApiItem = {
  id: string;
  price_ghs?: number | null;
  price_brand?: string | null;
  price_source?: string | null;
  price_updated_at?: string | null;
  image_key?: string | null;
};

/**
 * Prices and material photos, both published from the admin console into D1/R2.
 * Cached for a minute and de-duplicated per request, so a page render only asks
 * the worker once and repeat visits do not wait on it.
 */
export const getCatalogueData = cache(async (): Promise<CatalogueData> => {
  const empty: CatalogueData = { prices: {}, images: {} };
  try {
    const response = await fetch(`${API_URL}/catalogue`, { next: { revalidate: 60 } });
    if (!response.ok) return empty;
    const body = (await response.json()) as { items?: ApiItem[] };
    const data: CatalogueData = { prices: {}, images: {} };
    for (const item of body.items ?? []) {
      if (item.image_key) data.images[item.id] = item.image_key;
      if (typeof item.price_ghs !== "number") continue;
      data.prices[item.id] = {
        price: item.price_ghs,
        brand: item.price_brand ?? null,
        source: item.price_source ?? null,
        updatedAt: item.price_updated_at ?? null,
      };
    }
    return data;
  } catch {
    return empty;
  }
});

/** Just the numbers, for callers that only need the amount. */
export async function getLivePrices(): Promise<Record<string, number>> {
  const { prices } = await getCatalogueData();
  return Object.fromEntries(Object.entries(prices).map(([id, entry]) => [id, entry.price]));
}

/** Absolute URL for a stored material photo. */
export function materialImageUrl(key: string | null | undefined): string | null {
  return key ? `${IMAGES_URL}/${key}` : null;
}
