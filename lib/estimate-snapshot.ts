import type { SavedEstimate } from "./types";

/**
 * The estimate a person actually saved: lines, spaces, overrides, special loads and
 * the rule set that produced them. It travels to D1 with the row so a second device
 * (or a cleared browser) rebuilds the same estimate instead of a hollow summary.
 */
export const SNAPSHOT_VERSION = 2;

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

/** A stored number, or null when the value cannot be a number. */
function numberOf(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
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
        // configured loads travel with the estimate, so a reopened take-off keeps the
        // rating, route and manufacturer figures the person entered
        specialLoadInstances: Array.isArray(quantities.specialLoadInstances)
          ? quantities.specialLoadInstances
              .filter((row): row is Record<string, unknown> => isRecord(row) && typeof row.load_key === "string")
              .slice(0, 40)
              .map((row) => ({
                id: typeof row.id === "string" ? row.id : `load-${String(row.load_key)}`,
                load_key: String(row.load_key),
                preset_code: typeof row.preset_code === "string" ? row.preset_code : null,
                quantity: Number(row.quantity) > 0 ? Math.round(Number(row.quantity)) : 1,
                rated_power_kw: numberOf(row.rated_power_kw),
                rated_current_a: numberOf(row.rated_current_a),
                capacity_hp: numberOf(row.capacity_hp),
                supply_voltage_v: numberOf(row.supply_voltage_v),
                phase: row.phase === "three" ? "three" : row.phase === "single" ? "single" : null,
                serving_db_id: typeof row.serving_db_id === "string" ? row.serving_db_id : null,
                target_space_id: typeof row.target_space_id === "string" ? row.target_space_id : null,
                route_length_m: numberOf(row.route_length_m),
                route_source: row.route_source === "USER_OVERRIDE" ? "USER_OVERRIDE" : "AUTO",
                installation_method:
                  row.installation_method === "trunking" ||
                  row.installation_method === "surface" ||
                  row.installation_method === "concealed"
                    ? row.installation_method
                    : "conduit",
                local_isolator_required:
                  typeof row.local_isolator_required === "boolean" ? row.local_isolator_required : null,
                dedicated_circuit: typeof row.dedicated_circuit === "boolean" ? row.dedicated_circuit : null,
                manufacturer_cable_size_mm2: numberOf(row.manufacturer_cable_size_mm2),
                manufacturer_breaker_rating_a: numberOf(row.manufacturer_breaker_rating_a),
                manufacturer_rcd_requirement:
                  row.manufacturer_rcd_requirement === "required" ||
                  row.manufacturer_rcd_requirement === "not_required"
                    ? row.manufacturer_rcd_requirement
                    : "unknown",
                manufacturer_notes: typeof row.manufacturer_notes === "string" ? row.manufacturer_notes : "",
                user_notes: typeof row.user_notes === "string" ? row.user_notes : "",
                sizing_source:
                  row.sizing_source === "MANUFACTURER" || row.sizing_source === "USER_OVERRIDE"
                    ? row.sizing_source
                    : "ESTIMO_PROVISIONAL",
              }))
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
