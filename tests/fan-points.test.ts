/**
 * Fans used to buy a switch and a length of cable, but never the fan. Each fan point now
 * carries the fan, its speed regulator and its hook, priced at an allowance rate until a
 * supplier price is published for the model.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { calculateProject, parametersFromRows, rulesByKey } from "../lib/quantity-engine/engine.ts";
import {
  ALLOWANCE_PRICES_GHS,
  MATERIAL_CATALOGUE,
  priceQuantities,
} from "../lib/quantity-engine/catalogue.ts";
import { CATALOGUE_MATERIALS } from "../lib/data/catalogue.ts";
import type {
  AssemblyItemRow,
  AssemblyRow,
  CircuitRuleRow,
  GlobalParameterRow,
  PointOverride,
  RoomRuleRow,
  SpaceInput,
} from "../lib/quantity-engine/types.ts";

const DATA = path.join(import.meta.dirname, "..", "lib", "data", "quantity-engine");
const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) as T;

const params = parametersFromRows(read<GlobalParameterRow[]>("global_parameters.json"));
const rules = rulesByKey(read<RoomRuleRow[]>("room_rules.json"));

function run(overrides: PointOverride[] = []) {
  const space: SpaceInput = {
    id: "bedroom-1",
    space_name: "Bedroom",
    room_type: "bedroom",
    length_m: 4,
    width_m: 3.5,
    height_m: 3,
    quantity: 1,
  };
  return calculateProject({
    spaces: [space],
    specLevel: "standard",
    projectType: "test",
    params,
    rules,
    circuitRules: read<CircuitRuleRow[]>("circuit_rules.json"),
    assemblies: read<AssemblyRow[]>("assemblies.json"),
    assemblyItems: read<AssemblyItemRow[]>("assembly_items.json"),
    overrides,
  });
}

const catalogue = new Map(
  CATALOGUE_MATERIALS.map((material) => [material.id, { id: material.id, name: material.name, unit: material.unit }]),
);

test("every fan point brings a fan, a regulator and a hook", () => {
  const result = run();
  assert.ok(result.totals.fan_points > 0, "a bedroom has a fan by default");
  const rows = new Map(result.materialQuantities.map((row) => [row.material_key, row]));
  for (const key of ["ceiling_fan", "fan_regulator", "fan_hook"]) {
    assert.equal(rows.get(key)?.engineering_quantity, result.totals.fan_points, `${key} per fan`);
  }
});

test("fans are priced at an allowance rate when the catalogue has no price", () => {
  const result = run();
  const lines = priceQuantities(result.materialQuantities, {}, catalogue);
  const fan = lines.find((line) => line.catalogueId === "mat-fan-ceiling-56");
  assert.ok(fan, "the fan is on the bill");
  assert.equal(fan.unitPrice, ALLOWANCE_PRICES_GHS["mat-fan-ceiling-56"]);
  assert.equal(fan.amount, Math.round(fan.quantity * fan.unitPrice! * 100) / 100);
  assert.equal(fan.brand, "ESTIMO allowance", "the line says it is an allowance");
});

test("a published supplier price beats the allowance", () => {
  const result = run();
  const prices = {
    "mat-fan-ceiling-56": { price: 620, brand: "Supplier", source: "catalogue", updatedAt: null },
  };
  const lines = priceQuantities(result.materialQuantities, prices, catalogue);
  const fan = lines.find((line) => line.catalogueId === "mat-fan-ceiling-56");
  assert.equal(fan?.unitPrice, 620);
  assert.equal(fan?.brand, "Supplier");
});

test("more fans cost more, and the bill follows the count", () => {
  const none = run([{ space_id: "bedroom-1", point_type: "fans", value: 0, source: "user_override" }]);
  const two = run([{ space_id: "bedroom-1", point_type: "fans", value: 2, source: "user_override" }]);

  const fanOf = (result: ReturnType<typeof run>) =>
    result.materialQuantities.find((row) => row.material_key === "ceiling_fan")?.engineering_quantity ?? 0;

  assert.equal(fanOf(none), 0);
  assert.equal(fanOf(two), 2);
  assert.ok(MATERIAL_CATALOGUE.ceiling_fan?.id, "the fan material is linked to the catalogue");
});
