"use client";

const API_URL = (process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev").replace(/\/$/, "");

type ClerkBridge = { session?: { getToken(): Promise<string | null> } };

export type CatalogueItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  spec: string;
  price_ghs: number | null;
  image_key?: string | null;
};

async function token(): Promise<string | null> {
  const clerk = (window as unknown as { Clerk?: ClerkBridge }).Clerk;
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

async function call(path: string, init: RequestInit = {}) {
  const bearer = await token();
  if (!bearer) return null;
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
    });
  } catch {
    return null;
  }
}

/** Public URL for a material photo stored in R2. */
export function materialImageUrl(key?: string | null): string {
  if (!key) return "";
  const base = process.env.NEXT_PUBLIC_ESTIMO_IMAGES_URL ?? `${API_URL}/images`;
  return `${base}/${key}`;
}
export async function listCatalogue(): Promise<CatalogueItem[] | null> {
  const response = await call("/catalogue");
  if (!response?.ok) return null;
  const body = (await response.json()) as { items?: CatalogueItem[] };
  return body.items ?? [];
}

export async function setPrice(itemId: string, priceGhs: number, brand?: string) {
  const response = await call("/admin/catalogue/prices", {
    method: "POST",
    body: JSON.stringify({ itemId, priceGhs, source: "admin console", brand: brand ?? "" }),
  });
  return response ? ((await response.json()) as { ok: boolean; error?: string }) : { ok: false, error: "Not signed in" };
}

export type NewMaterial = {
  name: string;
  code?: string;
  category?: string;
  unit?: string;
  spec?: string;
  tier?: string;
  relevance?: string;
  keywords?: string[];
  priceGhs?: number | null;
  brand?: string;
};

export async function addItem(payload: NewMaterial) {
  const response = await call("/admin/catalogue/items", { method: "POST", body: JSON.stringify(payload) });
  return response
    ? ((await response.json()) as { ok: boolean; id?: string; error?: string })
    : { ok: false, error: "Not signed in" };
}

/** Uploads a photo for an existing material; the API stores it in R2 and links it. */
export async function uploadMaterialImage(itemId: string, file: File) {
  const bearer = await token();
  if (!bearer) return { ok: false, error: "Not signed in" } as { ok: boolean; imageKey?: string; error?: string };
  try {
    const body = new FormData();
    body.append("itemId", itemId);
    body.append("file", file);
    const response = await fetch(`${API_URL}/admin/catalogue/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}` },
      body,
    });
    return (await response.json()) as { ok: boolean; imageKey?: string; error?: string };
  } catch {
    return { ok: false, error: "Could not reach the data API" };
  }
}

export async function saveTemplate(payload: {
  name: string;
  preset: string;
  plan: unknown;
  totals: unknown;
}) {
  const response = await call("/admin/templates", { method: "POST", body: JSON.stringify(payload) });
  return response ? ((await response.json()) as { ok: boolean; id?: string; error?: string }) : { ok: false, error: "Not signed in" };
}
/** Deletes a material, its price history and its photo. */
export async function deleteItem(id: string) {
  const response = await call(`/admin/catalogue/items/${id}`, { method: "DELETE" });
  return response ? ((await response.json()) as { ok: boolean; error?: string }) : { ok: false, error: "Not signed in" };
}

export async function setUnit(id: string, unit: string) {
  const response = await call(`/admin/catalogue/items/${id}`, { method: "PATCH", body: JSON.stringify({ unit }) });
  return response ? ((await response.json()) as { ok: boolean; error?: string }) : { ok: false, error: "Not signed in" };
}
