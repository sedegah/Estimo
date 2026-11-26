import { calculateProject, parametersFromRows, rulesByKey } from "@/lib/quantity-engine/engine";
import { MATERIAL_CATALOGUE, priceQuantities, type PriceEntry } from "@/lib/quantity-engine/catalogue";
import { CATALOGUE_MATERIALS } from "@/lib/data/catalogue";
import {
  applySpecialLoads,
  seedSpecialLoads,
  type SpaceRouteRow,
  type SpecialLoadInstance,
} from "@/lib/quantity-engine/special-loads";
import type { CatalogueMaterial } from "@/lib/types";
import globalParameters from "@/lib/data/quantity-engine/global_parameters.json";
import roomRules from "@/lib/data/quantity-engine/room_rules.json";
import circuitRules from "@/lib/data/quantity-engine/circuit_rules.json";
import assemblies from "@/lib/data/quantity-engine/assemblies.json";
import assemblyItems from "@/lib/data/quantity-engine/assembly_items.json";
import templateSpacesData from "@/lib/data/quantity-engine/template_spaces.json";
import structureTemplates from "@/lib/data/quantity-engine/structure_templates.json";
import specialLoadData from "@/lib/data/quantity-engine/special_loads.json";
import spaceRouteData from "@/lib/data/quantity-engine/template_space_routes.json";
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
const specialLoadRows = specialLoadData as unknown[];
const spaceRouteRows = spaceRouteData as unknown[];
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

/** The other way round, for adopting the itemized bill's specification on the way back. */
export const qualityForSpecLevel = (specLevel: string): "basic" | "standard" | "premium" =>
  specLevel === "economy" ? "basic" : specLevel === "premium" ? "premium" : "standard";

export const templateForCode = (code: string): StructureTemplateRow | undefined => {
  const id = TEMPLATE_FOR_CODE[code];
  return templates.find((row) => row.template_id === id) ?? templates.find((row) => row.template_id === "T011");
};

/**
 * The loads the rulebook enables by default (today: the kitchen fridge). The itemized bill
 * seeds these on any plan, so the simple summary must price them too: otherwise one plan
 * quotes two totals depending on which screen is open.
 */
export function defaultSpecialLoadsFor(templateId: string, spaces: SpaceInput[]): SpecialLoadInstance[] {
  const enabled = (specialLoadRows as { load_key: string; default_enabled: boolean }[])
    .filter((row) => row.default_enabled)
    .map((row) => row.load_key);
  if (!enabled.length) return [];
  return seedSpecialLoads(enabled, spaces, spaceRouteRows as unknown as SpaceRouteRow[], templateId);
}

/**
 * Homes are planned with air conditioning: one unit per bedroom and per living room. A
 * single room is the exception, because there is nowhere to put one.
 */
const AIR_CONDITIONED_HOMES = new Set([
  "one_bedroom",
  "two_bedroom",
  "three_bedroom",
  "four_bedroom_villa",
]);

export type PlanDefaults = {
  overrides: PointOverride[];
  instances: SpecialLoadInstance[];
};

/**
 * What a plan starts with, before the person changes anything: the rulebook's default
 * loads, plus the air conditioners a home is expected to have. The simple summary and the
 * itemized bill both seed through here, so a home is air conditioned on both screens.
 */
export function defaultPlanAdditions(args: {
  projectType: string;
  templateId: string;
  spaces: SpaceInput[];
  routes?: SpaceRouteRow[];
  overrides?: PointOverride[];
}): PlanDefaults {
  const routes = args.routes ?? (spaceRouteRows as unknown as SpaceRouteRow[]);
  const existing = args.overrides ?? [];
  const instances = defaultSpecialLoadsFor(args.templateId, args.spaces);
  if (!AIR_CONDITIONED_HOMES.has(args.projectType)) {
    return { overrides: existing, instances };
  }

  const acSpaces = args.spaces.filter(
    (space) => space.room_type === "bedroom" || space.room_type === "living_room",
  );
  if (!acSpaces.length) return { overrides: existing, instances };

  const acOverrides: PointOverride[] = acSpaces
    .filter((space) => !existing.some((entry) => entry.space_id === space.id && entry.point_type === "ac"))
    .map((space) => ({ space_id: space.id, point_type: "ac" as const, value: 1, source: "user_override" as const }));

  const [acLoad] = seedSpecialLoads(["air_conditioner"], args.spaces, routes, args.templateId);
  const airConditioner: SpecialLoadInstance = {
    ...acLoad,
    // a standard 1 HP split, priced provisionally until the person picks the real units
    capacity_hp: 1,
    phase: "single",
    quantity: acSpaces.length,
    sizing_source: "ESTIMO_PROVISIONAL",
  };

  return { overrides: [...existing, ...acOverrides], instances: [...instances, airConditioner] };
}

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
    // "Bedroom 1" + a second bedroom must read "Bedroom 2", not "Bedroom 1 2"
    const isMaster = /master/i.test(prototype.space_name);
    const baseName = isMaster ? "Bedroom" : prototype.space_name.replace(/\s+\d+$/, "");
    for (let index = 0; index < wanted; index += 1) {
      // exactly one master bedroom; the rest are numbered bedrooms
      const name = isMaster
        ? index === 0
          ? "Master Bedroom"
          : `Bedroom ${index + 1}`
        : wanted > 1
          ? `${baseName} ${index + 1}`
          : prototype.space_name;
      next.push({ ...prototype, id: `${prototype.id}-${index + 1}`, space_name: name, quantity: 1 });
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
    if (!response.ok) return {};
    const body = (await response.json()) as {
      items?: { id: string; price_ghs: number | null; price_brand?: string | null; price_source?: string | null; price_updated_at?: string | null }[];
    };
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
  } catch {
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
  result: ReturnType<typeof applySpecialLoads>;
};

/**
 * One live estimate path, used by the simple summary, the itemized screen and the saved
 * project, so every screen shows the same money for the same plan.
 *
 * Configured special loads and point overrides travel with the plan: the summary must
 * price the exact take-off the itemized bill shows, not an approximation of it.
 */
export function liveEstimate(options: {
  templateId: string;
  specLevel: SpecLevel;
  spaces: SpaceInput[];
  prices: Record<string, PriceEntry>;
  specialLoads?: string[];
  specialLoadInstances?: SpecialLoadInstance[];
  overrides?: PointOverride[];
}): LiveEstimate {
  const template = templates.find((row) => row.template_id === options.templateId);
  const base = calculateProject({
    spaces: options.spaces,
    specLevel: options.specLevel,
    projectType: template?.project_type ?? PROJECT_TYPE_FOR_CODE["HOME-2B"],
    templateId: options.templateId,
    params,
    rules,
    circuitRules: circuitRules as never,
    assemblies: assemblies as unknown as AssemblyRow[],
    assemblyItems: assemblyItems as unknown as AssemblyItemRow[],
    // configured loads are counted by applySpecialLoads, so the raw keys stay out
    specialLoads: options.specialLoadInstances?.length ? [] : (options.specialLoads ?? []),
    overrides: options.overrides ?? [],
  });

  const result = applySpecialLoads(base, options.specialLoadInstances ?? [], {
    spareCapacityPct: params.db_spare_capacity_pct,
    cableWastePct: params.cable_waste_pct,
    containmentWastePct: params.containment_waste_pct,
    couplerPerM: params.coupler_per_conduit_m,
    bendPerM: params.bend_per_conduit_m,
    drawBoxPerM: params.drawbox_per_conduit_m,
  });

  const lines = priceQuantities(result.materialQuantities, options.prices, catalogueMap);
  const total = Math.round(lines.reduce((sum, line) => sum + (line.amount ?? 0), 0) * 100) / 100;

  return { total, pricedCount: lines.filter((line) => line.unitPrice !== null).length, lines, result };
}
