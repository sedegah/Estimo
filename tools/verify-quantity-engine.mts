/**
 * Compares the quantity engine against the handoff's reference outputs.
 *
 *   npx tsx tools/verify-quantity-engine.mts
 */
import fs from "node:fs";
import path from "node:path";

import { calculateProject, parametersFromRows, rulesByKey, templateSpaces } from "../lib/quantity-engine/engine";
import type { CircuitRuleRow, GlobalParameterRow, RoomRuleRow, StructureTemplateRow, TemplateSpaceRow } from "../lib/quantity-engine/types";

const DATA = path.join(import.meta.dirname, "..", "lib", "data", "quantity-engine");
const read = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA, file), "utf8")) as T;

const params = parametersFromRows(read<GlobalParameterRow[]>("global_parameters.json"));
const rules = rulesByKey(read<RoomRuleRow[]>("room_rules.json"));
const templates = read<StructureTemplateRow[]>("structure_templates.json");
const spaces = read<TemplateSpaceRow[]>("template_spaces.json");
const circuitRules = read<CircuitRuleRow[]>("circuit_rules.json");
const expected = JSON.parse(
  fs.readFileSync(path.join(DATA, "expected_template_outputs_standard.json"), "utf8"),
) as Record<string, number | string>[];

let failures = 0;

for (const want of expected) {
  const template = templates.find((entry) => entry.template_id === want.template_id);
  if (!template) {
    console.log(`MISSING template ${want.template_id}`);
    failures += 1;
    continue;
  }

  const result = calculateProject({
    spaces: templateSpaces(template, spaces),
    specLevel: "standard",
    projectType: template.project_type,
    templateId: template.template_id,
    params,
    rules,
    circuitRules,
  });

  const checks: [string, number, number][] = [
    ["floor_area_sum_m2", result.totals.floor_area_m2, Number(want.floor_area_sum_m2)],
    ["lighting_points", result.totals.lighting_points, Number(want.lighting_points)],
    ["double_sockets", result.totals.double_sockets, Number(want.double_sockets)],
    ["fan_points", result.totals.fan_points, Number(want.fan_points)],
    ["ac_points_default", result.totals.ac_points, Number(want.ac_points_default)],
    ["tv_points", result.totals.tv_points, Number(want.tv_points)],
    ["data_points", result.totals.data_points, Number(want.data_points)],
    ["switch_positions", result.totals.switch_positions, Number(want.switch_positions)],
    ["lighting_circuits", result.totals.lighting_circuits, Number(want.lighting_circuits)],
    ["socket_circuits", result.totals.socket_circuits, Number(want.socket_circuits)],
    ["machine_circuits", result.totals.machine_circuits, Number(want.machine_circuits)],
    ["ac_circuits", result.totals.ac_circuits, Number(want.ac_circuits)],
    ["total_final_circuits", result.totals.total_final_circuits, Number(want.total_final_circuits)],
    ["db_design_ways_with_spare", result.totals.db_design_ways, Number(want.db_design_ways_with_spare)],
    ["recommended_db_ways", result.totals.recommended_db_ways ?? 0, Number(want.recommended_db_ways)],
    ["lighting_containment_m", result.totals.lighting_containment_m, Number(want.lighting_containment_m)],
    ["socket_containment_m", result.totals.socket_containment_m, Number(want.socket_containment_m)],
    ["total_containment_m", result.totals.total_containment_m, Number(want.total_containment_m)],
    ["20mm_conduit_3m_lengths", result.totals.conduit_lengths_3m, Number(want["20mm_conduit_3m_lengths"])],
    ["lighting_conductor_est_m", result.totals.lighting_conductor_est_m, Number(want.lighting_conductor_est_m)],
    ["socket_conductor_est_m", result.totals.socket_conductor_est_m, Number(want.socket_conductor_est_m)],
    ["conduit_couplers_est", result.totals.conduit_couplers_est, Number(want.conduit_couplers_est)],
    ["conduit_bends_est", result.totals.conduit_bends_est, Number(want.conduit_bends_est)],
    ["drawboxes_est", result.totals.drawboxes_est, Number(want.drawboxes_est)],
  ];

  const diffs = checks.filter(([, got, expectedValue]) => Math.abs(got - expectedValue) > 0.11);
  if (diffs.length) {
    failures += 1;
    console.log(`\n${want.template_id} ${want.template_name}`);
    for (const [label, got, expectedValue] of diffs) {
      console.log(`   ${label}: got ${got}, expected ${expectedValue}`);
    }
  }
}

console.log(
  failures === 0
    ? `\nAll ${expected.length} standard templates match the reference outputs.`
    : `\n${failures} of ${expected.length} templates differ.`,
);
process.exit(failures === 0 ? 0 : 1);
