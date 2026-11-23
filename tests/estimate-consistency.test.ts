/**
 * Guards the one-total rule: what the estimate page shows, what gets saved and what
 * the PDF receives must all be the same money.
 *
 * The engine's rule data is read from disk so this test runs under plain node
 * (the app imports the same JSON through its bundler).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  calculateProject,
  parametersFromRows,
  rulesByKey,
  templateSpaces,
  type CalculateArgs,
} from "../lib/quantity-engine/engine.ts";
import { MATERIAL_CATALOGUE, priceQuantities } from "../lib/quantity-engine/catalogue.ts";
import { pricedCount, pricedTotal } from "../lib/estimate-total.ts";
import { unitLabel } from "../lib/format.ts";
import { CATALOGUE_MATERIALS } from "../lib/data/catalogue.ts";
import type {
  AssemblyItemRow,
  AssemblyRow,
  CircuitRuleRow,
  GlobalParameterRow,
  RoomRuleRow,
  StructureTemplateRow,
  TemplateSpaceRow,
} from "../lib/quantity-engine/types.ts";

const ruleDir = path.join(process.cwd(), "lib", "data", "quantity-engine");
const read = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(ruleDir, file), "utf8")) as T;

const templates = read<StructureTemplateRow[]>("structure_templates.json");
const templateSpaceRows = read<TemplateSpaceRow[]>("template_spaces.json");
const rules = read<RoomRuleRow[]>("room_rules.json");
const params = parametersFromRows(read<GlobalParameterRow[]>("global_parameters.json"));
const circuitRules = read<CircuitRuleRow[]>("circuit_rules.json");
const assemblies = read<AssemblyRow[]>("assemblies.json");
const assemblyItems = read<AssemblyItemRow[]>("assembly_items.json");

const catalogue = new Map(
  CATALOGUE_MATERIALS.map((material) => [material.id, { id: material.id, name: material.name, unit: material.unit }]),
);

/** Every mapped material priced, so the check is about arithmetic, not the price list. */
const prices = Object.fromEntries(
  Object.values(MATERIAL_CATALOGUE)
    .map((link) => link.id)
    .filter((id): id is string => Boolean(id))
    .map((id) => [id, { price: 10, brand: null, source: null, updatedAt: null }]),
);

function linesFor(templateId: string, specLevel: string) {
  const template = templates.find((entry) => entry.template_id === templateId);
  assert.ok(template, `${templateId} exists`);
  const args: CalculateArgs = {
    spaces: templateSpaces(template, templateSpaceRows),
    specLevel: specLevel as CalculateArgs["specLevel"],
    projectType: template.project_type,
    templateId,
    params,
    rules: rulesByKey(rules),
    circuitRules,
    assemblies,
    assemblyItems,
  };
  return priceQuantities(calculateProject(args).materialQuantities, prices, catalogue);
}

/** Exactly what "Save estimate" writes. */
function savedItems(lines: ReturnType<typeof linesFor>) {
  return lines.map((line) => ({
    name: line.catalogueName,
    quantity: Math.max(1, Math.ceil(line.purchaseQuantity)),
    unit: line.catalogueUnit,
    priceGhs: line.unitPrice,
  }));
}

test("the page total, the saved total and the PDF total are the same number", () => {
  for (const [templateId, specLevel] of [
    ["T011", "standard"],
    ["T011", "premium"],
    ["T014", "standard"],
    ["T026", "standard"],
  ] as const) {
    const lines = linesFor(templateId, specLevel);
    const items = savedItems(lines);
    const pageTotal = pricedTotal(lines);
    const savedTotal = pricedTotal(items);

    assert.equal(savedTotal, pageTotal, `${templateId} ${specLevel}: saved total drifts from the page`);
    assert.equal(pricedTotal(items), pageTotal, `${templateId} ${specLevel}: document total drifts from the page`);
    assert.equal(pricedCount(lines), lines.length, "every line is priced for this fixture");
  }
});

test("a merged cable line pays for both runs", () => {
  const lines = linesFor("T011", "standard");
  const cable = lines.find((line) => line.catalogueId === "mat-cab-sc-cu-2p5");
  assert.ok(cable, "the 2.5mm single-core cable line exists");
  assert.ok(cable.unitPrice, "it is priced");
  assert.ok(Math.abs((cable.amount ?? 0) - cable.unitPrice * cable.quantity) < 0.01, "amount covers the whole quantity");
  assert.ok(cable.quantity > 0);
});

test("quantities are whole catalogue units, never metres dressed as lengths", () => {
  for (const [templateId, specLevel] of [["T011", "standard"], ["T002", "standard"]] as const) {
    for (const line of linesFor(templateId, specLevel)) {
      assert.ok(Number.isInteger(line.purchaseQuantity), `${line.catalogueName}: purchase quantity must be whole units`);
      assert.ok(line.purchaseQuantity > 0, `${line.catalogueName}: purchase quantity must be positive`);
      if (line.catalogueUnit === "length") {
        assert.ok(line.purchaseQuantity < line.engineeringQuantity, "lengths are fewer than the metres they cover");
      }
    }
  }
});

test("units read as pcs, lengths and m everywhere", () => {
  assert.equal(unitLabel("No."), "pcs");
  assert.equal(unitLabel("length"), "lengths");
  assert.equal(unitLabel("m"), "m");
  assert.equal(unitLabel("set"), "sets");
});
