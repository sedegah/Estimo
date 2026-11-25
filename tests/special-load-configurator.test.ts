/**
 * Special-load configurator tests.
 *
 * These follow the acceptance list in the developer handoff: a selected load must not
 * look priced when it is not, a configured load must move the quantities it drives, and
 * a manufacturer's figures must beat ESTIMO's provisional sizing.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  acSuppressionOverrides,
  applySpecialLoads,
  configurationStatus,
  missingRequirements,
  newSpecialLoadInstance,
  parseSpecialLoadInstances,
  sizeSpecialLoad,
  specialLoadMaterials,
  specialLoadSummary,
  specialLoadDefinition,
  syncAcQuantity,
  type SpecialLoadInstance,
} from "../lib/quantity-engine/special-loads.ts";
import { calculateProject, parametersFromRows, rulesByKey } from "../lib/quantity-engine/engine.ts";
import { priceQuantities, type PriceEntry } from "../lib/quantity-engine/catalogue.ts";
import { CATALOGUE_MATERIALS } from "../lib/data/catalogue.ts";
import type {
  AssemblyItemRow,
  AssemblyRow,
  CircuitRuleRow,
  EngineResult,
  GlobalParameterRow,
  RoomRuleRow,
  SpaceInput,
} from "../lib/quantity-engine/types.ts";

const DATA = path.join(import.meta.dirname, "..", "lib", "data", "quantity-engine");
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) as T;

const params = parametersFromRows(read<GlobalParameterRow[]>("global_parameters.json"));
const rules = rulesByKey(read<RoomRuleRow[]>("room_rules.json"));
const circuitRules = read<CircuitRuleRow[]>("circuit_rules.json");
const assemblies = read<AssemblyRow[]>("assemblies.json");
const assemblyItems = read<AssemblyItemRow[]>("assembly_items.json");

/** A plan with a kitchen and a bathroom, so the loads have somewhere to sit. */
const PLAN: SpaceInput[] = [
  { id: "T011-1", space_name: "Master Bedroom", room_type: "bedroom", length_m: 4, width_m: 3.5, height_m: 3, quantity: 1 },
  { id: "T011-2", space_name: "Kitchen", room_type: "kitchen", length_m: 3.6, width_m: 3, height_m: 3, quantity: 1 },
  { id: "T011-3", space_name: "Bathroom", room_type: "bathroom", length_m: 2.4, width_m: 2, height_m: 2.7, quantity: 1 },
];

function engine(): EngineResult {
  return calculateProject({
    spaces: PLAN,
    specLevel: "standard",
    projectType: "two_bedroom",
    templateId: "T011",
    params,
    rules,
    circuitRules,
    assemblies,
    assemblyItems,
  });
}

const prices: Record<string, PriceEntry> = Object.fromEntries(
  CATALOGUE_MATERIALS.map((material) => [
    material.id,
    { price: 10, brand: null, source: null, updatedAt: null },
  ]),
);

const catalogue = new Map(
  CATALOGUE_MATERIALS.map((material) => [material.id, { id: material.id, name: material.name, unit: material.unit }]),
);

const materialMap = (rows: { material_key: string }[]) => new Map(rows.map((row) => [row.material_key, row]));

function waterHeater(patch: Partial<SpecialLoadInstance> = {}): SpecialLoadInstance {
  return {
    ...newSpecialLoadInstance("water_heater", "wh-1"),
    rated_power_kw: 4.5,
    phase: "single",
    route_length_m: 18,
    route_source: "USER_OVERRIDE",
    local_isolator_required: true,
    target_space_id: "T011-3",
    ...patch,
  };
}

test("A. a selected but unconfigured load adds nothing and says so", () => {
  const empty = newSpecialLoadInstance("water_heater", "wh-empty");
  assert.equal(configurationStatus(empty), "NOT_CONFIGURED");
  assert.deepEqual(missingRequirements(empty), ["rated_power_kw"]);
  assert.equal(specialLoadMaterials(empty, 8).length, 0);
  assert.match(specialLoadSummary(empty), /rated power/i);

  const outcome = applySpecialLoads(engine(), [empty], { defaultRouteM: 8 });
  assert.equal(outcome.specialLoadTotals.unconfigured, 1);
  assert.equal(outcome.specialLoadTotals.configured, 0);
  assert.equal(outcome.specialLoadTotals.circuits, 0);
  assert.ok(outcome.warnings.some((warning) => /not configured/i.test(warning)));
  assert.ok(outcome.warnings.some((warning) => /configuration required/i.test(warning)));
  // the load must not appear in the quantities as a zero-cost row
  assert.equal(outcome.materialQuantities.length, engine().materialQuantities.length);
});

test("B. quantity moves the device and the route materials, and the total steps up", () => {
  const totals = [1, 2, 3].map((quantity) => {
    const outcome = applySpecialLoads(engine(), [waterHeater({ quantity })], { defaultRouteM: 8 });
    const lines = priceQuantities(outcome.materialQuantities, prices, catalogue);
    const rows = materialMap(outcome.materialQuantities);
    return {
      money: lines.reduce((sum, line) => sum + (line.amount ?? 0), 0),
      device: rows.get("mcb_sp_20")?.engineering_quantity ?? 0,
      phase: rows.get("special_phase_4")?.engineering_quantity ?? 0,
      conduit: rows.get("conduit_20")?.engineering_quantity ?? 0,
    };
  });

  assert.deepEqual(totals.map((entry) => entry.device), [1, 2, 3]);
  assert.ok(Math.abs(totals[1].phase - totals[0].phase * 2) <= 0.2, "cable run doubles with quantity");
  assert.ok(Math.abs(totals[2].phase - totals[0].phase * 3) <= 0.3, "cable run triples with quantity");
  assert.ok(totals[1].money > totals[0].money);
  assert.ok(totals[2].money > totals[1].money);
});

test("C. a longer route adds cable and containment but not devices", () => {
  const short = applySpecialLoads(engine(), [waterHeater({ route_length_m: 8 })], {});
  const long = applySpecialLoads(engine(), [waterHeater({ route_length_m: 20 })], {});
  const shortRows = materialMap(short.materialQuantities);
  const longRows = materialMap(long.materialQuantities);

  assert.ok((longRows.get("special_phase_4")?.engineering_quantity ?? 0) > (shortRows.get("special_phase_4")?.engineering_quantity ?? 0));
  assert.ok((longRows.get("conduit_20")?.engineering_quantity ?? 0) > (shortRows.get("conduit_20")?.engineering_quantity ?? 0));
  assert.equal(shortRows.get("mcb_sp_20")?.engineering_quantity, longRows.get("mcb_sp_20")?.engineering_quantity);

  const shortMoney = priceQuantities(short.materialQuantities, prices, catalogue).reduce((sum, line) => sum + (line.amount ?? 0), 0);
  const longMoney = priceQuantities(long.materialQuantities, prices, catalogue).reduce((sum, line) => sum + (line.amount ?? 0), 0);
  assert.ok(longMoney > shortMoney);
});

test("D. manufacturer figures beat ESTIMO's provisional sizing", () => {
  const provisional = sizeSpecialLoad(waterHeater());
  assert.equal(provisional.protectiveDeviceA, 20);
  assert.equal(provisional.cableSizeMm2, 4);

  const specified = waterHeater({
    manufacturer_cable_size_mm2: 6,
    manufacturer_breaker_rating_a: 32,
    manufacturer_rcd_requirement: "required",
    sizing_source: "MANUFACTURER",
  });
  const sizing = sizeSpecialLoad(specified);
  assert.equal(sizing.protectiveDeviceA, 32);
  assert.equal(sizing.cableSizeMm2, 6);
  assert.equal(sizing.rcdRequired, true);
  assert.equal(configurationStatus(specified), "VERIFIED");
  assert.ok(sizing.basis.some((line) => /manufacturer/i.test(line)));
  assert.ok(
    specialLoadMaterials(specified, 8).some((row) => row.material_key === "rccb_2p_30ma"),
    "an RCD the manufacturer asks for is part of the assembly",
  );
});

test("E. removing a load removes its circuit, route and materials", () => {
  const heater = waterHeater();
  const freezer = {
    ...newSpecialLoadInstance("freezer", "fz-1"),
    phase: "single" as const,
    rated_power_kw: 0.8,
    route_length_m: 6,
    route_source: "USER_OVERRIDE" as const,
  };

  const both = applySpecialLoads(engine(), [heater, freezer], {});
  const one = applySpecialLoads(engine(), [heater], {});

  assert.equal(both.specialLoadTotals.circuits, 2);
  assert.equal(one.specialLoadTotals.circuits, 1);

  const bothRows = materialMap(both.materialQuantities);
  const oneRows = materialMap(one.materialQuantities);
  const sockets = (key: string) => oneRows.get(key)?.engineering_quantity ?? 0;
  assert.equal(
    (bothRows.get("socket_13a_double")?.engineering_quantity ?? 0) - sockets("socket_13a_double"),
    1,
    "the freezer's outlet leaves with it",
  );
  assert.equal(both.specialLoadTotals.configured, 2);
});

test("F. an unpriced material is never treated as zero", () => {
  const outcome = applySpecialLoads(engine(), [waterHeater()], {});

  // an empty price list is the "no trusted price" case: the lines stay, the money does not
  const lines = priceQuantities(outcome.materialQuantities, {}, catalogue);
  const unpricedLoadLine = lines.find((line) => line.amount === null);
  assert.ok(unpricedLoadLine, "a line with no published price stays visible and unpriced");
  const subtotal = lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
  assert.equal(subtotal, 0, "no price means no money is invented");

  const priced = priceQuantities(outcome.materialQuantities, prices, catalogue);
  assert.ok(priced.every((line) => (line.unitPrice === null) === (line.amount === null)));
});

test("G. a typed route survives a change to the ESTIMO distance", () => {
  const typed = waterHeater({ route_length_m: 18, route_source: "USER_OVERRIDE" });
  assert.equal(configurationStatus(typed), "PROVISIONAL");

  const near = applySpecialLoads(engine(), [typed], { defaultRouteM: 6 });
  const far = applySpecialLoads(engine(), [typed], { defaultRouteM: 24 });
  const runOf = (outcome: ReturnType<typeof applySpecialLoads>) =>
    materialMap(outcome.materialQuantities).get("special_phase_4")?.engineering_quantity;

  assert.equal(runOf(near), runOf(far), "the typed 18 m is not overwritten");

  // resetting to ESTIMO drops the typed figure and takes the published distance again
  const auto = { ...typed, route_length_m: null, route_source: "AUTO" as const };
  const following = applySpecialLoads(engine(), [auto], { defaultRouteM: 24 });
  assert.ok(
    (materialMap(following.materialQuantities).get("special_phase_4")?.engineering_quantity ?? 0) > runOf(near)!,
    "the automatic route follows the distance ESTIMO publishes",
  );

  // an automatic route that has already been resolved to a space keeps that distance
  const resolved = { ...typed, route_length_m: 6, route_source: "AUTO" as const };
  const kept = applySpecialLoads(engine(), [resolved], { defaultRouteM: 24 });
  assert.ok((materialMap(kept.materialQuantities).get("special_phase_4")?.engineering_quantity ?? 0) < runOf(near)!);
});

test("H. the route starts from the board the load is served from", () => {
  const fromSubBoard = waterHeater({ serving_db_id: "DB2" });
  const rows = specialLoadMaterials(fromSubBoard, 8);
  const phase = rows.find((row) => row.material_key === "special_phase_4");
  assert.ok(phase, "the phase conductor is part of the circuit");
  assert.ok(phase.trace.some((line) => /DB2/.test(line)), "the basis names the serving board");
});

test("a load's own cost is measured by the metre, not by the drum", () => {
  const fridge: SpecialLoadInstance = {
    ...newSpecialLoadInstance("refrigerator", "fridge-1"),
    phase: "single",
    rated_power_kw: 0.5,
    route_length_m: 7.2,
    route_source: "USER_OVERRIDE",
  };
  const rows = specialLoadMaterials(fridge, 8);

  const lines = priceQuantities(rows, prices, catalogue);
  const cable = lines.find((line) => line.catalogueId === "mat-cab-sc-cu-1p5");
  assert.ok(cable, "the phase and neutral conductors are priced together");
  assert.ok(cable.quantity < 50, `a 7 m run is priced in metres, got ${cable?.quantity}`);
  assert.ok(
    Math.abs(cable.quantity - Math.ceil(cable.engineeringQuantity)) <= 1,
    "quantity is the measured length rounded up to a whole metre",
  );

  // the card and the bill are the same arithmetic, so the two cannot disagree
  const cardTotal = lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
  assert.ok(cardTotal > 0 && cardTotal < 1_000, `a fridge is materials money, got ${cardTotal}`);
});

test("the bill says which loads a shared material line belongs to", () => {
  const fridge: SpecialLoadInstance = {
    ...newSpecialLoadInstance("refrigerator", "origin-fridge"),
    phase: "single",
    rated_power_kw: 0.5,
    route_length_m: 7.2,
    route_source: "USER_OVERRIDE",
  };
  const ac: SpecialLoadInstance = {
    ...newSpecialLoadInstance("air_conditioner", "origin-ac"),
    capacity_hp: 1.5,
    phase: "single",
    route_length_m: 7.2,
    route_source: "USER_OVERRIDE",
  };

  const outcome = applySpecialLoads(engine(), [fridge, ac], {});
  const pair = priceQuantities(outcome.materialQuantities, prices, catalogue);
  const copper = pair.find((line) => line.catalogueId === "mat-cab-sc-cu-1p5");
  assert.ok(copper, "the shared 1.5 mm² line exists");
  assert.deepEqual([...copper.origins].sort(), ["Air conditioner", "Fridge"]);
  assert.equal(copper.mixed, false, "only the loads use this size, so it is theirs");
});

test("ACs counted in the Points table set the AC load's quantity", () => {
  const ac: SpecialLoadInstance = {
    ...newSpecialLoadInstance("air_conditioner", "ac-1"),
    capacity_hp: 1.5,
    phase: "single",
    route_length_m: 8,
    route_source: "USER_OVERRIDE",
    quantity: 1,
  };

  const synced = syncAcQuantity([ac], 4);
  assert.equal(synced[0].quantity, 4, "the plan's count wins over the form's number");
  assert.equal(ac.quantity, 1, "the original is untouched");

  const one = materialMap(specialLoadMaterials(ac, 8));
  const four = materialMap(specialLoadMaterials(synced[0], 8));
  assert.equal(one.get("mcb_sp_10")?.engineering_quantity, 1);
  assert.equal(four.get("mcb_sp_10")?.engineering_quantity, 4, "one device per air conditioner");
  const oneRun = one.get("special_phase_1p5")?.engineering_quantity ?? 0;
  const fourRun = four.get("special_phase_1p5")?.engineering_quantity ?? 0;
  assert.ok(Math.abs(fourRun - oneRun * 4) <= 0.4, "the cable run multiplies too");

  // four air conditioners buy four ways and four circuits
  assert.equal(applySpecialLoads(engine(), synced, {}).specialLoadTotals.circuits, 4);
});

test("the generic AC point is switched off when the configurator covers it", () => {
  const unconfigured = newSpecialLoadInstance("air_conditioner", "ac-raw");
  assert.deepEqual(acSuppressionOverrides(PLAN, [unconfigured]), [], "an unfinished AC leaves the plan alone");

  const configured: SpecialLoadInstance = {
    ...unconfigured,
    capacity_hp: 1.5,
    phase: "single",
    route_length_m: 8,
  };
  const overrides = acSuppressionOverrides(PLAN, [configured]);
  assert.equal(overrides.length, PLAN.length);
  assert.ok(overrides.every((entry) => entry.point_type === "ac" && entry.value === 0));
});

test("phase and neutral of one run are priced once, at their combined length", () => {
  const fridge: SpecialLoadInstance = {
    ...newSpecialLoadInstance("refrigerator", "fridge-run"),
    phase: "single",
    rated_power_kw: 0.5,
    route_length_m: 7.2,
    route_source: "USER_OVERRIDE",
  };
  const lines = priceQuantities(specialLoadMaterials(fridge, 8), prices, catalogue);
  const copper = lines.find((line) => line.catalogueId === "mat-cab-sc-cu-1p5");
  assert.ok(copper, "the 1.5 mm² conductor line exists");
  assert.ok(copper.engineeringQuantity > 18 && copper.engineeringQuantity < 20, "about 19 m measured");
  // nine metres of phase plus nine of neutral is nineteen metres of cable, not two drums
  assert.ok(copper.quantity <= 20, `expected the measured run, got ${copper.quantity}`);
  assert.equal(copper.unitPrice !== null, true);
  assert.equal(copper.amount, Math.round((copper.unitPrice ?? 0) * copper.quantity * 100) / 100);
});

test("a plug-in appliance shares a circuit instead of buying its own device", () => {
  const plugIn: SpecialLoadInstance = {
    ...newSpecialLoadInstance("freezer", "fz-plug"),
    phase: "single",
    rated_power_kw: 0.8,
    route_length_m: 6,
    route_source: "USER_OVERRIDE",
    dedicated_circuit: false,
  };
  const dedicated: SpecialLoadInstance = { ...plugIn, id: "fz-dedicated", dedicated_circuit: true };

  const plugRows = materialMap(specialLoadMaterials(plugIn, 8));
  const dedicatedRows = materialMap(specialLoadMaterials(dedicated, 8));

  assert.ok(plugRows.get("socket_13a_double"), "the outlet and its run are still costed");
  assert.ok(![...plugRows.keys()].some((key) => key.startsWith("mcb_")), "no device of its own");
  assert.ok([...dedicatedRows.keys()].some((key) => key.startsWith("mcb_")), "a dedicated supply gets one");

  assert.equal(applySpecialLoads(engine(), [plugIn], {}).specialLoadTotals.circuits, 0);
  assert.equal(applySpecialLoads(engine(), [dedicated], {}).specialLoadTotals.circuits, 1);
  assert.match(specialLoadSummary(plugIn), /existing circuit/);
});

test("the configurator's own summary reads like the estimate", () => {
  const summary = specialLoadSummary(waterHeater());
  assert.match(summary, /4\.5 kW/);
  assert.match(summary, /18 m/);
  assert.match(summary, /20 A/);
  assert.match(summary, /4 mm²/);
  assert.equal(specialLoadDefinition("water_heater").name, "Water heater");
  assert.equal(specialLoadDefinition("not_in_the_rulebook").name, "Not in the rulebook");
});

test("a stored instance round-trips, and damaged rows are ignored", () => {
  const stored = parseSpecialLoadInstances([
    { ...waterHeater(), id: "stored-1" },
    { id: "broken" },
    null,
  ]);
  assert.equal(stored.length, 1);
  assert.equal(stored[0].id, "stored-1");
  assert.equal(stored[0].rated_power_kw, 4.5);
  assert.equal(stored[0].route_source, "USER_OVERRIDE");
  assert.equal(stored[0].quantity, 1);
});

test("configured loads move the final circuit count and the board size", () => {
  const base = engine();
  const outcome = applySpecialLoads(
    base,
    [waterHeater(), { ...newSpecialLoadInstance("ev_charger", "ev-1"), rated_power_kw: 7.4, phase: "single", route_length_m: 12 }],
    {},
  );

  assert.equal(outcome.totals.dedicated_circuits, 2);
  assert.equal(outcome.totals.total_final_circuits, base.totals.total_final_circuits + 2);
  assert.ok(outcome.totals.db_design_ways >= base.totals.db_design_ways);
  assert.equal(outcome.specialLoadTotals.verified, 0);
  assert.equal(outcome.specialLoadTotals.provisional, 2);
});
