import { calculateProject, parametersFromRows, rulesByKey } from "@/lib/quantity-engine/engine";
import { MATERIAL_CATALOGUE, priceQuantities, type PriceEntry } from "@/lib/quantity-engine/catalogue";
import { CATALOGUE_MATERIALS } from "@/lib/data/catalogue";
import type { CatalogueMaterial } from "@/lib/types";
import globalParameters from "@/lib/data/quantity-engine/global_parameters.json";
import roomRules from "@/lib/data/quantity-engine/room_rules.json";
import circuitRules from "@/lib/data/quantity-engine/circuit_rules.json";
import assemblies from "@/lib/data/quantity-engine/assemblies.json";
import assemblyItems from "@/lib/data/quantity-engine/assembly_items.json";
import templateSpacesData from "@/lib/data/quantity-engine/template_spaces.json";
import structureTemplates from "@/lib/data/quantity-engine/structure_templates.json";
import type {
  AssemblyItemRow,
  AssemblyRow,
  PointOverride,
  RoomRuleRow,
  SpaceInput,
  SpecLevel,
  StructureTemplateRow,
  TemplateSpaceRow,
} from "@/lib/quantity-engine/types";

/**
 * One live estimate path, used by the simple summary and the itemized screen, so both
 * show the same money for the same plan.
 */

const API_URL = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";

const params = parametersFromRows(globalParameters as unknown as Parameters<typeof parametersFromRows>[0]);
const rules = rulesByKey(roomRules as unknown as RoomRuleRow[]);
const templates = structureTemplates as unknown as StructureTemplateRow[];
const templateSpaces = templateSpacesData as unknown as TemplateSpaceRow[];

export const TEMPLATE_FOR_CODE: Record<string, string> = {
  "HOME-1R": "T004",
  "HOME-1B": "T008",
  "HOME-2B": "T011",
  "HOME-3B": "T014",
  "HOME-4B": "T017",
  "SHOP-KIOSK": "T002",
  "SHOP-RETAIL": "T023",
  "COMM-OFF-S": "T020",
  "IND-WORK": "T026",
};

export const PROJECT_TYPE_FOR_CODE: Record<string, string> = {
  "HOME-1R": "single_room",
  "HOME-1B": "one_bedroom",
  "HOME-2B": "two_bedroom",
  "HOME-3B": "three_bedroom",
  "HOME-4B": "four_bedroom_villa",
  "SHOP-KIOSK": "container_kiosk",
  "SHOP-RETAIL": "shop_retail",
  "COMM-OFF-S": "office",
  "IND-WORK": "workshop_small_factory",
};

export const specLevelForQuality = (quality: string): SpecLevel =>
  quality === "basic" ? "economy" : quality === "premium" ? "premium" : "standard";

export const templateForCode = (code: string): StructureTemplateRow | undefined => {
  const id = TEMPLATE_FOR_CODE[code];
  return templates.find((row) => row.template_id === id) ?? templates.find((row) => row.template_id === "T011");
};

/** Spaces as the itemized screen would start them for a template. */
export function templatePlanSpaces(templateId: string): SpaceInput[] {
  const template = templates.find((row) => row.template_id === templateId);
  if (!template) return [];
  return templateSpaces
    .filter((space) => space.template_id === template.template_id)
    .sort((a, b) => a.space_no - b.space_no)
    .map((space, index) => ({
      id: `${template.template_id}-${space.space_no || index + 1}`,
      space_name: space.space_name,
      room_type: space.room_type,
      length_m: space.length_m,
      width_m: space.width_m,
      height_m: space.height_m,
      quantity: space.quantity ?? 1,
      workstations: space.workstations ?? 0,
      checkout_counters: space.checkout_counters ?? 0,
      machine_count: space.machine_count ?? 0,
    }));
}

/** Room-type counts behind the simple summary. */
export const COUNT_FOR_ROOM: Record<string, string> = {
  bedrooms: "bedroom",
  bathrooms: "bathroom",
  kitchens: "kitchen",
  living: "living_room",
  porches: "porch_veranda",
};

/**
 * Rebuilds the plan from the summary's counters: each room type keeps the template's
 * dimensions and gains or loses copies to match the count the person set. The itemized
 * screen receives exactly these spaces, so the two views cannot disagree.
 */
export function spacesFromCounts(templateId: string, counts: Record<string, number>): SpaceInput[] {
  const base = templatePlanSpaces(templateId);
  const byType = new Map<string, SpaceInput[]>();
  for (const space of base) {
    const list = byType.get(space.room_type) ?? [];
    list.push(space);
    byType.set(space.room_type, list);
  }

  const next: SpaceInput[] = [];
  const handled = new Set<string>();

  for (const [field, roomType] of Object.entries(COUNT_FOR_ROOM)) {
    const wanted = Math.max(0, Math.round(counts[field] ?? 0));
    if (!byType.has(roomType) || handled.has(roomType)) continue;
    handled.add(roomType);
    const prototype = byType.get(roomType)![0];
    for (let index = 0; index < wanted; index += 1) {
      next.push({
        ...prototype,
        id: `${prototype.id}-${index + 1}`,
        space_name: wanted > 1 ? `${prototype.space_name} ${index + 1}` : prototype.space_name,
        quantity: 1,
      });
    }
  }

  // any template space the summary does not count stays as it is
  for (const space of base) {
    if (handled.has(space.room_type)) continue;
    next.push(space);
  }

  return next;
}

export async function fetchLivePrices(): Promise<Record<string, PriceEntry>> {
  try {
    const response = await fetch(`${API_URL}/catalogue`);
    const debug = { url: `${API_URL}/catalogue`, status: response.status, items: 0, sample: null as unknown, error: "" };
    if (typeof window !== "undefined") (window as unknown as { __priceDebug?: unknown }).__priceDebug = debug;
    if (!response.ok) return {};
    const body = (await response.json()) as {
      items?: { id: string; price_ghs: number | null; price_brand?: string | null; price_source?: string | null; price_updated_at?: string | null }[];
    };
    debug.items = (body.items ?? []).length;
    debug.sample = body.items?.[0] ?? null;
    if (typeof window !== "undefined") (window as unknown as { __priceDebug?: unknown }).__priceDebug = debug;
    const prices: Record<string, PriceEntry> = {};
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
  } catch (error) {
    if (typeof window !== "undefined") (window as unknown as { __priceDebug?: unknown }).__priceDebug = { error: String(error) };
    return {};
  }
}

export const catalogueMap = new Map(
  (CATALOGUE_MATERIALS as unknown as CatalogueMaterial[])
    .filter((material) => Object.values(MATERIAL_CATALOGUE).some((link) => link.id === material.id))
    .map((material) => [material.id, { id: material.id, name: material.name, unit: material.unit }]),
);

export type LiveEstimate = {
  total: number;
  pricedCount: number;
  lines: ReturnType<typeof priceQuantities>;
  result: ReturnType<typeof calculateProject>;
};

export function liveEstimate(options: {
  templateId: string;
  specLevel: SpecLevel;
  spaces: SpaceInput[];
  prices: Record<string, PriceEntry>;
  specialLoads?: string[];
  overrides?: PointOverride[];
}): LiveEstimate {
  const template = templates.find((row) => row.template_id === options.templateId);
  const result = calculateProject({
    spaces: options.spaces,
    specLevel: options.specLevel,
    projectType: template?.project_type ?? PROJECT_TYPE_FOR_CODE["HOME-2B"],
    templateId: options.templateId,
    params,
    rules,
    circuitRules: circuitRules as never,
    assemblies: assemblies as unknown as AssemblyRow[],
    assemblyItems: assemblyItems as unknown as AssemblyItemRow[],
    specialLoads: options.specialLoads ?? [],
    overrides: options.overrides ?? [],
  });

  const lines = priceQuantities(result.materialQuantities, options.prices, catalogueMap);
  const total = Math.round(lines.reduce((sum, line) => sum + (line.amount ?? 0), 0) * 100) / 100;

  return { total, pricedCount: lines.filter((line) => line.unitPrice !== null).length, lines, result };
}
