const API_URL = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";

/**
 * Prices published from the admin console live in D1 and are read here.
 * Cached for a minute so the catalogue stays fast but picks up edits quickly.
 */
export async function getLivePrices(): Promise<Record<string, number>> {
  try {
    const response = await fetch(`${API_URL}/catalogue`, { cache: "no-store" });
    if (!response.ok) return {};
    const body = (await response.json()) as { items?: Array<{ id: string; price_ghs: number | null }> };
    const prices: Record<string, number> = {};
    for (const item of body.items ?? []) {
      if (typeof item.price_ghs === "number") prices[item.id] = item.price_ghs;
    }
    return prices;
  } catch {
    return {};
  }
}
