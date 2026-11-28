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
  autoRouteForSpace,
  dbKeyForSpace,
  configurationStatus,
  defaultAcAdditions,
  defaultCommercialAdditions,
  missingRequirements,
  newSpecialLoadInstance,
  parseSpecialLoadInstances,
  sizeSpecialLoad,
  specialLoadMaterials,
  specialLoadSummary,
  seedSpecialLoads,
  specialLoadDefinition,
  syncAcQuantity,
  type SpecialLoadInstance,
} from "../lib/quantity-engine/special-loads.ts";
import { calculateProject, parametersFromRows, rulesByKey } from "../lib/quantity-engine/engine.ts";
import { conductorPriceWarnings, priceQuantities, type PriceEntry } from "../lib/quantity-engine/catalogue.ts";
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
  // the load's own materials, with no price list at all: the lines stay, the money does not
  const rows = specialLoadMaterials(waterHeater(), 8);
  const lines = priceQuantities(rows, {}, catalogue);
  const unpriced = lines.find((line) => line.amount === null);
  assert.ok(unpriced, "a line with no published price stays visible and unpriced");
  const subtotal = lines.reduce((sum, line) => sum + (line.amount ?? 0), 0);
  assert.equal(subtotal, 0, "no price means no money is invented");

  // a published price fills the same line; pending and amount stay in step either way
  const priced = priceQuantities(rows, prices, catalogue);
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
  // a freezer shares the fridge's 1.5 mm² conductors, so the line carries both names
  const freezer: SpecialLoadInstance = {
    ...newSpecialLoadInstance("freezer", "origin-freezer"),
    phase: "single",
    rated_power_kw: 0.8,
    route_length_m: 7.2,
    route_source: "USER_OVERRIDE",
  };

  const outcome = applySpecialLoads(engine(), [fridge, freezer], {});
  const pair = priceQuantities(outcome.materialQuantities, prices, catalogue);
  const copper = pair.find((line) => line.catalogueId === "mat-cab-sc-cu-1p5");
  assert.ok(copper, "the shared 1.5 mm² line exists");
  assert.deepEqual([...copper.origins].sort(), ["Freezer", "Fridge"]);
  assert.equal(copper.mixed, false, "only the loads use this size, so it is theirs");
});

test("air conditioners are run in 2.5 mm² whatever their rating", () => {
  for (const hp of [1, 1.5, 2, 2.5]) {
    const ac: SpecialLoadInstance = {
      ...newSpecialLoadInstance("air_conditioner", `ac-min-${hp}`),
      capacity_hp: hp,
      phase: "single",
      route_length_m: 13,
      route_source: "USER_OVERRIDE",
    };
    const sizing = sizeSpecialLoad(ac);
    assert.equal(sizing.cableSizeMm2, 2.5, `${hp} HP cable`);
    assert.ok(
      sizing.basis.some((line) => /smallest cable .* run in/i.test(line)),
      `${hp} HP basis explains the minimum`,
    );
  }
});

test("a smaller cable priced above a larger one is reported, not silently used", () => {
  const inverted = {
    "mat-cab-sc-cu-1p5": { price: 25, brand: null, source: null, updatedAt: null },
    "mat-cab-sc-cu-2p5": { price: 6, brand: null, source: null, updatedAt: null },
  };
  const warnings = conductorPriceWarnings(inverted);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /1\.5 mm².*25\.00.*2\.5 mm².*6\.00/);

  const sane = {
    "mat-cab-sc-cu-1p5": { price: 4, brand: null, source: null, updatedAt: null },
    "mat-cab-sc-cu-2p5": { price: 6, brand: null, source: null, updatedAt: null },
  };
  assert.deepEqual(conductorPriceWarnings(sane), []);
});

test("adding the AC load after counting the ACs prices every one of them", () => {
  // the order that used to break: count the ACs first, then add the load
  const ac: SpecialLoadInstance = {
    ...newSpecialLoadInstance("air_conditioner", "ac-order"),
    capacity_hp: 2.5,
    phase: "single",
    route_length_m: 13,
    route_source: "USER_OVERRIDE",
    quantity: 1,
  };
  const synced = syncAcQuantity([ac], 4);
  assert.equal(synced[0].quantity, 4);
  assert.equal(specialLoadSummary(synced[0]), `4 × 2.5 HP · 2.25 kW · 13 m · 16 A · 2.5 mm² · from DB1`);

  const outcome = applySpecialLoads(engine(), synced, {});
  const device = outcome.materialQuantities.find((row) => row.material_key === "mcb_sp_16");
  assert.equal(device?.engineering_quantity, 4, "one breaker per air conditioner");
  const isolator = outcome.materialQuantities.find((row) => row.material_key === "isolator_dp_32");
  assert.equal(isolator?.engineering_quantity, 4);
  assert.equal(outcome.specialLoadTotals.circuits, 4);

  // and the card's own figure is for four units, not one
  const lines = priceQuantities(specialLoadMaterials(synced[0], 8), prices, catalogue);
  const single = priceQuantities(specialLoadMaterials({ ...synced[0], quantity: 1 }, 8), prices, catalogue);
  const total = (rows: ReturnType<typeof priceQuantities>) => rows.reduce((sum, line) => sum + (line.amount ?? 0), 0);
  assert.ok(total(lines) > total(single) * 3.5, "four units cost about four times one");
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

test("homes and offices open air conditioned; the rooms that should not are left alone", () => {
  const rooms: SpaceInput[] = [
    { id: "T011-1", space_name: "Bedroom 1", room_type: "bedroom", length_m: 4, width_m: 3.5, height_m: 3 },
    { id: "T011-2", space_name: "Bedroom 2", room_type: "bedroom", length_m: 3.5, width_m: 3, height_m: 3 },
    { id: "T011-5", space_name: "Living Room", room_type: "living_room", length_m: 5, width_m: 4, height_m: 3 },
    { id: "T011-4", space_name: "Kitchen", room_type: "kitchen", length_m: 3, width_m: 2.5, height_m: 3 },
  ];

  const home = defaultAcAdditions({ projectType: "two_bedroom", templateId: "T011", spaces: rooms, routes: [] });
  assert.equal(home.overrides.length, 3, "one AC per bedroom and living room, not the kitchen");
  assert.ok(home.overrides.every((entry) => entry.point_type === "ac" && entry.value === 1));
  assert.equal(home.instances.length, 1);
  assert.equal(home.instances[0].load_key, "air_conditioner");
  assert.equal(home.instances[0].quantity, 3, "the load is priced for all three units");
  assert.equal(home.instances[0].capacity_hp, 2, "every room is planned at 2 HP until changed");

  // an office is air conditioned everywhere except the washrooms
  const officeRooms: SpaceInput[] = [
    { id: "T020-1", space_name: "Reception", room_type: "reception", length_m: 4, width_m: 3, height_m: 3 },
    { id: "T020-2", space_name: "Open Office", room_type: "open_office", length_m: 10, width_m: 7, height_m: 3 },
    { id: "T020-3", space_name: "Private Office", room_type: "private_office", length_m: 3.8, width_m: 3.4, height_m: 3 },
    { id: "T020-4", space_name: "Meeting Room", room_type: "meeting_room", length_m: 5, width_m: 4, height_m: 3 },
    { id: "T020-5", space_name: "Kitchenette", room_type: "kitchen", length_m: 3, width_m: 2.5, height_m: 3 },
    { id: "T020-6", space_name: "Washroom", room_type: "wc", length_m: 2, width_m: 1.6, height_m: 3 },
    { id: "T020-7", space_name: "Store", room_type: "store", length_m: 2.5, width_m: 2, height_m: 3 },
    { id: "T020-8", space_name: "Server Room", room_type: "server_room", length_m: 3, width_m: 2.4, height_m: 3 },
  ];
  const office = defaultAcAdditions({ projectType: "office", templateId: "T020", spaces: officeRooms, routes: [] });
  assert.equal(office.overrides.length, officeRooms.length - 1, "every office room except the washroom");
  const cooled = new Set(office.overrides.map((entry) => entry.space_id));
  assert.ok(!cooled.has("T020-6"), "the washroom is not air conditioned");
  assert.ok(cooled.has("T020-1"), "the reception is air conditioned");
  assert.ok(cooled.has("T020-8"), "the server room is air conditioned");
  assert.equal(office.instances.length, 1);
  assert.equal(office.instances[0].quantity, officeRooms.length - 1);

  const single = defaultAcAdditions({ projectType: "single_room", templateId: "T004", spaces: rooms, routes: [] });
  assert.deepEqual(single, { overrides: [], instances: [] }, "a single room has nowhere to put one");

  const shop = defaultAcAdditions({ projectType: "shop_retail", templateId: "T023", spaces: rooms, routes: [] });
  assert.deepEqual(shop, { overrides: [], instances: [] }, "a shop is not air conditioned by default");

  // a count the person already set is left alone; only the unset rooms are seeded
  const kept = defaultAcAdditions({
    projectType: "two_bedroom",
    templateId: "T011",
    spaces: rooms,
    routes: [],
    overrides: [{ space_id: "T011-1", point_type: "ac", value: 3, source: "user_override" }],
  });
  assert.deepEqual(kept.overrides.map((entry) => entry.space_id).sort(), ["T011-2", "T011-5"]);
});

test("the EV charger sits in the compound with its own double-pole breaker", () => {
  assert.equal(specialLoadDefinition("ev_charger").spaceContext, "external");
  const rooms: SpaceInput[] = [
    { id: "T011-9", space_name: "Garage", room_type: "garage", length_m: 5, width_m: 3, height_m: 3 },
    { id: "T011-8", space_name: "Porch", room_type: "porch_veranda", length_m: 3, width_m: 2, height_m: 3 },
    { id: "T011-1", space_name: "Bedroom", room_type: "bedroom", length_m: 4, width_m: 3.5, height_m: 3 },
  ];
  const [seeded] = seedSpecialLoads(["ev_charger"], rooms, [], "T011");
  assert.equal(seeded.target_space_id, "T011-8", "the compound's porch comes before the carport");

  const ev: SpecialLoadInstance = {
    ...seeded,
    rated_power_kw: 7.4,
    phase: "single",
    quantity: 2,
    route_length_m: 12,
    route_source: "USER_OVERRIDE",
  };
  const rows = materialMap(specialLoadMaterials(ev, 8));
  assert.equal(rows.get("mcb_dp_40")?.engineering_quantity, 2, "its own double-pole breaker, one per charger");
  assert.ok(!rows.has("mcb_sp_40"), "not a single-pole device");
  assert.equal(rows.get("rccb_2p_30ma")?.engineering_quantity, 2, "30 mA RCD protection per charger");
  assert.ok(rows.get("isolator_dp_63"), "local isolation at the compound");
});


test("a multi-unit AC line is priced at the average route of its rooms, in any order", () => {
  const rooms: SpaceInput[] = [
    { id: "T011-1", space_name: "Bedroom 1", room_type: "bedroom", length_m: 4, width_m: 3.5, height_m: 3 },
    { id: "T011-2", space_name: "Bedroom 2", room_type: "bedroom", length_m: 3.5, width_m: 3, height_m: 3 },
    { id: "T011-5", space_name: "Living Room", room_type: "living_room", length_m: 5, width_m: 4, height_m: 3 },
  ];
  const routes = [
    { template_id: "T011", space_no: 1, distance_from_db_m: 6 },
    { template_id: "T011", space_no: 2, distance_from_db_m: 12 },
    { template_id: "T011", space_no: 5, distance_from_db_m: 18 },
  ].map((row) => ({ ...row, route_distance_from_db_m: row.distance_from_db_m, serving_db_id: "DB1" })) as never[];

  const [ac] = defaultAcAdditions({ projectType: "two_bedroom", templateId: "T011", spaces: rooms, routes }).instances;
  assert.equal(ac.quantity, 3);
  assert.equal(ac.route_length_m, 12, "the mean of 6, 12 and 18 m");
  assert.equal(ac.route_aggregate, true, "the card can say it is an average");

  // the same rooms in another order give the same price, not one room's price
  const shuffled = [rooms[2], rooms[0], rooms[1]];
  const [ac2] = defaultAcAdditions({ projectType: "two_bedroom", templateId: "T011", spaces: shuffled, routes }).instances;
  assert.equal(ac2.route_length_m, 12);
  assert.equal(ac2.quantity, 3);
});

test("an office row of three private offices is three air conditioners", () => {
  const rooms: SpaceInput[] = [
    { id: "T020-1", space_name: "Reception", room_type: "reception", length_m: 4, width_m: 3, height_m: 3, quantity: 1 },
    { id: "T020-3", space_name: "Private Offices", room_type: "private_office", length_m: 3.8, width_m: 3.4, height_m: 3, quantity: 3 },
    { id: "T020-6", space_name: "Washroom", room_type: "wc", length_m: 2, width_m: 1.6, height_m: 3, quantity: 2 },
  ];
  const routes = [
    { template_id: "T020", space_no: 1, route_distance_from_db_m: 4, serving_db_id: "DB1" },
    { template_id: "T020", space_no: 3, route_distance_from_db_m: 10, serving_db_id: "DB1" },
  ] as never[];

  const { overrides, instances } = defaultAcAdditions({
    projectType: "office",
    templateId: "T020",
    spaces: rooms,
    routes,
  });
  assert.equal(overrides.length, 2, "one override per space, not per unit");
  assert.equal(instances[0].quantity, 4, "reception + three private offices");
  // (4 x 1 + 10 x 3) / 4 = 8.5 m, weighted by the room count
  assert.equal(instances[0].route_length_m, 8.5);
});

test("a copied space keeps its own route, not the route of the copy number", () => {
  const routes = [
    { template_id: "T020", space_no: 1, route_distance_from_db_m: 4, serving_db_id: "DB1", db_key: "DB1" },
    { template_id: "T020", space_no: 8, route_distance_from_db_m: 21, serving_db_id: "DB1", db_key: "DB1" },
  ] as never[];
  assert.equal(autoRouteForSpace(routes, "T020", "T020-8"), 21);
  assert.equal(autoRouteForSpace(routes, "T020", "T020-8-1"), 21, "a copy still belongs to space 8");
  assert.equal(autoRouteForSpace(routes, "T020", "T020-1-2"), 4);
  assert.equal(dbKeyForSpace(routes, "T020", "T020-8-1"), "DB1");
});

test("illuminated sign and POS counter wire full kits and seed for commercial spaces", () => {
  const signRows = materialMap(
    specialLoadMaterials({ ...newSpecialLoadInstance("illuminated_sign", "sign-1"), route_length_m: 10, route_source: "USER_OVERRIDE" }, 8),
  );
  assert.ok(signRows.get("fcu_13a"), "sign includes FCU control");
  assert.ok(signRows.get("flexible_conduit_20"), "sign includes 20mm flexible conduit");
  assert.ok(signRows.get("junction_box_100"), "sign includes outdoor junction box");

  const posRows = materialMap(
    specialLoadMaterials({ ...newSpecialLoadInstance("pos_counter", "pos-1"), route_length_m: 12, route_source: "USER_OVERRIDE" }, 8),
  );
  assert.equal(posRows.get("socket_13a_double")?.engineering_quantity, 3);
  assert.equal(posRows.get("socket_13a_double_usb")?.engineering_quantity, 1);
  assert.equal(posRows.get("data_rj45_outlet")?.engineering_quantity, 3);
  assert.equal(posRows.get("data_cable")?.engineering_quantity, 36);
  assert.equal(posRows.get("trunking_38x25")?.engineering_quantity, 15);

  const kioskSpaces: SpaceInput[] = [
    { id: "T002-1", space_name: "Main Shop", room_type: "shop_floor", length_m: 6, width_m: 2.4, height_m: 2.6, checkout_counters: 1 },
    { id: "T002-porch", space_name: "Porch", room_type: "porch_veranda", length_m: 3, width_m: 1, height_m: 2.6 },
  ];
  const loads = defaultCommercialAdditions({ projectType: "container_kiosk", templateId: "T002", spaces: kioskSpaces, routes: [] });
  assert.deepEqual(loads.map((l) => l.load_key).sort(), ["illuminated_sign", "pos_counter"]);
  assert.deepEqual(defaultCommercialAdditions({ projectType: "container_kiosk", templateId: "T002", spaces: [], routes: [] }), []);
});

test("workshop machines seed a three-phase SpecialLoadInstance and produce TP MCB + TPN isolator materials", () => {
  // 1. The seed function: a workshop with 3 machines must produce a workshop_machine load
  //    with quantity=3, phase=three, and the provisional fallback power.
  const workshopSpaces: SpaceInput[] = [
    { id: "T013-1", space_name: "Workshop", room_type: "workshop", length_m: 12, width_m: 8, height_m: 4, machine_count: 3 },
  ];
  const machineLoads = defaultCommercialAdditions({
    projectType: "workshop_small_factory",
    templateId: "T013",
    spaces: workshopSpaces,
    routes: [],
  });
  assert.equal(machineLoads.length, 1, "one workshop_machine load is seeded");
  const ml = machineLoads[0]!;
  assert.equal(ml.load_key, "workshop_machine");
  assert.equal(ml.quantity, 3, "quantity matches machine_count");
  assert.equal(ml.phase, "three", "machines default to three-phase");
  assert.equal(ml.rated_power_kw, 5, "fallback power is 5 kW per machine");

  // 2. The materials path: a configured three-phase machine must emit a TP MCB and a
  //    TPN isolator, NOT a single-pole breaker or a double-pole isolator (the old assembly
  //    path emitted those; this test proves the new path is correct).
  const rows = materialMap(
    specialLoadMaterials(
      { ...ml, route_length_m: 15, route_source: "USER_OVERRIDE" },
      8,
    ),
  );
  // protective device: should be three-pole, e.g. mcb_tp_25 (5 kW @ 400 V / 0.85 pf = ~8.5 A design, rounds to 10 A)
  const mcbKey = [...rows.keys()].find((k) => k.startsWith("mcb_tp_"));
  assert.ok(mcbKey, "workshop machine gets a triple-pole MCB (not single-pole)");
  assert.ok(!rows.has("mcb_sp_10") && !rows.has("mcb_sp_25") && !rows.has("mcb_sp_63"), "no single-pole MCB");

  // isolator: should be TPN (four-pole), e.g. isolator_tpn_32
  const isoKey = [...rows.keys()].find((k) => k.startsWith("isolator_tpn_"));
  assert.ok(isoKey, "workshop machine gets a TPN (four-pole) isolator (not double-pole)");
  assert.ok(!rows.has("isolator_dp_32") && !rows.has("isolator_dp_63"), "no double-pole isolator");

  // conductors: three-phase load must have 3× phase conductors, 1× neutral, 1× CPC
  const phaseKey = [...rows.keys()].find((k) => k.startsWith("special_phase_"));
  assert.ok(phaseKey, "phase conductor present");
  const phaseRow = rows.get(phaseKey!);
  const neutralKey = [...rows.keys()].find((k) => k.startsWith("special_neutral_"));
  const neutralRow = rows.get(neutralKey!);
  // 3 machines × 3 phases each = 9 phase runs; 3 machines × 1 neutral each = 3 neutral runs
  assert.ok((phaseRow?.engineering_quantity ?? 0) >= (neutralRow?.engineering_quantity ?? 0) * 2.5,
    "phase total is significantly more than neutral total (3-phase winding)");

  // zero machines → no load seeded
  const noMachines = defaultCommercialAdditions({
    projectType: "workshop_small_factory",
    templateId: "T013",
    spaces: [{ id: "T013-1", space_name: "Workshop", room_type: "workshop", length_m: 12, width_m: 8, height_m: 4, machine_count: 0 }],
    routes: [],
  });
  assert.equal(noMachines.length, 0, "no load when machine_count is zero");
});
