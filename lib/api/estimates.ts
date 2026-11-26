import { PROJECT_LABELS } from "@/lib/estimate-model";
import { fromSnapshot, toSnapshot } from "@/lib/estimate-snapshot";
import type { SavedEstimate } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";

type ApiEstimate = {
  id: string;
  name: string;
  template: string;
  quality: string;
  spaces: number;
  total_ghs: number | null;
  status: string;
  counts_json: string | null;
  snapshot_json: string | null;
  created_at: string;
  updated_at: string;
};

type ClerkBridge = { session?: { getToken(): Promise<string | null> } };

async function authToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const clerk = (window as unknown as { Clerk?: ClerkBridge }).Clerk;
  try {
    return (await clerk?.session?.getToken()) ?? null;
  } catch {
    return null;
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response | null> {
  const token = await authToken();
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

function parseJson<T>(value: string | null): T | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

function toSavedEstimate(row: ApiEstimate): SavedEstimate {
  const counts = parseJson<Record<string, number>>(row.counts_json);
  const snapshot = fromSnapshot(parseJson<unknown>(row.snapshot_json));
  const label = PROJECT_LABELS[row.template] ?? row.template;

  return {
    id: row.id,
    name: snapshot.name ?? row.name,
    kind: snapshot.kind ?? "quick",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    detail: snapshot.detail ?? `${label} · ${row.quality} fittings · ${row.spaces} spaces`,
    totalGhs: snapshot.totalGhs ?? row.total_ghs,
    template: snapshot.template ?? row.template,
    quality: snapshot.quality ?? row.quality,
    counts: snapshot.counts ?? counts,
    items: snapshot.items,
    quantities: snapshot.quantities,
  };
}

/** Returns null when the visitor is not signed in (guest mode keeps local data). */
export async function fetchServerEstimates(): Promise<SavedEstimate[] | null> {
  const response = await request("/estimates");
  if (!response?.ok) return null;
  const body = (await response.json()) as { estimates?: ApiEstimate[] };
  return (body.estimates ?? []).map(toSavedEstimate);
}

function bodyFor(entry: SavedEstimate) {
  return {
    id: entry.id,
    name: entry.name,
    template: entry.template ?? "HOME-2B",
    quality: entry.quality ?? "standard",
    counts: entry.counts ?? {},
    totalGhs: entry.totalGhs,
    status: entry.totalGhs ? "estimated" : "draft",
    spaces: entry.quantities?.spaces.length ?? Object.values(entry.counts ?? {}).reduce((sum, value) => sum + Number(value || 0), 0),
    snapshot: toSnapshot(entry),
  };
}

export async function pushCreate(entry: SavedEstimate): Promise<void> {
  await request("/estimates", { method: "POST", body: JSON.stringify(bodyFor(entry)) });
}

export async function pushUpdate(entry: SavedEstimate): Promise<void> {
  await request(`/estimates/${entry.id}`, { method: "PATCH", body: JSON.stringify(bodyFor(entry)) });
}

export async function pushDelete(id: string): Promise<void> {
  await request(`/estimates/${id}`, { method: "DELETE" });
}
