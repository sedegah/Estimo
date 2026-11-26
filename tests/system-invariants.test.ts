/**
 * System invariants.
 *
 * An estimate is arithmetic that people spend money on, so these tests do not check
 * particular numbers: they check the rules every number must obey, over every template,
 * every specification, every load type and every preset.
 *
 *   - every material the engine or a special load can emit is linked to the catalogue,
 *     otherwise the row would silently vanish from the bill
 *   - every quantity and amount is a finite, non-negative number
 *   - each line's amount is quantity x unit price, and the total is the sum of the lines
 *   - a circuit's protective device covers its design current, and its cable covers the
 *     device after derating
 *   - doubling a load's quantity doubles its materials; a longer route never costs less
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
import {
  BREAKER_RATINGS,
  CABLE_CAPACITY_A,
  SPECIAL_LOAD_DEFINITIONS,
  newSpecialLoadInstance,
  sizeSpecialLoad,
  specialLoadMaterials,
  type SpecialLoadInstance,
} from "../lib/quantity-engine/special-loads.ts";
import { CATALOGUE_MATERIALS } from "../lib/data/catalogue.ts";
import { pricedTotal, lineAmount } from "../lib/estimate-total.ts";
import type {
  AssemblyItemRow,
  AssemblyRow,
  CircuitRuleRow,
  GlobalParameterRow,
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
const circuitRules = read<CircuitRuleRow[]>("circuit_rules.json");
const assemblies = read<AssemblyRow[]>("assemblies.json");
const assemblyItems = read<AssemblyItemRow[]>("assembly_items.json");
const templates = read<StructureTemplateRow[]>("structure_templates.json");
const templateSpaces = read<TemplateSpaceRow[]>("template_spaces.json");

const catalogue = new Map(
  CATALOGUE_MATERIALS.map((material) => [material.id, { id: material.id, name: material.name, unit: material.unit }]),
);

/** A price for everything the catalogue knows, so arithmetic is what is under test. */
const prices = Object.fromEntries(
  CATALOGUE_MATERIALS.map((material, index) => [
    material.id,
    { price: material.unit === "m" ? 7.5 : 12 + (index % 9), brand: null, source: null, updatedAt: null },
  ]),
);

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const money = (value: number) => Math.round(value * 100) / 100;

function spacesFor(templateId: string): SpaceInput[] {
  const template = templates.find((entry) => entry.template_id === templateId);
  assert.ok(template, `${templateId} exists`);
  return templateSpaces
    .filter((space) => space.template_id === templateId)
    .sort((a, b) => a.space_no - b.space_no)
    .map((space) => ({
      id: `${templateId}-${space.space_no}`,
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

const SPECS: SpecLevel[] = ["economy", "standard", "premium"];

test("every material the engine can emit is linked to the catalogue", () => {
  const keys = new Set(assemblyItems.map((item) => item.material_key));
  const unlinked = [...keys].filter((key) => !MATERIAL_CATALOGUE[key]?.id);
  assert.deepEqual(unlinked, [], "an unlinked key would vanish from the bill without a trace");

  for (const [key, link] of Object.entries(MATERIAL_CATALOGUE)) {
    if (!link.id) continue;
    assert.ok(catalogue.has(link.id), `${key} points at ${link.id}, which is not in the catalogue`);
  }
});

test("every material a special load can emit is linked, for every type and preset", () => {
  const missing: string[] = [];
  for (const definition of SPECIAL_LOAD_DEFINITIONS) {
    for (const preset of definition.presets) {
      for (const phase of ["single", "three"] as const) {
        const instance: SpecialLoadInstance = {
          ...newSpecialLoadInstance(definition.key, `probe-${definition.key}-${preset.code}-${phase}`),
          phase,
          rated_power_kw: 4,
          capacity_hp: 2,
          route_length_m: 12,
          route_source: "USER_OVERRIDE",
          ...preset.values,
        };
        for (const row of specialLoadMaterials(instance, 8)) {
          if (!MATERIAL_CATALOGUE[row.material_key]?.id) missing.push(`${definition.key}/${preset.code}/${phase}: ${row.material_key}`);
          if (!catalogue.has(MATERIAL_CATALOGUE[row.material_key]?.id ?? "")) {
            missing.push(`${definition.key}: ${row.material_key} -> unknown catalogue id`);
          }
        }
      }
    }
  }
  assert.deepEqual([...new Set(missing)], []);
});

test("every template, at every specification, produces finite money that adds up", () => {
  for (const template of templates) {
    for (const spec of SPECS) {
      const result = calculateProject({
        spaces: spacesFor(template.template_id),
        specLevel: spec,
        projectType: template.project_type,
        templateId: template.template_id,
        params,
        rules,
        circuitRules,
        assemblies,
        assemblyItems,
      });

      for (const row of result.materialQuantities) {
        assert.ok(finite(row.engineering_quantity), `${template.template_id}/${spec}: engineering quantity not finite`);
        assert.ok(row.engineering_quantity >= 0, `${template.template_id}/${spec}: negative quantity`);
        assert.ok(row.unit.length > 0, `${template.template_id}/${spec}: material without a unit`);
      }

      const lines = priceQuantities(result.materialQuantities, prices, catalogue);
      assert.ok(lines.length > 0, `${template.template_id}/${spec}: no priced lines`);
      const ids = new Set<string>();
      for (const line of lines) {
        assert.ok(finite(line.quantity) && line.quantity > 0, `${line.catalogueName}: bad quantity ${line.quantity}`);
        assert.ok(finite(line.unitPrice), `${line.catalogueName}: unit price not finite`);
        assert.ok(line.unitPrice! > 0, `${line.catalogueName}: unit price must be positive`);
        assert.ok(finite(line.amount), `${line.catalogueName}: amount not finite`);
        assert.equal(
          line.amount,
          money(line.quantity * line.unitPrice!),
          `${line.catalogueName}: ${line.quantity} x ${line.unitPrice} is not ${line.amount}`,
        );
        assert.ok(!ids.has(line.catalogueId), `${template.template_id}/${spec}: duplicate line for ${line.catalogueId}`);
        ids.add(line.catalogueId);
      }

      const total = pricedTotal(lines);
      assert.ok(finite(total) && total > 0, `${template.template_id}/${spec}: total not a positive number`);
      assert.equal(
        total,
        money(lines.reduce((sum, line) => sum + (line.amount ?? 0), 0)),
        `${template.template_id}/${spec}: the total is not the sum of its lines`,
      );
    }
  }
});

test("an unpriced line is null, never zero and never NaN", () => {
  for (const template of templates.slice(0, 4)) {
    const result = calculateProject({
      spaces: spacesFor(template.template_id),
      specLevel: "standard",
      projectType: template.project_type,
      templateId: template.template_id,
      params,
      rules,
      circuitRules,
      assemblies,
      assemblyItems,
    });
    const lines = priceQuantities(result.materialQuantities, {}, catalogue);
    for (const line of lines) {
      // allowance items (fans) carry a planning price on purpose; everything else waits
      if (ALLOWANCE_PRICES_GHS[line.catalogueId] !== undefined) {
        assert.ok(finite(line.amount) && line.amount! > 0, `${line.catalogueName}: allowance should price`);
        continue;
      }
      assert.equal(line.unitPrice, null, `${line.catalogueName}: should be unpriced`);
      assert.equal(line.amount, null);
      assert.equal(lineAmount(line), 0, "an unpriced line contributes nothing, not NaN");
    }
    const total = pricedTotal(lines);
    assert.ok(finite(total) && total >= 0);
  }
});

test("allowance lines are priced, finite and positive", () => {
  assert.ok(Object.keys(ALLOWANCE_PRICES_GHS).length > 0);
  for (const [id, price] of Object.entries(ALLOWANCE_PRICES_GHS)) {
    assert.ok(catalogue.has(id), `${id} allowance is not a catalogue material`);
    assert.ok(finite(price) && price > 0);
  }
});

test("every load type sizes a circuit that will carry its load", () => {
  for (const definition of SPECIAL_LOAD_DEFINITIONS) {
    for (const load of [
      { rated_power_kw: 0.5, phase: "single" as const },
      { rated_power_kw: 3, phase: "single" as const },
      { rated_power_kw: 7.5, phase: "three" as const },
      { rated_power_kw: 22, phase: "three" as const },
    ]) {
      const instance: SpecialLoadInstance = {
        ...newSpecialLoadInstance(definition.key, `size-${definition.key}-${load.rated_power_kw}`),
        ...load,
        capacity_hp: 2,
        route_length_m: 12,
        route_source: "USER_OVERRIDE",
      };
      const sizing = sizeSpecialLoad(instance);
      assert.ok(finite(sizing.loadCurrentA) && sizing.loadCurrentA > 0, `${definition.key}: load current`);
      assert.ok(finite(sizing.designCurrentA), `${definition.key}: design current`);
      assert.ok(
        sizing.protectiveDeviceA >= sizing.designCurrentA,
        `${definition.key} ${load.rated_power_kw}kW: ${sizing.protectiveDeviceA} A device under the ${sizing.designCurrentA} A design current`,
      );
      assert.ok(
        BREAKER_RATINGS.includes(sizing.protectiveDeviceA) || sizing.protectiveDeviceA === 63,
        `${definition.key}: device ${sizing.protectiveDeviceA} A is not a standard rating`,
      );
      const capacity = CABLE_CAPACITY_A[sizing.cableSizeMm2];
      assert.ok(finite(capacity), `${definition.key}: cable ${sizing.cableSizeMm2} mm² has no capacity`);
      assert.ok(
        capacity * 0.8 >= sizing.protectiveDeviceA,
        `${definition.key} ${load.rated_power_kw}kW: ${sizing.cableSizeMm2} mm² cable cannot carry the ${sizing.protectiveDeviceA} A device`,
      );
      assert.ok(sizing.cpcSizeMm2 > 0 && sizing.cpcSizeMm2 <= 16, `${definition.key}: protective conductor`);
      assert.ok([20, 25, 32].includes(sizing.containmentMm), `${definition.key}: containment size`);
      if (sizing.isolatorRatingA !== null) {
        assert.ok(sizing.isolatorRatingA >= Math.min(63, sizing.protectiveDeviceA), `${definition.key}: isolator rating`);
      }
    }
  }
});

test("load materials are linear in quantity and never fall with a longer route", () => {
  const load = (quantity: number, route: number): SpecialLoadInstance => ({
    ...newSpecialLoadInstance("water_heater", `linear-${quantity}-${route}`),
    rated_power_kw: 4.5,
    phase: "single",
    quantity,
    route_length_m: route,
    route_source: "USER_OVERRIDE",
  });

  const cost = (instance: SpecialLoadInstance) =>
    pricedTotal(priceQuantities(specialLoadMaterials(instance, 8), prices, catalogue));

  const one = cost(load(1, 12));
  const two = cost(load(2, 12));
  const three = cost(load(3, 12));
  // whole-metre rounding on each line keeps this within a percent or two of exact
  assert.ok(Math.abs(two - one * 2) <= 0.05 * two, `doubling quantity should double materials: ${one} -> ${two}`);
  assert.ok(Math.abs(three - one * 3) <= 0.05 * three, `tripling quantity should triple materials: ${one} -> ${three}`);
  assert.ok(two / 2 <= one * 1.02, "the per-unit cost must not rise with quantity");
  assert.ok(three / 3 <= one * 1.02, "the per-unit cost must not rise with quantity");
  assert.ok(cost(load(1, 30)) > cost(load(1, 10)), "a longer route must cost more");
  assert.ok(finite(cost(load(1, 60))));
});

test("a configured load's circuit count matches its quantity", () => {
  for (const definition of SPECIAL_LOAD_DEFINITIONS) {
    const instance: SpecialLoadInstance = {
      ...newSpecialLoadInstance(definition.key, `count-${definition.key}`),
      rated_power_kw: 4,
      capacity_hp: 2,
      phase: "single",
      quantity: 3,
      route_length_m: 10,
      route_source: "USER_OVERRIDE",
    };
    if (instance.dedicated_circuit === false) continue;
    const deviceRows = specialLoadMaterials(instance, 8).filter((row) =>
      /^mcb_(sp|tp)_/.test(row.material_key) || row.material_key === "rccb_2p_30ma",
    );
    for (const row of deviceRows) {
      assert.equal(row.engineering_quantity, 3, `${definition.key}: ${row.material_key} should be one per unit`);
    }
  }
});

test("estimated totals never contain NaN, Infinity or a negative amount", () => {
  const suspects = [0, 0.05, 0.1, 1e-6, 1, 12.345, 999.9];
  for (const value of suspects) {
    const instance: SpecialLoadInstance = {
      ...newSpecialLoadInstance("air_conditioner", `edge-${value}`),
      rated_power_kw: value,
      capacity_hp: value,
      phase: "single",
      route_length_m: value,
      route_source: "USER_OVERRIDE",
    };
    const sizing = sizeSpecialLoad(instance);
    for (const key of ["loadCurrentA", "designCurrentA", "protectiveDeviceA", "cableSizeMm2", "containmentMm", "powerKw"] as const) {
      assert.ok(finite(sizing[key]), `${value}: ${key} is ${sizing[key]}`);
      assert.ok(sizing[key] >= 0, `${value}: ${key} is negative`);
    }
    const lines = priceQuantities(specialLoadMaterials(instance, 8), prices, catalogue);
    for (const line of lines) {
      assert.ok(finite(line.quantity) && line.quantity >= 0, `${value}: ${line.catalogueName} quantity`);
      assert.ok(finite(line.amount) && line.amount! >= 0, `${value}: ${line.catalogueName} amount`);
    }
    assert.ok(finite(pricedTotal(lines)));
  }
});
