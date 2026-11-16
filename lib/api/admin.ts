import type { CatalogueItem } from "@/lib/api/admin-types";

const API_URL = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";

type ClerkBridge = { session?: { getToken(): Promise<string | null> } };

export async function adminToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const clerk = (window as unknown as { Clerk?: ClerkBridge }).Clerk;
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = await adminToken();
  if (!token) return null;
  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.headers ?? {}),
      },
    });
  } catch {
    return null;
  }
}

export type WhoAmI = { ok: boolean; userId: string; admin: boolean };

export async function whoAmI(): Promise<WhoAmI | null> {
  const response = await request("/whoami");
  if (!response?.ok) return null;
  return (await response.json()) as WhoAmI;
}

export async function adminCatalogue(): Promise<CatalogueItem[] | null> {
  const response = await request("/catalogue");
  if (!response?.ok) return null;
  const body = (await response.json()) as { items?: CatalogueItem[] };
  return body.items ?? [];
}

export async function adminAddItem(payload: {
  name: string;
  category: string;
  unit: string;
  spec: string;
  tier: string;
  relevance: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const response = await request("/admin/catalogue/items", { method: "POST", body: JSON.stringify(payload) });
  if (!response) return { ok: false, error: "Not signed in" };
  return (await response.json()) as { ok: boolean; id?: string; error?: string };
}

export async function adminUpdateItem(
  id: string,
  patch: { name?: string; unit?: string; category?: string; spec?: string; active?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const response = await request(`/admin/catalogue/items/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
  if (!response) return { ok: false, error: "Not signed in" };
  return (await response.json()) as { ok: boolean; error?: string };
}

export async function adminAddPrice(
  itemId: string,
  priceGhs: number,
  note = "",
): Promise<{ ok: boolean; error?: string }> {
  const response = await request("/admin/catalogue/prices", {
    method: "POST",
    body: JSON.stringify({ itemId, priceGhs, note, source: "desktop admin" }),
  });
  if (!response) return { ok: false, error: "Not signed in" };
  return (await response.json()) as { ok: boolean; error?: string };
}
