/**
 * ESTIMO Quantity Estimating Engine V1 — types.
 *
 * The engine is deliberately free of framework and pricing concerns: it turns a
 * template, its spaces and the active rule set into points, circuits and material
 * quantities. Pricing is applied afterwards, by the caller.
 */

export type SpecLevel = "economy" | "standard" | "premium";

export type CalculationSource = "auto" | "template" | "user_override";

export type PointType = "lighting" | "double_sockets" | "fans" | "ac" | "tv" | "data" | "switches";

export interface GlobalParameterRow {
  key: string;
  value: number;
  unit: string;
  description: string;
}

export interface RoomRuleRow {
  room_type: string;
  spec_level: SpecLevel;
  lighting_area_per_point_m2: number | null;
  minimum_lighting_points: number;
  socket_spacing_perimeter_m: number | null;
  minimum_double_sockets: number;
  fan_points_default: number;
  ac_default: "yes" | "optional" | "no";
  tv_points_default: number;
  data_points_default: number;
  notes: string;
}

export interface StructureTemplateRow {
  template_id: string;
  project_type: string;
  template_name: string;
  size_class: "compact" | "standard" | "large";
  description: string;
}

export interface TemplateSpaceRow {
  template_id: string;
  space_no: number;
  space_name: string;
  room_type: string;
  length_m: number;
  width_m: number;
  height_m: number;
  quantity: number;
  workstations: number;
  checkout_counters: number;
  machine_count: number;
  notes: string;
}

export interface CircuitRuleRow {
  circuit_type: string;
  project_context: string;
  limit_value: number;
  limit_basis: string;
  nominal_cable_family: string;
  notes: string;
}

export interface SpecialLoadRow {
  load_key: string;
  space_context: string;
  selection_mode: string;
  default_enabled: boolean;
  circuit_policy: string;
  notes: string;
}

export interface AssemblyRow {
  assembly_key: string;
  name: string;
  assembly_type: string;
  description: string;
}

export interface AssemblyItemRow {
  assembly_key: string;
  material_key: string;
  quantity: number | null;
  unit: string;
  quantity_mode: "fixed" | "route_driven";
}

/** A space as the user sees it: template defaults, editable inline. */
export interface SpaceInput {
  id: string;
  space_name: string;
  room_type: string;
  length_m: number;
  width_m: number;
  height_m: number;
  quantity?: number;
  workstations?: number;
  checkout_counters?: number;
  machine_count?: number;
}

export interface PointOverride {
  space_id: string;
  point_type: PointType;
  value: number;
  source: CalculationSource;
}

export interface SpaceEstimate {
  space_id: string;
  space_name: string;
  room_type: string;
  area_m2: number;
  perimeter_m: number;
  lighting_points: number;
  double_sockets: number;
  fan_points: number;
  ac_points: number;
  tv_points: number;
  data_points: number;
  switch_positions: number;
  lighting_containment_raw_m: number;
  socket_containment_raw_m: number;
  machine_count: number;
  overridden: PointType[];
}

export interface CircuitSummary {
  type: "lighting" | "general_sockets" | "ac" | "machine" | "dedicated";
  points: number;
  limit: number;
  circuits: number;
  cableFamily: string;
}

export interface DbSelection {
  finalCircuits: number;
  designWays: number;
  recommendedWays: number | null;
  engineered: boolean;
}

export interface ProjectTotals {
  floor_area_m2: number;
  lighting_points: number;
  double_sockets: number;
  fan_points: number;
  ac_points: number;
  tv_points: number;
  data_points: number;
  switch_positions: number;
  machine_count: number;
  lighting_circuits: number;
  socket_circuits: number;
  ac_circuits: number;
  machine_circuits: number;
  dedicated_circuits: number;
  total_final_circuits: number;
  recommended_db_ways: number | null;
  db_design_ways: number;
  lighting_containment_m: number;
  socket_containment_m: number;
  total_containment_m: number;
  conduit_lengths_3m: number;
  lighting_conductor_est_m: number;
  socket_conductor_est_m: number;
  conduit_couplers_est: number;
  conduit_bends_est: number;
  drawboxes_est: number;
}

export interface MaterialQuantity {
  material_key: string;
  name: string;
  unit: string;
  engineering_quantity: number;
  purchase_quantity: number;
  pack_size: number | null;
  trace: string[];
  confidence: "high" | "medium" | "estimated";
}

export interface EngineResult {
  ruleSet: string;
  templateId: string | null;
  projectType: string;
  specLevel: SpecLevel;
  spaces: SpaceEstimate[];
  circuits: CircuitSummary[];
  db: DbSelection;
  totals: ProjectTotals;
  materialQuantities: MaterialQuantity[];
  specialLoads: string[];
  /** V1.2: where DB1 sits, and whether a sub-DB is advised. */
  dbLocation?: { dbKey: string; spaceName: string; locationLabel: string; routeMethod: string } | null;
  multiDb?: { recommended: boolean; suggestedCount: number; triggers: string[] };
  warnings: string[];
}

export interface CalculateRequest {
  projectType?: string;
  templateId?: string | null;
  specLevel: SpecLevel;
  spaces: SpaceInput[];
  overrides?: PointOverride[];
  specialLoads?: string[];
  ruleSet?: string;
}
