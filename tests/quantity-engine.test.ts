/**
 * Quantity engine tests.
 *
 * The first test is the important one: every standard template must reproduce the
 * handoff's reference numbers exactly, so a change to the rules or the engine cannot
 * silently move prices on the site.
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import {
  calculateProject,
  parametersFromRows,
  rulesByKey,
  templateSpaces,
} from "../lib/quantity-engine/engine.ts";
import type {
  AssemblyItemRow,
  AssemblyRow,
  CircuitRuleRow,
  GlobalParameterRow,
  PointOverride,
  RoomRuleRow,
  SpaceInput,
  SpecLevel,
  StructureTemplateRow,
  TemplateSpaceRow,
} from "../lib/quantity-engine/types.ts";

const DATA = path.join(import.meta.dirname, "..", "lib", "data", "quantity-engine");
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) as T;

const params = parametersFromRows(read<GlobalParameterRow[]>("global_parameters.json"));
const rules = rulesByKey(read<RoomRuleRow[]>("room_rules.json"));
const templates = read<StructureTemplateRow[]>("structure_templates.json");
const templateSpaceRows = read<TemplateSpaceRow[]>("template_spaces.json");
const circuitRules = read<CircuitRuleRow[]>("circuit_rules.json");
const assemblies = read<AssemblyRow[]>("assemblies.json");
const assemblyItems = read<AssemblyItemRow[]>("assembly_items.json");
const expected = read<Record<string, number | string>[]>("expected_template_outputs_standard.json");

function run(spaces: SpaceInput[], specLevel: SpecLevel = "standard", overrides: PointOverride[] = []) {
  return calculateProject({
    spaces,
    specLevel,
    projectType: "test",
    params,
    rules,
    circuitRules,
    assemblies,
    assemblyItems,
    overrides,
  });
}

const bedroom = (overrides: Partial<SpaceInput> = {}): SpaceInput => ({
  id: "bedroom-1",
  space_name: "Bedroom",
  room_type: "bedroom",
  length_m: 4,
  width_m: 3.5,
  height_m: 3,
  quantity: 1,
  ...overrides,
});

test("every standard template matches the handoff reference outputs", () => {
  const fields: [string, (result: ReturnType<typeof run>) => number][] = [
    ["floor_area_sum_m2", (r) => r.totals.floor_area_m2],
    ["lighting_points", (r) => r.totals.lighting_points],
    ["double_sockets", (r) => r.totals.double_sockets],
    ["fan_points", (r) => r.totals.fan_points],
    ["ac_points_default", (r) => r.totals.ac_points],
    ["tv_points", (r) => r.totals.tv_points],
    ["data_points", (r) => r.totals.data_points],
    ["switch_positions", (r) => r.totals.switch_positions],
    ["lighting_circuits", (r) => r.totals.lighting_circuits],
    ["socket_circuits", (r) => r.totals.socket_circuits],
    ["machine_circuits", (r) => r.totals.machine_circuits],
    ["ac_circuits", (r) => r.totals.ac_circuits],
    ["total_final_circuits", (r) => r.totals.total_final_circuits],
    ["db_design_ways_with_spare", (r) => r.totals.db_design_ways],
    ["lighting_containment_m", (r) => r.totals.lighting_containment_m],
    ["socket_containment_m", (r) => r.totals.socket_containment_m],
    ["total_containment_m", (r) => r.totals.total_containment_m],
    ["20mm_conduit_3m_lengths", (r) => r.totals.conduit_lengths_3m],
    ["lighting_conductor_est_m", (r) => r.totals.lighting_conductor_est_m],
    ["socket_conductor_est_m", (r) => r.totals.socket_conductor_est_m],
    ["conduit_couplers_est", (r) => r.totals.conduit_couplers_est],
    ["conduit_bends_est", (r) => r.totals.conduit_bends_est],
    ["drawboxes_est", (r) => r.totals.drawboxes_est],
  ];

  for (const want of expected) {
    const template = templates.find((entry) => entry.template_id === want.template_id);
    assert.ok(template, `template ${want.template_id} exists`);
    const result = run(templateSpaces(template, templateSpaceRows));
    for (const [label, get] of fields) {
      const expectedValue = Number(want[label]);
      const got = get(result);
      assert.ok(
        Math.abs(got - expectedValue) <= 0.11,
        `${want.template_id} ${label}: got ${got}, expected ${expectedValue}`,
      );
    }

    // the reference marks boards beyond the stocked sizes as "engineered"
    if (want.recommended_db_ways === "engineered") {
      assert.equal(result.totals.recommended_db_ways, null, `${want.template_id} should report an engineered board`);
    } else {
      assert.equal(
        result.totals.recommended_db_ways,
        Number(want.recommended_db_ways),
        `${want.template_id} recommended board size`,
      );
    }
  }
});

test("a user override survives a geometry change, and resetting restores auto", () => {
  const base = bedroom();
  const auto = run([base]);
  assert.equal(auto.spaces[0].double_sockets, 3);

  const override: PointOverride[] = [
    { space_id: base.id, point_type: "double_sockets", value: 5, source: "user_override" },
  ];
  const overridden = run([base], "standard", override);
  assert.equal(overridden.spaces[0].double_sockets, 5);

  const resized = run([{ ...base, length_m: 8, width_m: 6 }], "standard", override);
  assert.equal(resized.spaces[0].double_sockets, 5, "override is kept when the room grows");

  const reset = run([{ ...base, length_m: 8, width_m: 6 }]);
  assert.ok(reset.spaces[0].double_sockets > 5, "auto recommendation grows with the room");
});

test("an open office adds a socket and a data point per workstation", () => {
  const office = (workstations: number): SpaceInput => ({
    id: "office",
    space_name: "Open office",
    room_type: "open_office",
    length_m: 8,
    width_m: 6,
    height_m: 3,
    workstations,
  });

  const twenty = run([office(20)]);
  assert.equal(twenty.spaces[0].double_sockets, 25);
  assert.equal(twenty.spaces[0].data_points, 20);

  const twentyFour = run([office(24)]);
  assert.equal(twentyFour.spaces[0].double_sockets, 30);
  assert.equal(twentyFour.spaces[0].data_points, 24);
});

test("shop counters add two double sockets each", () => {
  const shop = (counters: number): SpaceInput => ({
    id: "shop",
    space_name: "Shop floor",
    room_type: "shop_floor",
    length_m: 10,
    width_m: 6,
    height_m: 3.3,
    checkout_counters: counters,
  });

  const none = run([shop(0)]);
  const two = run([shop(2)]);
  const four = run([shop(4)]);

  assert.equal(two.spaces[0].double_sockets - none.spaces[0].double_sockets, 4);
  assert.equal(four.spaces[0].double_sockets - two.spaces[0].double_sockets, 4);
});

test("a demand beyond the stocked boards is reported as engineered", () => {
  const spaces: SpaceInput[] = [
    { id: "floor", space_name: "Workshop", room_type: "workshop", length_m: 20, width_m: 15, height_m: 4, machine_count: 12 },
    { id: "hall", space_name: "Hall", room_type: "open_office", length_m: 20, width_m: 12, height_m: 3, workstations: 60 },
  ];
  const result = run(spaces);
  assert.equal(result.totals.recommended_db_ways, null);
  assert.equal(result.db.engineered, true);
  assert.ok(result.warnings.some((warning) => warning.toLowerCase().includes("engineered")));
});

test("materials carry engineering and purchase quantities with pack rounding", () => {
  const result = run([bedroom()]);
  const conduit = result.materialQuantities.find((row) => row.material_key === "20mm_conduit");
  const socket = result.materialQuantities.find((row) => row.material_key === "double_13a_socket");

  assert.ok(conduit, "conduit is part of the take-off");
  assert.equal(conduit.pack_size, 3);
  assert.equal(conduit.purchase_quantity % 3, 0, "conduit is rounded to 3 m lengths");
  assert.ok(socket, "sockets are part of the take-off");
  // a TV point is a socket outlet too, so the socket row covers both counts\n  assert.equal(socket.engineering_quantity, result.totals.double_sockets + result.totals.tv_points);
  assert.equal(socket.confidence, "high");
});
