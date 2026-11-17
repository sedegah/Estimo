"use client";

const API_URL = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";

type ClerkBridge = { session?: { getToken(): Promise<string | null> } };

export type CatalogueItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  spec: string;
  price_ghs: number | null;
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

export async function listCatalogue(): Promise<CatalogueItem[] | null> {
  const response = await call("/catalogue");
  if (!response?.ok) return null;
  const body = (await response.json()) as { items?: CatalogueItem[] };
  return body.items ?? [];
}

export async function setPrice(itemId: string, priceGhs: number) {
  const response = await call("/admin/catalogue/prices", {
    method: "POST",
    body: JSON.stringify({ itemId, priceGhs, source: "admin console" }),
  });
  return response ? ((await response.json()) as { ok: boolean; error?: string }) : { ok: false, error: "Not signed in" };
}

export async function addItem(payload: { name: string; category: string; unit: string; spec: string }) {
  const response = await call("/admin/catalogue/items", { method: "POST", body: JSON.stringify(payload) });
  return response ? ((await response.json()) as { ok: boolean; error?: string }) : { ok: false, error: "Not signed in" };
}

export async function setUnit(id: string, unit: string) {
  const response = await call(`/admin/catalogue/items/${id}`, { method: "PATCH", body: JSON.stringify({ unit }) });
  return response ? ((await response.json()) as { ok: boolean; error?: string }) : { ok: false, error: "Not signed in" };
}
