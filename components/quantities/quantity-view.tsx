"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { calculateProject, rulesByKey } from "@/lib/quantity-engine/engine";
import { priceQuantities } from "@/lib/quantity-engine/catalogue";
import type { PriceEntry } from "@/lib/quantity-engine/catalogue";
import type {
  AssemblyItemRow,
  AssemblyRow,
  CircuitRuleRow,
  PointOverride,
  PointType,
  RoomRuleRow,
  SpaceInput,
  SpecLevel,
} from "@/lib/quantity-engine/types";
import type { CatalogueMaterialInfo } from "@/lib/quantity-engine/catalogue";
import {
  STATUS_LABEL,
  acSuppressionOverrides,
  applySpecialLoads,
  autoRouteForSpace,
  configurationStatus,
  dbKeyForSpace,
  newSpecialLoadInstance,
  parseSpecialLoadInstances,
  specialLoadDefinition,
  specialLoadLabels,
  seedSpecialLoads,
  specialLoadSummary,
  syncAcQuantity,
  type SpaceRouteRow,
  type SpecialLoadInstance,
} from "@/lib/quantity-engine/special-loads";
import { SpecialLoadConfigurator } from "./special-load-configurator";
import { pricedCount, pricedTotal } from "@/lib/estimate-total";
import { unitLabel } from "@/lib/format";
import { readBasket, writeBasket } from "@/lib/storage/basket";
import { listSavedEstimates, saveEstimate, updateSavedEstimate } from "@/lib/storage/saved-estimates";
import { pushCreate, pushUpdate } from "@/lib/api/estimates";
import type { BasketItem } from "@/lib/types";

interface TemplateSummary {
  id: string;
  name: string;
  projectType: string;
  sizeClass: string;
  description: string;
  spaceCount: number;
}

interface Props {
  signedIn?: boolean;
  templateCode?: string;
  initialTemplateId?: string;
  initialSpecLevel?: SpecLevel;
  initialSpaces?: SpaceInput[];
  /** Priced-estimate editor link, so the classic flow stays reachable. */
  estimateHref?: string;
  projectTypes: { key: string; label: string }[];
  templates: TemplateSummary[];
  spacesByTemplate: Record<string, SpaceInput[]>;
  rules: RoomRuleRow[];
  params: Record<string, number>;
  circuitRules: CircuitRuleRow[];
  assemblies: AssemblyRow[];
  assemblyItems: AssemblyItemRow[];
  catalogue: Record<string, CatalogueMaterialInfo>;
  prices: Record<string, PriceEntry>;
  specialLoads?: { load_key: string; space_context: string; selection_mode: string; default_enabled: boolean; circuit_policy: string; notes: string }[];
  /** Published DB-to-space distances, so a load's route starts from the real plan. */
  spaceRoutes?: SpaceRouteRow[];
}

const SPECS: { key: SpecLevel; label: string }[] = [
  { key: "economy", label: "Economy" },
  { key: "standard", label: "Standard" },
  { key: "premium", label: "Premium" },
];

const SIZE_LABEL: Record<string, string> = { compact: "Compact", standard: "Standard", large: "Large" };

const POINT_FIELDS: { type: PointType; label: string; key: keyof SpaceInputResult }[] = [
  { type: "lighting", label: "Lights", key: "lighting_points" },
  { type: "double_sockets", label: "Sockets", key: "double_sockets" },
  { type: "fans", label: "Fans", key: "fan_points" },
  { type: "ac", label: "AC", key: "ac_points" },
  { type: "tv", label: "TV", key: "tv_points" },
  { type: "data", label: "Data", key: "data_points" },
  { type: "switches", label: "Switches", key: "switch_positions" },
];

type SpaceInputResult = {
  lighting_points: number;
  double_sockets: number;
  fan_points: number;
  ac_points: number;
  tv_points: number;
  data_points: number;
  switch_positions: number;
};

/** Catalogue units read badly on a bill of quantities: "No." becomes "pcs". */
const UNIT_LABEL: Record<string, string> = {
  "No.": "pcs",
  "length": "lengths",
  "m": "m",
  "set": "sets",
  "bag": "bags",
  "roll": "rolls",
  "strip": "strips",
  "box": "boxes",
  "coil": "coils",
  "pair": "pairs",
};

/** One card per load type: the quantity field covers multiples of the same load. */
function dedupeLoads(instances: SpecialLoadInstance[]): SpecialLoadInstance[] {
  const seen = new Set<string>();
  return instances.filter((instance) => {
    if (seen.has(instance.load_key)) return false;
    seen.add(instance.load_key);
    return true;
  });
}

/** Names stay readable: one master bedroom, the rest numbered per room type. */
/** Dimensions and quantities may be cleared while typing; values commit when valid. */
function NumberCell({ value, min, step, onCommit }: { value: number; min: number; step: number; onCommit: (next: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);
  return (
    <input
      type="number"
      min={min}
      step={step}
      value={text}
      onChange={(event) => {
        const raw = event.target.value;
        setText(raw);
        const next = Number(raw);
        if (raw !== "" && Number.isFinite(next) && next >= min) onCommit(next);
      }}
      onBlur={() => {
        const next = Number(text);
        if (text === "" || !Number.isFinite(next) || next < min) {
          onCommit(min);
          setText(String(min));
        } else {
          onCommit(next);
        }
      }}
    />
  );
}

const tidyNames = (list: SpaceInput[]): SpaceInput[] => {
  const seen = new Map<string, number>();
  let masterUsed = false;
  return list.map((space) => {
    const base = space.space_name.replace(/\s+\d+(\s+\d+)?$/, "").trim() || "Space";
    const key = space.room_type;
    const index = (seen.get(key) ?? 0) + 1;
    seen.set(key, index);
    if (space.room_type === "bedroom") {
      if (/master/i.test(space.space_name) && !masterUsed) {
        masterUsed = true;
        return { ...space, space_name: "Master Bedroom" };
      }
      const numbered = /^bedroom$/i.test(base) ? index - (masterUsed ? 1 : 0) : index - (masterUsed ? 1 : 0);
      return { ...space, space_name: `Bedroom ${Math.max(1, numbered)}` };
    }
    return { ...space, space_name: index > 1 ? `${base} ${index}` : base };
  });
};
const money = (value: number | null) =>
  value === null || value === undefined
    ? "—"
    : `GHS ${value.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A load whose lines are all unpriced is "pending", never GHS 0.00. */
const loadCostLabel = (cost: { total: number; unpriced: number } | undefined) => {
  if (!cost) return "—";
  if (cost.total === 0 && cost.unpriced > 0) return "Pending";
  return money(cost.total);
};

export function QuantityView(props: Props) {
  const firstTemplate =
    props.templates.find((template) => template.id === props.initialTemplateId) ??
    props.templates.find((template) => template.projectType === "two_bedroom") ??
    props.templates[0];
  const [projectType, setProjectType] = useState(firstTemplate.projectType);
  const [templateId, setTemplateId] = useState(firstTemplate.id);
  const [specLevel, setSpecLevel] = useState<SpecLevel>(props.initialSpecLevel ?? "standard");
  const [spaces, setSpaces] = useState<SpaceInput[]>(
    tidyNames(props.initialSpaces?.length ? props.initialSpaces : (props.spacesByTemplate[firstTemplate.id] ?? [])),
  );
  const [overrides, setOverrides] = useState<PointOverride[]>([]);
  const [added, setAdded] = useState("");
  const [instances, setInstances] = useState<SpecialLoadInstance[]>(() =>
    seedSpecialLoads(
      (props.specialLoads ?? []).filter((load) => load.default_enabled).map((load) => load.load_key),
      props.initialSpaces?.length ? props.initialSpaces : (props.spacesByTemplate[firstTemplate.id] ?? []),
      props.spaceRoutes ?? [],
      firstTemplate.id,
    ),
  );
  const [openLoadId, setOpenLoadId] = useState<string | null>(null);

  /** Loads offered for the rooms in this plan, per the rulebook's space_context. */
  const availableLoads = useMemo(() => {
    const contexts = new Set<string>(["building"]);
    for (const space of spaces) {
      const type = space.room_type;
      if (type === "kitchen") { contexts.add("kitchen"); contexts.add("kitchen_or_utility"); contexts.add("kitchen_or_bathroom"); }
      if (type === "utility_room") contexts.add("kitchen_or_utility");
      if (type === "bathroom" || type === "wc") { contexts.add("bathroom"); contexts.add("kitchen_or_bathroom"); }
      if (["bedroom", "living_room", "dining_room", "private_office", "meeting_room", "reception"].includes(type)) contexts.add("habitable_room");
      if (type === "workshop") { contexts.add("workshop"); contexts.add("shop_or_workshop"); }
      if (type === "shop_floor" || type === "store") contexts.add("shop_or_workshop");
      if (type === "porch_veranda" || type === "external_area") contexts.add("external");
      if (type === "garage") contexts.add("garage");
    }
    const rows = props.specialLoads ?? [];
    return [...rows].sort((a, b) => {
      const score = (row: { space_context: string }) => (contexts.has(row.space_context) ? 0 : 1);
      return score(a) - score(b);
    });
  }, [props.specialLoads, spaces]);

  // The working estimate is kept in this browser, signed in or not. Nothing is written
  // until the draft has been read, so the first render cannot overwrite the plan it is
  // about to restore.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      // an explicit plan from the simple screen wins over whatever was drafted
      if (props.initialSpaces?.length) return;
      const raw = localStorage.getItem("estimo_estimate_draft_v1");
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        templateId?: string;
        specLevel?: SpecLevel;
        spaces?: SpaceInput[];
        overrides?: PointOverride[];
        loads?: string[];
        specialLoadInstances?: unknown[];
      };
      if (draft.templateId === templateId && draft.spaces?.length) {
        const draftSpaces = tidyNames(draft.spaces);
        setSpecLevel(draft.specLevel ?? "standard");
        setSpaces(draftSpaces);
        setOverrides(draft.overrides ?? []);
        // new drafts carry whole instances; older ones only carried load keys
        const stored = dedupeLoads(parseSpecialLoadInstances(draft.specialLoadInstances));
        if (stored.length) setInstances(stored);
        else if (Array.isArray(draft.loads)) {
          setInstances(seedSpecialLoads(draft.loads, draftSpaces, props.spaceRoutes ?? [], draft.templateId));
        }
        if (props.initialSpecLevel) setSpecLevel(props.initialSpecLevel);
      }
    } catch {}
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "estimo_estimate_draft_v1",
        JSON.stringify({ templateId, specLevel, spaces, overrides, specialLoadInstances: instances }),
      );
    } catch {}
  }, [hydrated, templateId, specLevel, spaces, overrides, instances]);
  // the priced bill is published below, once the lines exist: the simple summary reads it
  // as the source of truth rather than pricing the plan a second way

  /**
   * An automatic route follows the space it serves, until a person types one. When the
   * plan changes under a load (a different template, a removed space), the load is
   * pointed at the closest space the new plan has instead of keeping an orphan id.
   */
  useEffect(() => {
    if (!spaces.length) return;
    const routes = props.spaceRoutes ?? [];
    setInstances((current) =>
      current.map((instance) => {
        const known = spaces.some((space) => space.id === instance.target_space_id);
        const replacement = known
          ? null
          : seedSpecialLoads([instance.load_key], spaces, routes, templateId)[0];
        const targetId = replacement ? replacement.target_space_id : instance.target_space_id;
        const distance = autoRouteForSpace(routes, templateId, targetId);
        return {
          ...instance,
          target_space_id: targetId,
          serving_db_id: replacement ? replacement.serving_db_id : instance.serving_db_id,
          route_length_m:
            instance.route_source === "AUTO" ? (distance ?? instance.route_length_m) : instance.route_length_m,
        };
      }),
    );
  }, [spaces, templateId, props.spaceRoutes]);
  const [livePrices, setLivePrices] = useState<Record<string, PriceEntry>>(props.prices);

  const pricesFetched = useRef(false);

  /** Catalogue prices, fetched once, so a save always records real amounts. */
  const loadPrices = useCallback(async (): Promise<Record<string, PriceEntry>> => {
    if (Object.keys(livePrices).length) return livePrices;
    const base = process.env.NEXT_PUBLIC_ESTIMO_API_URL ?? "https://estimo-api.sedegahkimathi.workers.dev";
    const ids = new Set(Object.keys(props.catalogue));
    if (!ids.size) return {};
    try {
      const response = await fetch(`${base}/catalogue`);
      if (!response.ok) return {};
      const body = (await response.json()) as {
        items?: { id: string; price_ghs: number | null; price_brand?: string | null; price_source?: string | null; price_updated_at?: string | null }[];
      };
      const next: Record<string, PriceEntry> = {};
      for (const item of body.items ?? []) {
        if (!ids.has(item.id) || typeof item.price_ghs !== "number") continue;
        next[item.id] = {
          price: item.price_ghs,
          brand: item.price_brand ?? null,
          source: item.price_source ?? null,
          updatedAt: item.price_updated_at ?? null,
        };
      }
      setLivePrices(next);
      pricesFetched.current = true;
      return next;
    } catch {
      return {};
    }
  }, [livePrices, props.catalogue]);

  useEffect(() => {
    if (Object.keys(props.prices).length) {
      setLivePrices(props.prices);
      return;
    }
    if (Object.keys(livePrices).length || pricesFetched.current) return;
    void loadPrices();
  }, [livePrices, props.prices, loadPrices]);

  const templateName =
    props.templates.find((template) => template.id === templateId)?.name ?? "Project";

  const templatesForType = useMemo(
    () => props.templates.filter((template) => template.projectType === projectType),
    [props.templates, projectType],
  );

  const rules = useMemo(() => rulesByKey(props.rules), [props.rules]);

  /**
   * A dining room always gets a ceiling fan. It is written as an editable override,
   * so the rule set stays as published and the person can still set it to 0.
   */
  useEffect(() => {
    setOverrides((current) => {
      const missing = spaces
        .filter((space) => space.room_type === "dining_room")
        .filter((space) => !current.some((entry) => entry.space_id === space.id && entry.point_type === "fans"));
      if (!missing.length) return current;
      return [
        ...current,
        ...missing.map((space): PointOverride => ({ space_id: space.id, point_type: "fans", value: 1, source: "template" })),
      ];
    });
  }, [spaces]);

  const roomTypes = useMemo(
    () =>
      Array.from(new Set(props.rules.filter((rule) => rule.spec_level === specLevel).map((rule) => rule.room_type))).sort(),
    [props.rules, specLevel],
  );

  /**
   * The engine counts points and circuits; the special-load configurator adds the
   * configured loads' own circuits and materials on top. Keeping the two apart means a
   * change to load sizing can never move the golden quantity outputs.
   *
   * An AC load reuses the counts from the Points table, so the engine's generic AC points
   * are switched off while the configured AC covers them; otherwise the same air
   * conditioner would be costed twice.
   */
  const engineOverrides = useMemo(() => {
    const suppression = acSuppressionOverrides(spaces, instances);
    return suppression.length ? [...overrides, ...suppression] : overrides;
  }, [spaces, overrides, instances]);

  const result = useMemo(() => {
    const base = calculateProject({
      spaces,
      specLevel,
      projectType,
      templateId,
      overrides: engineOverrides,
      specialLoads: [],
      params: props.params,
      rules,
      circuitRules: props.circuitRules,
      assemblies: props.assemblies,
      assemblyItems: props.assemblyItems,
    });
    return applySpecialLoads(base, instances, {
      spareCapacityPct: props.params.db_spare_capacity_pct,
      cableWastePct: props.params.cable_waste_pct,
      containmentWastePct: props.params.containment_waste_pct,
      couplerPerM: props.params.coupler_per_conduit_m,
      bendPerM: props.params.bend_per_conduit_m,
      drawBoxPerM: props.params.drawbox_per_conduit_m,
    });
  }, [spaces, specLevel, projectType, templateId, engineOverrides, instances, props, rules]);

  const auto = useMemo(
    () =>
      calculateProject({
        spaces,
        specLevel,
        projectType,
        templateId,
        params: props.params,
        rules,
        circuitRules: props.circuitRules,
        assemblies: props.assemblies,
        assemblyItems: props.assemblyItems,
      }),
    [spaces, specLevel, projectType, templateId, props, rules],
  );

  /**
   * Air conditioners counted in the Points table, overrides included. The AC load takes
   * this as its quantity, so its circuit, materials and price multiply with the plan.
   */
  const acPointTotal = useMemo(() => {
    const total = auto.spaces.reduce((sum, space) => {
      const override = overrides.find(
        (entry) => entry.space_id === space.space_id && entry.point_type === "ac" && entry.source === "user_override",
      );
      return sum + (override ? override.value : space.ac_points);
    }, 0);
    return Math.max(0, Math.round(total));
  }, [auto.spaces, overrides]);

  /** Adding the AC load after counting the ACs must pick the count up, not start at one. */
  const hasAcLoad = instances.some((instance) => instance.load_key === "air_conditioner");

  useEffect(() => {
    setInstances((current) => {
      if (!current.some((instance) => instance.load_key === "air_conditioner")) return current;
      // zero counted is a legitimate state: the card waits as "configuration required"
      const next = syncAcQuantity(current, acPointTotal);
      return next.some((instance, index) => instance !== current[index]) ? next : current;
    });
  }, [acPointTotal, hasAcLoad]);

  const catalogueMap = useMemo(() => new Map(Object.entries(props.catalogue)), [props.catalogue]);
  const lines = useMemo(
    () => priceQuantities(result.materialQuantities, livePrices, catalogueMap),
    [result.materialQuantities, livePrices, catalogueMap],
  );

  const total = pricedTotal(lines);
  const pricedCountValue = pricedCount(lines);

  /**
   * Publishes the priced bill into the shared draft. The itemized screen is the source of
   * truth for price: the simple summary reads this, so the two can never quote different
   * money for the same estimate.
   */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        "estimo_estimate_draft_v1",
        JSON.stringify({
          templateId,
          specLevel,
          spaces,
          overrides,
          specialLoadInstances: instances,
          bill: {
            totalGhs: pricedTotal(lines),
            lines: lines.map((line) => ({
              name: line.catalogueName,
              quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
              unit: line.catalogueUnit,
              priceGhs: line.unitPrice,
            })),
          },
        }),
      );
    } catch {}
  }, [hydrated, templateId, specLevel, spaces, overrides, instances, lines]);

  /** What each configured load costs on its own, and how much of it has no price yet. */
  const loadCosts = useMemo(() => {
    const costs = new Map<string, { total: number; unpriced: number }>();
    for (const entry of result.specialLoadBreakdown) {
      const priced = priceQuantities(entry.materials, livePrices, catalogueMap);
      costs.set(entry.instanceId, {
        total: pricedTotal(priced),
        unpriced: priced.filter((line) => line.unitPrice === null).length,
      });
    }
    return costs;
  }, [result.specialLoadBreakdown, livePrices, catalogueMap]);

  const loadCostTotal = useMemo(
    () => Array.from(loadCosts.values()).reduce((sum, entry) => sum + entry.total, 0),
    [loadCosts],
  );
  const loadUnpricedTotal = useMemo(
    () => Array.from(loadCosts.values()).reduce((sum, entry) => sum + entry.unpriced, 0),
    [loadCosts],
  );

  const pickProjectType = (key: string) => {
    setProjectType(key);
    const next = props.templates.find((template) => template.projectType === key);
    if (next) {
      setTemplateId(next.id);
      setSpaces(props.spacesByTemplate[next.id] ?? []);
      setOverrides([]);
      setAdded("");
    }
  };

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    setSpaces(props.spacesByTemplate[id] ?? []);
    setOverrides([]);
    setAdded("");
  };

  const updateSpace = (id: string, patch: Partial<SpaceInput>) => {
    setSpaces((current) => current.map((space) => (space.id === id ? { ...space, ...patch } : space)));
    setAdded("");
  };

  const addSpace = () => {
    setSpaces((current) => [
      ...current,
      {
        id: `space-${Date.now()}`,
        space_name: `Space ${current.length + 1}`,
        room_type: "living_room",
        length_m: 4,
        width_m: 3,
        height_m: 3,
        quantity: 1,
      },
    ]);
    setAdded("");
  };

  const duplicateSpace = (space: SpaceInput) => {
    setSpaces((current) => {
      const index = current.findIndex((entry) => entry.id === space.id);
      const copy: SpaceInput = { ...space, id: `space-${Date.now()}`, space_name: `${space.space_name} 2` };
      return [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
    });
    setAdded("");
  };

  const removeSpace = (id: string) => {
    setSpaces((current) => current.filter((space) => space.id !== id));
    setOverrides((current) => current.filter((override) => override.space_id !== id));
    setAdded("");
  };

  const setOverride = (spaceId: string, type: PointType, raw: string) => {
    setOverrides((current) => {
      const without = current.filter((override) => !(override.space_id === spaceId && override.point_type === type));
      if (raw.trim() === "") return without;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0) return without;
      return [...without, { space_id: spaceId, point_type: type, value, source: "user_override" }];
    });
  };

  const removeLoad = (id: string) => {
    setInstances((current) => current.filter((instance) => instance.id !== id));
    setOpenLoadId((current) => (current === id ? null : current));
    setAdded("");
  };

  /** Applying is the only path from the form into the estimate. */
  const applyLoad = (next: SpecialLoadInstance) => {
    setInstances((current) =>
      current.some((instance) => instance.id === next.id)
        ? current.map((instance) => (instance.id === next.id ? next : instance))
        : dedupeLoads([...current, next]),
    );
    setOpenLoadId(null);
    setAdded("");
  };

  /** One action: files the estimate under Saved projects and fills the basket. */
  /**
   * Saves the take-off as a project, exactly as the simple screen's "Save for later" does:
   * the browser keeps it either way, and a signed-in account also gets a server copy.
   */
  const saveEstimateNow = async () => {
    const pricesNow = await loadPrices();
    const saveLines = priceQuantities(result.materialQuantities, pricesNow, catalogueMap);
    const saveItems = saveLines.map((line) => ({
      name: line.catalogueName,
      quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
      unit: line.catalogueUnit,
      priceGhs: line.unitPrice,
    }));
    const saveTotal = pricedTotal(saveItems);
    const counts = {
      lights: result.totals.lighting_points,
      sockets: result.totals.double_sockets,
      switches: result.totals.switch_positions,
      fans: result.totals.fan_points,
      data: result.totals.data_points,
      spaces: result.spaces.length,
    };
    const existing = listSavedEstimates().find(
      (entry) => entry.quantities?.templateId === templateId && entry.quantities?.specLevel === specLevel,
    );
    const payload = {
      name: `${templateName} estimate`,
      kind: "quick" as const,
      detail: `${templateName} · ${specLevel} · ${result.totals.floor_area_m2} m² · ${result.totals.total_final_circuits} circuits`,
      totalGhs: saveTotal > 0 ? saveTotal : null,
      template: props.templateCode ?? "HOME-2B",
      counts,
      // the saved project speaks the same quality language as the simple screen
      quality: specLevel === "economy" ? "basic" : specLevel === "premium" ? "premium" : "standard",
      items: saveItems,
      quantities: {
        templateId,
        specLevel,
        ruleSet: "ESTIMO-GH-QTY-v1.0",
        spaces,
        overrides,
        specialLoads: instances.map((instance) => instance.load_key),
        specialLoadInstances: instances,
      },
    };
    const saved = existing ? updateSavedEstimate(existing.id, payload) : saveEstimate(payload);
    if (!saved) return null;
    if (props.signedIn) {
      if (existing) void pushUpdate(saved);
      else void pushCreate(saved);
    }
    return saved;
  };

  const autoFor = (spaceId: string, key: keyof SpaceInputResult) => {
    const space = auto.spaces.find((entry) => entry.space_id === spaceId);
    return space ? Number(space[key]) : 0;
  };

  /** Downloads the current take-off as a PDF, signed in or as a short-lived link. */
  const downloadEstimatePdf = async () => {
    const body = JSON.stringify({
      name: `${templateName} estimate`,
      template: props.templateCode ?? "HOME-2B",
      specLevel,
      subtitle: `${spaces.length} spaces · ${specLevel}`,
      items: lines.map((line) => ({
        name: line.catalogueName,
        quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
        unit: line.catalogueUnit,
        priceGhs: line.unitPrice,
      })),
      total: pricedTotal(lines),
      // the document prints the same configured loads, sizes and costs the screen shows
      specialLoads: instances.map((instance) => instance.load_key),
      specialLoadsDetail: result.specialLoadBreakdown.map((entry) => ({
        name: entry.name,
        sizing: entry.summary,
        status: entry.statusLabel,
        costGhs: loadCosts.get(entry.instanceId)?.total ?? null,
      })),
      specialLoadsSubtotal: loadCostTotal,
      specialLoadsPending: loadUnpricedTotal,
    });

    const save = async (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${(props.templateCode ?? "estimo").toLowerCase()}-estimate.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    };

    const direct = await fetch("/api/estimates/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (direct.ok) {
      await save(await direct.blob());
      return;
    }
    if (direct.status !== 401) return;

    const linkResponse = await fetch("/api/estimates/pdf/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (!linkResponse.ok) return;
    const signed = (await linkResponse.json()) as { url?: string };
    if (!signed.url) return;
    const linked = await fetch(signed.url);
    if (linked.ok) await save(await linked.blob());
  };

  /** Every line goes in, priced or not, so the estimate shows the full take-off. */
  /**
  /**
   * Saves the estimate as a project, the same file the simple screen keeps. A signed-in
   * account also gets a server copy; a guest keeps it in this browser. Either way the
   * basket stays in step: cleared for an account, kept on the device for a guest.
   */
  const addToEstimate = async () => {
    const groupId = `qty:${templateId}:${specLevel}`;
    const groupName = `${templateName} · ${specLevel}`;
    const lines_: BasketItem[] = lines.map((line) => ({
      materialId: line.catalogueId,
      name: line.catalogueName,
      category: "Quantity take-off",
      unit: line.catalogueUnit,
      quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
      priceGhs: line.unitPrice,
      brandName: line.brand,
      supplierName: "ESTIMO catalogue",
      verifiedAt: new Date().toISOString().slice(0, 10),
      groupId,
      groupName,
    }));

    const saved = await saveEstimateNow();
    if (!saved) return;

    if (props.signedIn) {
      writeBasket(readBasket().filter((item) => item.groupId !== groupId));
    } else if (lines_.length) {
      const rest = readBasket().filter(
        (item) => !(item.groupId === groupId && lines_.some((line) => line.materialId === item.materialId)),
      );
      writeBasket([...rest, ...lines_]);
    }
    setAdded(props.signedIn ? "Estimate saved to your account." : "Estimate saved on this device.");
  };

  /** Boards a load can leave from: the plan's own DB keys, main board first. */
  const boards = useMemo(() => {
    const keys = new Set<string>(["DB1"]);
    for (const route of props.spaceRoutes ?? []) if (route.db_key) keys.add(route.db_key);
    return Array.from(keys)
      .sort()
      .map((key) => ({ value: key, label: key === "DB1" ? "Main board (DB1)" : key }));
  }, [props.spaceRoutes]);

  const openInstance = instances.find((instance) => instance.id === openLoadId) ?? null;

  return (
    <div className="quantities">
      <section className="quantities-controls">
        <label className="quantities-field">
          <span>Project</span>
          <select value={projectType} onChange={(event) => pickProjectType(event.target.value)}>
            {props.projectTypes.map((type) => (
              <option key={type.key} value={type.key}>{type.label}</option>
            ))}
          </select>
        </label>

        <label className="quantities-field">
          <span>Template</span>
          <select value={templateId} onChange={(event) => pickTemplate(event.target.value)}>
            {templatesForType.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <div className="quantities-field">
          <span>Specification</span>
          <div className="quantities-specs" role="group" aria-label="Specification level">
            {SPECS.map((spec) => (
              <button
                key={spec.key}
                type="button"
                className={specLevel === spec.key ? "is-active" : ""}
                onClick={() => { setSpecLevel(spec.key); setOverrides([]); setAdded(""); }}
              >
                {spec.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="quantities-summary" aria-label="Engineering summary">
        <div><span>Floor area</span><strong>{result.totals.floor_area_m2} m²</strong></div>
        <div><span>Light points</span><strong>{result.totals.lighting_points}</strong></div>
        <div><span>Double sockets</span><strong>{result.totals.double_sockets}</strong></div>
        <div><span>Final circuits</span><strong>{result.totals.total_final_circuits}</strong></div>
        <div><span>Special loads</span><strong>{instances.length}</strong></div>
        <div><span>Board</span><strong>{result.totals.recommended_db_ways ? `${result.totals.recommended_db_ways} way` : "Engineered"}</strong></div>
        <div><span>Conduit</span><strong>{result.totals.total_containment_m} m</strong></div>
      </section>

      {result.warnings.length ? (
        <ul className="quantities-warnings">
          {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      ) : null}

      <section className="quantities-section">
          <div className="quantities-section-head is-inline">
          <h2>Spaces</h2>
          <button className="btn-outline btn-small" type="button" onClick={addSpace}>Add space</button>
        </div>
        <div className="quantities-scroll">
          <table className="quantities-table">
            <thead>
              <tr>
                <th>Space</th>
                <th>Room type</th>
                <th>L</th>
                <th>W</th>
                <th>H</th>
                <th>Qty</th>
                <th className="is-num">Area</th>
                <th>Points</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.spaces.map((space) => {
                const source = spaces.find((entry) => entry.id === space.space_id);
                if (!source) return null;
                return (
                  <tr key={space.space_id}>
                    <td>{space.space_name}</td>
                    <td>
                      <select
                        className="quantities-room"
                        value={source.room_type}
                        onChange={(event) => updateSpace(space.space_id, { room_type: event.target.value })}
                      >
                        {roomTypes.map((type) => (
                          <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <NumberCell
                        value={source.length_m}
                        min={1}
                        step={0.1}
                        onCommit={(next) => updateSpace(space.space_id, { length_m: next })}
                      />
                    </td>
                    <td>
                      <NumberCell
                        value={source.width_m}
                        min={1}
                        step={0.1}
                        onCommit={(next) => updateSpace(space.space_id, { width_m: next })}
                      />
                    </td>
                    <td>
                      <NumberCell
                        value={source.height_m}
                        min={2}
                        step={0.1}
                        onCommit={(next) => updateSpace(space.space_id, { height_m: next })}
                      />
                    </td>
                    <td>
                      <NumberCell
                        value={source.quantity ?? 1}
                        min={1}
                        step={1}
                        onCommit={(next) => updateSpace(space.space_id, { quantity: Math.max(1, Math.round(next)) })}
                      />
                    </td>
                    <td className="is-num">{Math.round(space.area_m2 * 10) / 10} m²</td>
                    <td className="is-muted">
                      {space.lighting_points}L · {space.double_sockets}S · {space.switch_positions}Sw
                      {space.data_points ? ` · ${space.data_points}D` : ""}
                    </td>
                    <td className="is-actions">
                      <button className="quantities-icon-btn" type="button" onClick={() => duplicateSpace(source)} aria-label={`Duplicate ${space.space_name}`}>+</button>
                      <button className="quantities-icon-btn is-danger" type="button" onClick={() => removeSpace(space.space_id)} aria-label={`Remove ${space.space_name}`}>×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="quantities-section">
        <div className="quantities-section-head">
          <h2>Points</h2>
        </div>
        <div className="quantities-overrides">
          {result.spaces.map((space) => (
            <div className="quantities-override" key={space.space_id}>
              <strong>{space.space_name}</strong>
              {POINT_FIELDS.map((field) => {
                const current = overrides.find(
                  (override) => override.space_id === space.space_id && override.point_type === field.type,
                );
                return (
                  <label key={field.type}>
                    <span>{field.label}</span>
                    <input
                      type="number"
                      min={0}
                      placeholder={String(autoFor(space.space_id, field.key))}
                      value={current ? current.value : ""}
                      onChange={(event) => setOverride(space.space_id, field.type, event.target.value)}
                    />
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="quantities-section">
        <div className="quantities-section-head is-inline">
          <h2>Special loads</h2>
          {instances.length ? (
            <span className="quantities-load-total">
              {loadCostTotal > 0
                ? `${money(loadCostTotal)} of materials`
                : loadUnpricedTotal
                  ? "Prices pending"
                  : money(0) + " added"}
              {loadCostTotal > 0 && loadUnpricedTotal ? ` · ${loadUnpricedTotal} unpriced` : ""}
            </span>
          ) : null}
        </div>
        <p className="quantities-load-help">
          Choose the loads this job has. Each one opens its own form, and nothing joins the
          total until the form is filled in.
        </p>
        {acPointTotal > 0 && !instances.some((instance) => instance.load_key === "air_conditioner") ? (
          <p className="quantities-load-hint">
            {acPointTotal} air conditioner{acPointTotal === 1 ? "" : "s"} counted in the Points table.
            Add the Air conditioner load to price {acPointTotal === 1 ? "it" : "them"}.
          </p>
        ) : null}
        <div className="quantities-loads">
          {availableLoads.map((load) => {
            const instance = instances.find((entry) => entry.load_key === load.load_key);
            const status = instance ? configurationStatus(instance) : null;
            return (
              <button
                key={load.load_key}
                type="button"
                className={instance ? "quantities-load is-active" : "quantities-load"}
                aria-pressed={Boolean(instance)}
                onClick={() => {
                  if (instance) {
                    setOpenLoadId(instance.id);
                    return;
                  }
                  const [created] = seedSpecialLoads([load.load_key], spaces, props.spaceRoutes ?? [], templateId);
                  // an AC load enters at the count already on the plan, so the first price
                  // it shows is for every air conditioner, not for one of them
                  const seeded =
                    created.load_key === "air_conditioner" && acPointTotal > 0
                      ? { ...created, quantity: acPointTotal }
                      : created;
                  setInstances((current) => [...current, seeded]);
                  setOpenLoadId(seeded.id);
                  setAdded("");
                }}
              >
                <span>{specialLoadDefinition(load.load_key).name}</span>
                <small className={status ? `is-${status.toLowerCase().replace(/_/g, "-")}` : undefined}>
                  {status ? STATUS_LABEL[status] : load.space_context.replace(/_/g, " ")}
                </small>
              </button>
            );
          })}
        </div>

        {instances.length ? (
          <ul className="quantities-load-cards">
            {instances.map((instance) => {
              const status = configurationStatus(instance);
              const cost = loadCosts.get(instance.id);
              const breakdown = result.specialLoadBreakdown.find((entry) => entry.instanceId === instance.id);
              const name = specialLoadDefinition(instance.load_key).name;
              return (
                <li key={instance.id} className={`quantities-load-card is-${status.toLowerCase().replace(/_/g, "-")}`}>
                  <button type="button" className="quantities-load-card-main" onClick={() => setOpenLoadId(instance.id)}>
                    <strong>{name}</strong>
                    <span className="quantities-load-card-summary">
                      {breakdown ? breakdown.summary : specialLoadSummary(instance)}
                    </span>
                  </button>
                  <span className="quantities-load-card-status">{STATUS_LABEL[status]}</span>
                  <span className="quantities-load-card-cost">
                    {status === "NOT_CONFIGURED" ? "—" : loadCostLabel(cost)}
                    {cost && cost.unpriced ? <small>{cost.unpriced} unpriced</small> : null}
                  </span>
                  <button
                    type="button"
                    className="quantities-icon-btn is-danger"
                    aria-label={`Remove ${name}`}
                    onClick={() => removeLoad(instance.id)}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {instances.length ? (
          <p className="quantities-load-note">
            Each card is the materials that load adds, priced exactly as the bill prices them,
            so the cards and the Materials table always agree.
          </p>
        ) : null}

        {result.specialLoadTotals.unconfigured ? (
          <p className="quantities-load-warning">
            {result.specialLoadTotals.unconfigured} selected load
            {result.specialLoadTotals.unconfigured === 1 ? " is" : "s are"} not configured yet, so
            {result.specialLoadTotals.unconfigured === 1 ? " it is" : " they are"} not in the total.
          </p>
        ) : null}
      </section>

      <section className="quantities-section">
        <div className="quantities-section-head">
          <h2>Materials</h2>
        </div>
        <div className="quantities-scroll">
          <table className="quantities-table">
            <thead>
              <tr>
                <th>Material</th>
                <th className="is-num">Quantity</th>
                <th className="is-num">Engineering</th>
                <th className="is-num">Unit price</th>
                <th className="is-num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const measured = line.catalogueUnit === "length" || line.catalogueUnit === "m";
                const orderUnit = line.catalogueUnit === "length" ? "lengths" : line.catalogueUnit;
                return (
                  <tr key={line.catalogueId}>
                    <td>
                      <div className="quantities-material">
                        <Link href={`/catalogue/${line.catalogueId}`}>{line.catalogueName}</Link>
                        <span className={`quantities-confidence is-${line.confidence}`}>{line.confidence}</span>
                        {line.origins.length ? (
                          <span className="quantities-material-origin">
                            {line.mixed ? "incl. " : "from "}
                            {line.origins.join(", ")}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="is-num">
                      {line.purchaseQuantity}
                      <span className="quantities-unit">{unitLabel(line.catalogueUnit)}</span>
                    </td>
                    <td className="is-num is-muted">
                      {measured ? `${line.engineeringQuantity} m` : "—"}
                    </td>
                    <td className="is-num">{line.unitPrice === null ? "Pending" : money(line.unitPrice)}</td>
                    <td className="is-num">{line.amount === null ? "—" : money(line.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="quantities-total">
          <div>
            <span>{pricedCountValue} of {lines.length} materials priced</span>
            <strong>{money(total)}</strong>
          </div>
          <button className="btn-outline" type="button" onClick={() => void downloadEstimatePdf()} disabled={!lines.length}>
            Download PDF
          </button>
          <button
            className="btn-amber"
            type="button"
            onClick={addToEstimate}
            disabled={!lines.length || added.startsWith("Estimate saved")}
          >
            {added.startsWith("Estimate saved") ? "Saved" : "Save estimate"}
          </button>
        </div>
        {added ? (
          <p className="quantities-added">
            {added} <Link href="/projects">View saved projects</Link>
          </p>
        ) : null}
      </section>

      {openInstance ? (
        <SpecialLoadConfigurator
          instance={openInstance}
          boards={boards}
          spaces={spaces.map((space) => ({ value: space.id, label: space.space_name }))}
          routeForSpace={(spaceId) => autoRouteForSpace(props.spaceRoutes ?? [], templateId, spaceId)}
          cost={loadCosts.get(openInstance.id) ?? null}
          lockedQuantity={openInstance.load_key === "air_conditioner" ? acPointTotal : undefined}
          onApply={applyLoad}
          onRemove={() => removeLoad(openInstance.id)}
          onClose={() => setOpenLoadId(null)}
        />
      ) : null}
    </div>
  );
}

