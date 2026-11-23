import type { SavedEstimate } from "./types";

/**
 * The estimate a person actually saved: lines, spaces, overrides, special loads and
 * the rule set that produced them. It travels to D1 with the row so a second device
 * (or a cleared browser) rebuilds the same estimate instead of a hollow summary.
 */
export const SNAPSHOT_VERSION = 1;

export type EstimateSnapshot = {
  version: number;
  name: string;
  kind: SavedEstimate["kind"];
  detail: string;
  totalGhs: number | null;
  template?: string;
  quality?: string;
  counts?: Record<string, number>;
  items?: SavedEstimate["items"];
  quantities?: SavedEstimate["quantities"];
};

/** Only the parts worth storing are copied, so secrets or UI state never travel. */
export function toSnapshot(entry: SavedEstimate): EstimateSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    name: entry.name,
    kind: entry.kind,
    detail: entry.detail,
    totalGhs: entry.totalGhs,
    template: entry.template,
    quality: entry.quality,
    counts: entry.counts,
    items: entry.items,
    quantities: entry.quantities,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Reads a snapshot back from storage. Unknown or damaged payloads return an empty
 * patch so the row's own columns remain the fallback.
 */
export function fromSnapshot(value: unknown): Partial<SavedEstimate> {
  if (!isRecord(value)) return {};

  const patch: Partial<SavedEstimate> = {};

  if (typeof value.name === "string" && value.name.trim()) patch.name = value.name;
  if (value.kind === "quick" || value.kind === "materials") patch.kind = value.kind;
  if (typeof value.detail === "string") patch.detail = value.detail;
  if (value.totalGhs === null || typeof value.totalGhs === "number") patch.totalGhs = value.totalGhs;
  if (typeof value.template === "string") patch.template = value.template;
  if (typeof value.quality === "string") patch.quality = value.quality;

  if (isRecord(value.counts)) {
    const counts: Record<string, number> = {};
    for (const [key, count] of Object.entries(value.counts)) {
      const numeric = Number(count);
      if (Number.isFinite(numeric)) counts[key] = numeric;
    }
    patch.counts = counts;
  }

  if (Array.isArray(value.items)) {
    patch.items = value.items
      .filter((line): line is Record<string, unknown> => isRecord(line) && typeof line.name === "string")
      .map((line) => ({
        name: String(line.name),
        quantity: Number.isFinite(Number(line.quantity)) ? Math.max(0, Number(line.quantity)) : 0,
        unit: typeof line.unit === "string" ? line.unit : "No.",
        priceGhs: typeof line.priceGhs === "number" ? line.priceGhs : null,
      }));
  }

  if (isRecord(value.quantities)) {
    const quantities = value.quantities;
    if (typeof quantities.templateId === "string" && Array.isArray(quantities.spaces)) {
      patch.quantities = {
        templateId: quantities.templateId,
        specLevel: typeof quantities.specLevel === "string" ? quantities.specLevel : "standard",
        ruleSet: typeof quantities.ruleSet === "string" ? quantities.ruleSet : "ESTIMO-GH-QTY-v1.0",
        specialLoads: Array.isArray(quantities.specialLoads)
          ? quantities.specialLoads.filter((key): key is string => typeof key === "string")
          : undefined,
        spaces: quantities.spaces
          .filter((space): space is Record<string, unknown> => isRecord(space))
          .map((space) => ({
            id: String(space.id ?? ""),
            space_name: String(space.space_name ?? "Space"),
            room_type: String(space.room_type ?? "bedroom"),
            length_m: Number(space.length_m) || 0,
            width_m: Number(space.width_m) || 0,
            height_m: Number(space.height_m) || 0,
            quantity: Number(space.quantity) || 1,
            workstations: Number.isFinite(Number(space.workstations)) ? Number(space.workstations) : undefined,
            checkout_counters: Number.isFinite(Number(space.checkout_counters)) ? Number(space.checkout_counters) : undefined,
            machine_count: Number.isFinite(Number(space.machine_count)) ? Number(space.machine_count) : undefined,
          })),
        overrides: Array.isArray(quantities.overrides)
          ? quantities.overrides
              .filter((row): row is Record<string, unknown> => isRecord(row))
              .map((row) => ({
                space_id: String(row.space_id ?? ""),
                point_type: String(row.point_type ?? "lighting"),
                value: Number(row.value) || 0,
                source: typeof row.source === "string" ? row.source : "user_override",
              }))
          : undefined,
      };
    }
  }

  return patch;
}
