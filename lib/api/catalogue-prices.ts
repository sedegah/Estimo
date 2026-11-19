const API_URL = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";

export type LivePrice = {
  price: number;
  brand: string | null;
  source: string | null;
  updatedAt: string | null;
};

type ApiItem = {
  id: string;
  price_ghs?: number | null;
  price_brand?: string | null;
  price_source?: string | null;
  price_updated_at?: string | null;
};

/**
 * Prices published from the admin console live in D1 and are read here, with the
 * brand and source recorded against each one.
 */
export async function getCataloguePrices(): Promise<Record<string, LivePrice>> {
  try {
    const response = await fetch(`${API_URL}/catalogue`, { cache: "no-store" });
    if (!response.ok) return {};
    const body = (await response.json()) as { items?: ApiItem[] };
    const prices: Record<string, LivePrice> = {};
    for (const item of body.items ?? []) {
      if (typeof item.price_ghs !== "number") continue;
      prices[item.id] = {
        price: item.price_ghs,
        brand: item.price_brand ?? null,
        source: item.price_source ?? null,
        updatedAt: item.price_updated_at ?? null,
      };
    }
    return prices;
  } catch {
    return {};
  }
}

/** Just the numbers, for callers that only need the amount. */
export async function getLivePrices(): Promise<Record<string, number>> {
  const details = await getCataloguePrices();
  return Object.fromEntries(Object.entries(details).map(([id, entry]) => [id, entry.price]));
}
