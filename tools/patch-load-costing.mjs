import fs from "node:fs";

// 1) catalogue: give the V1.2 load assemblies real materials
const catPath = "lib/quantity-engine/catalogue.ts";
let cat = fs.readFileSync(catPath, "utf8").replace(/\r\n/g, "\n");
const additions = `  "25a_sp_mcb": { id: "mat-pro-mcb-sp-40a" },
  "20a_sp_mcb": { id: "mat-pro-mcb-sp-40a" },
  "16a_sp_mcb": { id: "mat-pro-mcb-sp-40a" },
  "40a_sp_mcb": { id: "mat-pro-mcb-sp-40a" },
  "13a_fcu": { id: "mat-sws-fcu-13a" },
  "ac_isolator": { id: "mat-iso-dp-32a" },
  "equipment_isolator": { id: "mat-iso-dp-32a" },
  "gate_motor_isolator": { id: "mat-iso-dp-32a" },
  "pump_isolator": { id: "mat-iso-dp-32a" },
  "machine_isolator": { id: "mat-iso-dp-63a" },
  "machine_protective_device": { id: "mat-pro-mcb-sp-63a" },
  "20a_dp_water_heater_switch": { id: "mat-iso-dp-32a" },
  "45a_cooker_control_unit": { id: "mat-sws-cook-45a-out" },
  "cooker_outlet_plate": { id: "mat-sws-cook-45a-out" },
  "ev_charger_rcbo": { id: "mat-iso-dp-63a" },
  "2.5mm2_power_cable": { id: "mat-cab-twe-2c-e-2p5" },
  "4mm2_phase_conductor": { id: "mat-cab-sc-cu-4" },
  "4mm2_neutral_conductor": { id: "mat-cab-sc-cu-4" },
  "6mm2_phase_conductor": { id: "mat-cab-sc-cu-6" },
  "6mm2_neutral_conductor": { id: "mat-cab-sc-cu-6" },
  "1.5mm2_phase_conductor": { id: "mat-cab-twe-2c-e-1p5" },
  "1.5mm2_neutral_conductor": { id: "mat-cab-twe-2c-e-1p5" },
  "25mm_conduit": { id: "mat-con-pvc-25", convert: "metres-to-lengths", unitLength: 3 },
  "external_containment": { id: "mat-con-pvc-25", convert: "metres-to-lengths", unitLength: 3 },
`;
if (!cat.includes('"25a_sp_mcb"')) {
  cat = cat.replace("const MATERIAL_CATALOGUE: Record<string, CatalogueLink> = {", "const MATERIAL_CATALOGUE: Record<string, CatalogueLink> = {\n" + additions);
}
fs.writeFileSync(catPath, cat);

// 2) engine: expand AC points and selected special loads into real materials
const enginePath = "lib/quantity-engine/engine.ts";
let engine = fs.readFileSync(enginePath, "utf8").replace(/\r\n/g, "\n");

engine = engine.replace(
  "  const CORE_ASSEMBLIES = new Set([",
  `  const CORE_ASSEMBLIES = new Set([
    "ac_point",`,
);
engine = engine.replace(
  "    const count = pointCounts[item.assembly_key] ?? 1;",
  "    const count = pointCounts[item.assembly_key] ?? loadCounts.get(item.assembly_key) ?? 0;",
);
engine = engine.replace(
  "    const fixed = item.quantity_mode === \"fixed\" ? (item.quantity ?? 1) * (pointCounts[item.assembly_key] ?? 1) : 0;",
  "    const fixed = item.quantity_mode === \"fixed\" ? (item.quantity ?? 1) * (pointCounts[item.assembly_key] ?? loadCounts.get(item.assembly_key) ?? 0) : 0;",
);
engine = engine.replace(
  "    const value = item.quantity_mode === \"fixed\" ? fixed : routeDriven;",
  `    let value = item.quantity_mode === "fixed" ? fixed : routeDriven;
    if (item.quantity_mode === "route_driven" && !routeDriven) {
      // a load route: the DB-to-space distance from the V1.2 route table
      const route = args.loadRouteM / 1;
      value = route * Number(item.route_multiplier ?? 1) * (loadCounts.get(item.assembly_key) ?? 0);
    }`,
);
engine = engine.replace(
  "  const pointCounts: Record<string, number> = {\n    double_socket_point: totals.double_sockets,\n    lighting_point: totals.lighting_points,\n    switch_point: totals.switch_positions,\n  };",
  `  const pointCounts: Record<string, number> = {
    double_socket_point: totals.double_sockets,
    lighting_point: totals.lighting_points,
    switch_point: totals.switch_positions,
    ac_point: totals.ac_points,
  };
  const loadCounts = new Map<string, number>();
  for (const load of args.specialLoadRows ?? []) {
    if (!args.selectedLoads?.includes(String(load.load_key))) continue;
    const key = String(load.assembly_key ?? "");
    if (key) loadCounts.set(key, (loadCounts.get(key) ?? 0) + 1);
  }`,
);
engine = engine.replace(
  "function aggregateMaterials(args: {\n  totals: ProjectTotals;\n  calculated: SpaceEstimate[];\n  assemblies: AssemblyRow[];\n  assemblyItems: AssemblyItemRow[];\n}): MaterialQuantity[] {",
  `function aggregateMaterials(args: {
  totals: ProjectTotals;
  calculated: SpaceEstimate[];
  assemblies: AssemblyRow[];
  assemblyItems: AssemblyItemRow[];
  specialLoadRows?: Record<string, unknown>[];
  selectedLoads?: string[];
  loadRouteM?: number;
}): MaterialQuantity[] {`,
);
engine = engine.replace(
  "  const materialQuantities = aggregateMaterials({\n    totals,\n    calculated,\n    assemblies,\n    assemblyItems,\n  });",
  `  const materialQuantities = aggregateMaterials({
    totals,
    calculated,
    assemblies,
    assemblyItems,
    specialLoadRows: args.specialLoadRows,
    selectedLoads: specialLoads,
    loadRouteM: args.loadRouteM ?? 8,
  });`,
);
engine = engine.replace(
  "  multiDbRules?: Record<string, unknown>[];",
  `  multiDbRules?: Record<string, unknown>[];
  specialLoadRows?: Record<string, unknown>[];
  loadRouteM?: number;`,
);
fs.writeFileSync(enginePath, engine);
console.log("engine: AC points and special loads expand into materials");
