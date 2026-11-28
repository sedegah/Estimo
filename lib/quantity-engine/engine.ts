/**
 * ESTIMO Quantity Estimating Engine V1 — calculation core.
 *
 * Follows the handoff contract: geometry → auto point recommendations → overrides →
 * circuit grouping → DB selection → routes → conductors/containment → assemblies →
 * waste → pack rounding. Pricing happens outside this module.
 *
 * Values come from the rule data in lib/data/quantity-engine, never from this file,
 * apart from the commercial DB sizes listed below.
 */

import type {
  AssemblyItemRow,
  AssemblyRow,
  CircuitRuleRow,
  CircuitSummary,
  DbSelection,
  EngineResult,
  GlobalParameterRow,
  MaterialQuantity,
  PointOverride,
  PointType,
  ProjectTotals,
  RoomRuleRow,
  SpaceEstimate,
  SpaceInput,
  SpecLevel,
  TemplateSpaceRow,
  StructureTemplateRow,
} from "./types";

export const RULE_SET = "ESTIMO-GH-QTY-v1.2";

/** Commercial distribution board ways; a requirement beyond these is engineered. */
export const DB_SIZES = [4, 6, 8, 12, 18, 24];

/** Works out kit round-ups: conduit by the 3 m length, cable by the 100 m roll. */
export const PACK_SIZES: Record<string, number> = {
  "20mm_conduit": 3,
  "2.5mm2_phase_conductor": 100,
  "2.5mm2_neutral_conductor": 100,
  "cpc_conductor": 100,
  "lighting_conductors": 100,
  "main_earthing_conductor": 100,
};

const MATERIAL_LABELS: Record<string, string> = {
  double_13a_socket: "Double 13A socket outlet",
  socket_mounting_box: "Socket mounting box",
  light_fitting_allowance: "Light fitting (allowance)",
  ceiling_fan: "Ceiling fan (allowance)",
  fan_regulator: "Fan speed regulator",
  fan_hook: "Ceiling fan hook and cover",
  data_rj45_outlet: "Cat6 RJ45 data outlet",
  server_room_provision: "Server room power & rack provision (allowance)",
  ceiling_junction_box: "Ceiling junction box",
  switch_mechanism: "Switch mechanism",
  switch_mounting_box: "Switch mounting box",
  "2.5mm2_phase_conductor": "2.5 mm² phase conductor",
  "2.5mm2_neutral_conductor": "2.5 mm² neutral conductor",
  cpc_conductor: "Circuit protective conductor",
  lighting_conductors: "Lighting circuit conductors",
  "20mm_conduit": "20 mm PVC conduit",
  earth_electrode: "Earth electrode",
  earth_clamp: "Earth clamp",
  earth_inspection_chamber: "Earth inspection chamber",
  main_earthing_conductor: "Main earthing conductor",
};

const ceilDiv = (value: number, divisor: number) => (divisor > 0 ? Math.ceil(value / divisor) : 0);
const round1 = (value: number) => Math.round(value * 10) / 10;

export function parametersFromRows(rows: GlobalParameterRow[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export function ruleKey(roomType: string, spec: SpecLevel) {
  return `${roomType}:${spec}`;
}

export function rulesByKey(rules: RoomRuleRow[]): Map<string, RoomRuleRow> {
  return new Map(rules.map((rule) => [ruleKey(rule.room_type, rule.spec_level), rule]));
}

/** Templates for a project type, with their spaces resolved and editable. */
export function templateSpaces(
  template: StructureTemplateRow,
  spaces: TemplateSpaceRow[],
): SpaceInput[] {
  return spaces
    .filter((space) => space.template_id === template.template_id)
    .sort((a, b) => a.space_no - b.space_no)
    .map((space) => ({
      id: `${template.template_id}-${space.space_no}`,
      space_name: space.space_name,
      room_type: space.room_type,
      length_m: space.length_m,
      width_m: space.width_m,
      height_m: space.height_m,
      quantity: space.quantity || 1,
      workstations: space.workstations || 0,
      checkout_counters: space.checkout_counters || 0,
      machine_count: space.machine_count || 0,
    }));
}

function overridden(overrides: PointOverride[], spaceId: string, type: PointType): number | null {
  const hit = overrides.find(
    (entry) => entry.space_id === spaceId && entry.point_type === type && entry.source === "user_override",
  );
  return hit ? hit.value : null;
}

export function estimateSpace(
  space: SpaceInput,
  rule: RoomRuleRow,
  params: Record<string, number>,
  overrides: PointOverride[] = [],
): SpaceEstimate {
  const quantity = Math.max(1, space.quantity ?? 1);
  const area = space.length_m * space.width_m;
  const perimeter = 2 * (space.length_m + space.width_m);

  let lighting = rule.minimum_lighting_points;
  if (space.room_type === "corridor") {
    lighting = Math.max(1, Math.ceil(space.length_m / 4));
  } else if (rule.lighting_area_per_point_m2) {
    lighting = Math.max(rule.minimum_lighting_points, ceilDiv(area, rule.lighting_area_per_point_m2));
  }

  let sockets = rule.minimum_double_sockets;
  if (space.room_type === "open_office") {
    const workstations = Math.max(0, space.workstations ?? 0);
    sockets = workstations + Math.ceil(workstations / 4);
  } else if (rule.socket_spacing_perimeter_m) {
    sockets = Math.max(rule.minimum_double_sockets, ceilDiv(perimeter, rule.socket_spacing_perimeter_m));
  }
  if (space.room_type === "shop_floor") {
    sockets += Math.max(0, space.checkout_counters ?? 0) * 2;
  }

  const autoFans = rule.fan_points_default;
  const autoAc = rule.ac_default === "yes" ? 1 : 0;
  const autoTv = rule.tv_points_default;
  const autoData =
    space.room_type === "open_office" ? Math.max(0, space.workstations ?? 0) : rule.data_points_default;
  const autoSwitches = space.room_type === "corridor" && space.length_m > 4 ? 2 : 1;

  const applied: PointType[] = [];
  const pick = (type: PointType, auto: number) => {
    const override = overridden(overrides, space.id, type);
    if (override !== null) applied.push(type);
    return override ?? auto;
  };

  const lights = pick("lighting", lighting);
  const socketsFinal = pick("double_sockets", sockets);
  const fans = pick("fans", autoFans);
  const ac = pick("ac", autoAc);
  const tv = pick("tv", autoTv);
  const data = pick("data", autoData);
  const switches = pick("switches", autoSwitches);

  const lightingRoute =
    lights > 0 || switches > 0
      ? (params.lighting_route_perimeter_factor ?? 0.35) * perimeter +
        (params.light_branch_allowance_m ?? 1) * lights +
        switches * Math.max(0, space.height_m - (params.switch_height_m ?? 1.2))
      : 0;

  const socketRoute =
    socketsFinal > 0
      ? (params.socket_route_perimeter_factor ?? 0.5) * perimeter +
        socketsFinal * Math.max(0, space.height_m - (params.socket_height_m ?? 0.3))
      : 0;

  return {
    space_id: space.id,
    space_name: space.space_name,
    room_type: space.room_type,
    area_m2: area * quantity,
    perimeter_m: perimeter,
    lighting_points: lights * quantity,
    double_sockets: socketsFinal * quantity,
    fan_points: fans * quantity,
    ac_points: ac * quantity,
    tv_points: tv * quantity,
    data_points: data * quantity,
    switch_positions: switches * quantity,
    lighting_containment_raw_m: lightingRoute * quantity,
    socket_containment_raw_m: socketRoute * quantity,
    machine_count: Math.max(0, space.machine_count ?? 0) * quantity,
    overridden: applied,
  };
}

function chooseDb(finalCircuits: number, sparePct: number): DbSelection {
  const designWays = Math.ceil(finalCircuits * (1 + sparePct / 100));
  const recommendedWays = DB_SIZES.find((size) => designWays <= size) ?? null;
  return {
    finalCircuits,
    designWays,
    recommendedWays,
    engineered: recommendedWays === null,
  };
}

export interface CalculateArgs {
  spaces: SpaceInput[];
  specLevel: SpecLevel;
  projectType: string;
  templateId?: string | null;
  overrides?: PointOverride[];
  specialLoads?: string[];
  dbLocation?: Record<string, unknown> | null;
  multiDbRules?: Record<string, unknown>[];
  specialLoadRows?: Record<string, unknown>[];
  loadRouteM?: number;
  params: Record<string, number>;
  rules: Map<string, RoomRuleRow>;
  circuitRules?: CircuitRuleRow[];
  assemblies?: AssemblyRow[];
  assemblyItems?: AssemblyItemRow[];
}

export function calculateProject(args: CalculateArgs): EngineResult {
  const { spaces, specLevel, params, rules, overrides = [], assemblies = [], assemblyItems = [], specialLoads = [] } = args;
  const warnings: string[] = [];
  const circuitRules = args.circuitRules ?? [];

  const lightingLimit =
    circuitRules.find((rule) => rule.circuit_type === "lighting")?.limit_value ??
    params.lighting_points_per_circuit ??
    10;
  const socketLimit =
    circuitRules.find((rule) => rule.circuit_type === "general_sockets")?.limit_value ??
    params.residential_double_sockets_per_circuit ??
    6;

  const calculated: SpaceEstimate[] = [];
  for (const space of spaces) {
    const rule = rules.get(ruleKey(space.room_type, specLevel));
    if (!rule) {
      warnings.push(`No ${specLevel} rule for “${space.room_type}” (${space.space_name}); space skipped.`);
      continue;
    }
    calculated.push(estimateSpace(space, rule, params, overrides));
  }

  const sum = (key: keyof SpaceEstimate) =>
    calculated.reduce((total, space) => total + Number(space[key] ?? 0), 0);

  const lightingPoints = sum("lighting_points");
  const socketPoints = sum("double_sockets");
  const acPoints = sum("ac_points");
  const machineCount = sum("machine_count");

  const lightingCircuits = ceilDiv(lightingPoints, lightingLimit);
  const socketCircuits = ceilDiv(socketPoints, socketLimit);
  const acCircuits = acPoints;
  const machineCircuits = machineCount;
  const dedicatedCircuits = specialLoads.length;
  const finalCircuits = lightingCircuits + socketCircuits + acCircuits + machineCircuits + dedicatedCircuits;
  const db = chooseDb(finalCircuits, params.db_spare_capacity_pct ?? 25);

  const lightingRaw = sum("lighting_containment_raw_m");
  const socketRaw = sum("socket_containment_raw_m");
  const containmentWaste = 1 + (params.containment_waste_pct ?? 10) / 100;
  const lightingContainment = round1(lightingRaw * containmentWaste);
  const socketContainment = round1(socketRaw * containmentWaste);
  const totalContainment = round1(lightingContainment + socketContainment);

  const cableWaste = 1 + (params.cable_waste_pct ?? 7.5) / 100;
  const lightingConductor = round1(lightingRaw * (params.lighting_conductor_factor ?? 2.7) * cableWaste);
  const socketConductor = round1(socketRaw * 3 * cableWaste);

  const totals: ProjectTotals = {
    floor_area_m2: round1(sum("area_m2")),
    lighting_points: lightingPoints,
    double_sockets: socketPoints,
    fan_points: sum("fan_points"),
    ac_points: acPoints,
    tv_points: sum("tv_points"),
    data_points: sum("data_points"),
    switch_positions: sum("switch_positions"),
    machine_count: machineCount,
    lighting_circuits: lightingCircuits,
    socket_circuits: socketCircuits,
    ac_circuits: acCircuits,
    machine_circuits: machineCircuits,
    dedicated_circuits: dedicatedCircuits,
    total_final_circuits: finalCircuits,
    recommended_db_ways: db.recommendedWays,
    db_design_ways: db.designWays,
    lighting_containment_m: lightingContainment,
    socket_containment_m: socketContainment,
    total_containment_m: totalContainment,
    conduit_lengths_3m: Math.ceil(totalContainment / (params.conduit_piece_length_m ?? 3)),
    lighting_conductor_est_m: lightingConductor,
    socket_conductor_est_m: socketConductor,
    conduit_couplers_est: Math.ceil(totalContainment * (params.coupler_per_conduit_m ?? 0.3)),
    conduit_bends_est: Math.ceil(totalContainment * (params.bend_per_conduit_m ?? 1 / 6)),
    drawboxes_est: Math.ceil(totalContainment * (params.drawbox_per_conduit_m ?? 1 / 9)),
  };

  const circuits = ([
    { type: "lighting", points: lightingPoints, limit: lightingLimit, circuits: lightingCircuits, cableFamily: "1.5 mm²" },
    { type: "general_sockets", points: socketPoints, limit: socketLimit, circuits: socketCircuits, cableFamily: "2.5 mm²" },
    { type: "ac", points: acPoints, limit: 1, circuits: acCircuits, cableFamily: "load based" },
    { type: "machine", points: machineCount, limit: 1, circuits: machineCircuits, cableFamily: "load based" },
    { type: "dedicated", points: dedicatedCircuits, limit: 1, circuits: dedicatedCircuits, cableFamily: "load based" },
  ] as CircuitSummary[]).filter((circuit) => circuit.points > 0 || circuit.type === "lighting" || circuit.type === "general_sockets");

  if (db.engineered) {
    warnings.push(
      `The plan needs ${db.designWays} ways, more than the largest stocked board (${DB_SIZES[DB_SIZES.length - 1]}); split the installation or specify an engineered board.`,
    );
  }
  if (dedicatedCircuits > 0) {
    warnings.push(
      `${dedicatedCircuits} special load${dedicatedCircuits === 1 ? " needs" : "s need"} load-based cable and protection sizing; quantities cover the circuit and containment only.`,
    );
  }
  if (machineCount > 0) {
    warnings.push(
      "Machine circuits need the motor kW and phase before cable and protection can be sized; quantities exclude that cable.",
    );
  }

  const materialQuantities = aggregateMaterials({
    totals,
    calculated,
    assemblies,
    assemblyItems,
    specialLoadRows: args.specialLoadRows,
    selectedLoads: specialLoads,
    loadRouteM: args.loadRouteM ?? 8,
  });

  const location = args.dbLocation ?? null;
  const multiDb = multiDbAdvice({
    projectType: args.projectType,
    totals,
    rules: args.multiDbRules ?? [],
    spaceCount: calculated.length,
  });
  if (multiDb.recommended) {
    warnings.push(
      `${multiDb.triggers.length} trigger${multiDb.triggers.length === 1 ? "" : "s"} for a sub-DB: ${multiDb.triggers.join(", ")}. V1.2 recommends ${multiDb.suggestedCount} sub-DB${multiDb.suggestedCount === 1 ? "" : "s"}; feeder sizing is load-designed.`,
    );
  }

  return {
    ruleSet: args.templateId ? RULE_SET : RULE_SET,
    templateId: args.templateId ?? null,
    projectType: args.projectType,
    specLevel,
    spaces: calculated,
    circuits,
    db,
    totals,
    materialQuantities,
    specialLoads,
    dbLocation: location
      ? {
          dbKey: String(location.db_key),
          spaceName: String(location.default_space_name),
          locationLabel: String(location.location_label),
          routeMethod: String(location.route_method),
        }
      : null,
    multiDb,
    warnings,
  };
}

function aggregateMaterials(args: {
  totals: ProjectTotals;
  calculated: SpaceEstimate[];
  assemblies: AssemblyRow[];
  assemblyItems: AssemblyItemRow[];
  specialLoadRows?: Record<string, unknown>[];
  selectedLoads?: string[];
  loadRouteM?: number;
}): MaterialQuantity[] {
  const { totals, assemblies, assemblyItems } = args;
  const CORE_ASSEMBLIES = new Set([
    "double_socket_point",
    "lighting_point",
    "switch_point",
    "earthing_basic_residential",
  ]);
  const loadCounts = new Map<string, number>();
  for (const load of args.specialLoadRows ?? []) {
    if (!args.selectedLoads?.includes(String(load.load_key))) continue;
    // the EV charger is future-ready: it carries a circuit but no priced materials yet
    if (String(load.load_key) === "ev_charger") continue;
    const key = String(load.assembly_key ?? "");
    if (key) loadCounts.set(key, (loadCounts.get(key) ?? 0) + 1);
  }
  const known = new Set([
    ...assemblies.filter((assembly) => CORE_ASSEMBLIES.has(assembly.assembly_key)).map((assembly) => assembly.assembly_key),
    ...Array.from(loadCounts.keys()),
  ]);
  const rows = new Map<string, MaterialQuantity>();
  const engineered = new Map<string, number>();

  // fixed items, driven by the point counts
  const pointCounts: Record<string, number> = {
    double_socket_point: totals.double_sockets,
    lighting_point: totals.lighting_points,
    switch_point: totals.switch_positions,
    ac_point: totals.ac_points,
  };

  // route-driven quantities, before assemblies see them
  engineered.set("2.5mm2_phase_conductor", totals.socket_conductor_est_m);
  engineered.set("2.5mm2_neutral_conductor", totals.socket_conductor_est_m);
  engineered.set("cpc_conductor", totals.socket_conductor_est_m);
  engineered.set("lighting_conductors", totals.lighting_conductor_est_m);
  engineered.set("20mm_conduit", totals.total_containment_m);
  engineered.set("main_earthing_conductor", totals.switch_positions > 0 ? 6 : 0);

  for (const item of assemblyItems) {
    if (!known.has(item.assembly_key)) continue;
    const count = pointCounts[item.assembly_key] ?? loadCounts.get(item.assembly_key) ?? 0;
    const fixed = item.quantity_mode === "fixed" ? (item.quantity ?? 1) * (pointCounts[item.assembly_key] ?? loadCounts.get(item.assembly_key) ?? 0) : 0;
    const routeDriven = engineered.get(item.material_key) ?? 0;
    let value = item.quantity_mode === "fixed" ? fixed : routeDriven;
    if (loadCounts.has(item.assembly_key) && item.quantity_mode !== "fixed") {
      // a load route: the DB-to-space distance from the V1.2 route table
      const route = args.loadRouteM ?? 8;
      value = route * (loadCounts.get(item.assembly_key) ?? 0);
    } else if (item.quantity_mode === "route_driven") {
      value = routeDriven;
    }
    if (!value) continue;
    void count;
    const existing = rows.get(item.material_key);
    if (existing) {
      existing.engineering_quantity = round1(existing.engineering_quantity + value);
    } else {
      rows.set(item.material_key, {
        material_key: item.material_key,
        name: MATERIAL_LABELS[item.material_key] ?? item.material_key,
        unit: item.unit,
        engineering_quantity: round1(value),
        purchase_quantity: 0,
        pack_size: null,
        trace: [],
        confidence: item.quantity_mode === "fixed" ? "high" : "estimated",
      });
    }
  }

  // TV, data and fan points: no assembly in the handoff, so they are costed here from
  // the same material family as the point they belong to.
  const extraPoints: { key: string; count: number; fixed: string[]; route: string[] }[] = [
    { key: "tv_point", count: totals.tv_points, fixed: ["double_13a_socket", "socket_mounting_box"], route: ["2.5mm2_phase_conductor", "2.5mm2_neutral_conductor", "cpc_conductor", "20mm_conduit"] },
    { key: "data_point", count: totals.data_points, fixed: ["data_rj45_outlet", "socket_mounting_box"], route: ["data_cable"] },
    // a fan point is the fan, its speed regulator and its hook, plus the switch and route
    { key: "fan_point", count: totals.fan_points, fixed: ["ceiling_fan", "fan_regulator", "fan_hook", "switch_mechanism", "switch_mounting_box"], route: ["lighting_conductors", "20mm_conduit"] },
  ];
  const pointRouteM = args.loadRouteM ?? 8;
  for (const group of extraPoints) {
    if (!group.count) continue;
    for (const key of group.fixed) {
      const existing = rows.get(key);
      if (existing) existing.engineering_quantity = round1(existing.engineering_quantity + group.count);
      else
        rows.set(key, {
          material_key: key,
          name: MATERIAL_LABELS[key] ?? key,
          unit: "each",
          engineering_quantity: group.count,
          purchase_quantity: 0,
          pack_size: null,
          trace: [`${group.count} ${group.key.replace("_", " ")} point${group.count === 1 ? "" : "s"}`],
          confidence: "medium",
        });
    }
    for (const key of group.route) {
      const amount = round1(pointRouteM * group.count);
      const existing = rows.get(key);
      if (existing) existing.engineering_quantity = round1(existing.engineering_quantity + amount);
      else
        rows.set(key, {
          material_key: key,
          name: MATERIAL_LABELS[key] ?? key,
          unit: key === "20mm_conduit" ? "m" : "m",
          engineering_quantity: amount,
          purchase_quantity: 0,
          pack_size: null,
          trace: [`${pointRouteM} m route per ${group.key.replace("_", " ")}`],
          confidence: "estimated",
        });
    }
  }

  // Server room dedicated power & rack provision allowance (GHS 300 per server room).
  const serverRoomCount = args.calculated.filter((space) => space.room_type === "server_room").length;
  if (serverRoomCount > 0) {
    rows.set("server_room_provision", {
      material_key: "server_room_provision",
      name: MATERIAL_LABELS.server_room_provision,
      unit: "each",
      engineering_quantity: serverRoomCount,
      purchase_quantity: serverRoomCount,
      pack_size: null,
      trace: [`${serverRoomCount} server room${serverRoomCount === 1 ? "" : "s"}`],
      confidence: "estimated",
    });
  }

  // accessory allowances and pack rounding
  for (const row of rows.values()) {
    const pack = PACK_SIZES[row.material_key] ?? null;
    row.pack_size = pack;
    row.purchase_quantity = pack ? Math.ceil(row.engineering_quantity / pack) * pack : Math.ceil(row.engineering_quantity);
    row.trace = [
      row.confidence === "high"
        ? `Fixed quantity from the point count`
        : `Route-driven: ${round1(row.engineering_quantity / (1 + 0))} m before pack rounding`,
      pack ? `Supplied in ${pack} ${row.unit === "each" ? "packs" : row.unit}, rounded up` : "No pack rounding",
    ];
  }

  // couplers, bends and draw boxes are counted, not measured
  const accessory = (key: string, name: string, value: number, basis: string) => {
    if (!value) return;
    rows.set(key, {
      material_key: key,
      name,
      unit: "each",
      engineering_quantity: value,
      purchase_quantity: value,
      pack_size: null,
      trace: [basis],
      confidence: "estimated",
    });
  };
  accessory("conduit_coupler", "Conduit coupler", totals.conduit_couplers_est, "Provisional rate per metre of conduit");
  accessory("conduit_bend", "Conduit bend", totals.conduit_bends_est, "Provisional rate per metre of conduit");
  accessory("draw_box", "Draw box", totals.drawboxes_est, "Provisional rate per metre of conduit");

  return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function templateOf(
  templates: StructureTemplateRow[],
  templateId: string,
): StructureTemplateRow | undefined {
  return templates.find((template) => template.template_id === templateId);
}


/** V1.2 thresholds: does this project want a sub-DB, and why. Advisory only. */
function multiDbAdvice(args: {
  projectType: string;
  totals: ProjectTotals;
  rules: Record<string, unknown>[];
  spaceCount: number;
}): { recommended: boolean; suggestedCount: number; triggers: string[] } {
  const context =
    args.projectType === "office"
      ? "office"
      : args.projectType === "shop_retail"
        ? "shop"
        : args.projectType === "workshop_small_factory"
          ? "workshop"
          : args.projectType === "container_kiosk"
            ? "container"
            : "residential";

  const aliases: Record<string, string[]> = {
    residential: ["residential"],
    office: ["office"],
    shop: ["shop", "retail"],
    workshop: ["workshop"],
    container: ["container", "kiosk"],
  };
  const row = args.rules.find((rule) =>
    aliases[context].some((word) => String(rule.project_context ?? "").toLowerCase().includes(word)),
  );
  if (!row) return { recommended: false, suggestedCount: 0, triggers: [] };

  const maxCircuits = Number(row.preferred_max_final_circuits ?? 12);
  const areaTrigger = Number(row.zone_area_trigger_m2 ?? 180);
  const maxWays = Number(row.preferred_max_db_ways ?? 18);

  const triggers: string[] = [];
  if (args.totals.total_final_circuits > maxCircuits) {
    triggers.push(`${args.totals.total_final_circuits} final circuits exceed ${maxCircuits}`);
  }
  if (args.totals.floor_area_m2 > areaTrigger) {
    triggers.push(`${args.totals.floor_area_m2} m² exceeds ${areaTrigger} m²`);
  }
  if (args.totals.db_design_ways > maxWays) {
    triggers.push(`${args.totals.db_design_ways} board ways exceed ${maxWays}`);
  }
  if (args.totals.machine_count >= Number(row.machine_cluster_trigger ?? 6)) {
    triggers.push(`${args.totals.machine_count} machines cluster`);
  }

  return {
    recommended: triggers.length > 0,
    suggestedCount: triggers.length ? 1 : 0,
    triggers,
  };
}
