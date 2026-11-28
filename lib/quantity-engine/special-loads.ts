/**
 * ESTIMO special loads: schema, sizing and material expansion.
 *
 * The pipeline is the one the handoff describes:
 *
 *   selected load → configurator → instance → circuit → route → assembly
 *   → material quantities → pricing → project total
 *
 * A special load is described here once: the fields a technician fills in, the presets
 * that make the common sizes one click, and the policy that decides which materials the
 * circuit brings with it. The configurator renders those definitions, so a new load is a
 * data entry rather than a new form component.
 *
 * This module never prices anything. It turns a configured load into material
 * quantities; pricing stays in catalogue.ts and the total stays the sum of priced
 * materials, so a special load can never invent money on its own.
 */

import type { EngineResult, MaterialQuantity, PointOverride, SpaceInput } from "./types";

export type Phase = "single" | "three";
export type InstallationMethod = "conduit" | "trunking" | "surface" | "concealed";
export type RcdRequirement = "unknown" | "required" | "not_required";
export type RouteSource = "AUTO" | "USER_OVERRIDE";

/**
 * Where the circuit figures came from. This is the confidence label the UI shows and the
 * reason the estimate says "provisional" rather than pretending to be final.
 */
export type SizingSource = "ESTIMO_PROVISIONAL" | "MANUFACTURER" | "USER_OVERRIDE";

export type ConfigurationStatus = "NOT_CONFIGURED" | "PROVISIONAL" | "VERIFIED" | "OVERRIDDEN";

export const STATUS_LABEL: Record<ConfigurationStatus, string> = {
  NOT_CONFIGURED: "Configuration required",
  PROVISIONAL: "Estimated",
  VERIFIED: "Verified",
  OVERRIDDEN: "User override",
};

export type SpecialLoadFieldKey =
  | "quantity"
  | "rated_power_kw"
  | "rated_current_a"
  | "capacity_hp"
  | "supply_voltage_v"
  | "phase"
  | "serving_db_id"
  | "target_space_id"
  | "route_length_m"
  | "installation_method"
  | "local_isolator_required"
  | "dedicated_circuit"
  | "manufacturer_cable_size_mm2"
  | "manufacturer_breaker_rating_a"
  | "manufacturer_rcd_requirement"
  | "manufacturer_notes"
  | "user_notes";

/** Everything the configurator can set on one load. */
export interface SpecialLoadValues {
  quantity: number;
  rated_power_kw: number | null;
  rated_current_a: number | null;
  capacity_hp: number | null;
  supply_voltage_v: number | null;
  phase: Phase | null;
  serving_db_id: string | null;
  /** The space the circuit feeds, when the plan knows it. */
  target_space_id: string | null;
  route_length_m: number | null;
  route_source: RouteSource;
  /** True when one line covers many rooms and its route is their average, not one space's. */
  route_aggregate?: boolean;
  installation_method: InstallationMethod | null;
  local_isolator_required: boolean | null;
  /** False when the appliance shares an existing circuit instead of getting its own. */
  dedicated_circuit: boolean | null;
  manufacturer_cable_size_mm2: number | null;
  manufacturer_breaker_rating_a: number | null;
  manufacturer_rcd_requirement: RcdRequirement | null;
  manufacturer_notes: string;
  user_notes: string;
  sizing_source: SizingSource;
}

/** One configured (or half-configured) special load in a project. */
export interface SpecialLoadInstance extends SpecialLoadValues {
  /** Stable id so a load can be edited, removed and re-priced without collisions. */
  id: string;
  load_key: string;
  preset_code: string | null;
}

export type SpecialLoadFieldKind = "number" | "select" | "boolean" | "text" | "textarea";

/** Lists the UI resolves at render time, because they depend on the project. */
export type SpecialLoadOptionsFrom = "boards" | "spaces" | "cable_sizes" | "breaker_ratings";

export interface SpecialLoadFieldOption {
  value: string;
  label: string;
}

export interface SpecialLoadField {
  key: SpecialLoadFieldKey;
  label: string;
  kind: SpecialLoadFieldKind;
  group: "load" | "route" | "manufacturer" | "notes";
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: SpecialLoadFieldOption[];
  optionsFrom?: SpecialLoadOptionsFrom;
  placeholder?: string;
  help?: string;
}

export interface SpecialLoadPreset {
  code: string;
  name: string;
  values: Partial<SpecialLoadValues>;
}

export interface SpecialLoadDefinition {
  key: string;
  name: string;
  /** One line under the title in the configurator. */
  tagline: string;
  spaceContext: string;
  /** Power factor used when only a power rating is known. */
  powerFactor: number;
  /** Motors draw a starting current, so the protective device gets a margin. */
  motorLoad: boolean;
  /** What ESTIMO adds at the load end of the circuit. */
  outlet: "socket" | "fcu" | "cooker" | "none";
  /** Circuit protection at the board. */
  protection: "mcb" | "none";
  /** Poles the breaker switches: a compound charger needs its own double-pole device. */
  protectivePoles?: "sp" | "dp";
  /** RCD/RCBO policy when the manufacturer has not said otherwise. */
  rcd: RcdRequirement;
  /** Local isolator policy. */
  isolator: "always" | "optional" | "never";
  /** Containment family for the run from the board. */
  containment: "conduit" | "trunking";
  /** The smallest cable the trade would run for this load, whatever the sums say. */
  minimumCableSizeMm2?: number;
  /** Used when the person has not supplied a power rating, per the rulebook defaults. */
  fallbackPowerKw: number;
  /** Used for air conditioners, which are normally specified in HP. */
  fallbackCapacityHp?: number;
  required: SpecialLoadFieldKey[];
  fields: SpecialLoadField[];
  presets: SpecialLoadPreset[];
  /** Why the figures stay provisional until the manufacturer's data arrives. */
  provisionalNote: string;
}

/** Standard protective-device ratings ESTIMO stocks. */
export const BREAKER_RATINGS = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100];

/** Copper conductor sizes, in mm², that ESTIMO can price. */
export const CABLE_SIZES = [1.5, 2.5, 4, 6, 10, 16, 25, 35];

/**
 * Tabulated current-carrying capacity for single-core copper in conduit on a wall,
 * in amps, at 30 °C with no grouping. Method factors below derate for the way the cable
 * is actually installed, so the same table can serve every method ESTIMO offers.
 */
export const CABLE_CAPACITY_A: Record<number, number> = {
  1.5: 17.5,
  2.5: 24,
  4: 32,
  6: 41,
  10: 57,
  16: 76,
  25: 101,
  35: 125,
};

const METHOD_FACTOR: Record<InstallationMethod, number> = {
  conduit: 0.8,
  concealed: 0.8,
  trunking: 0.9,
  surface: 1,
};

/** Input-power allowance for an air conditioner sold by cooling capacity. */
const AC_KW_PER_HP = 0.9;

/**
 * Kit round-ups, in the same spirit as the quantity engine's pack sizes: conduit is
 * bought in 3 m lengths and cable in 100 m rolls, so unrounded metres would understate
 * what a technician actually buys.
 */
const PACK_SIZES: Record<string, number> = {
  conduit: 3,
  trunking: 3,
  cable: 100,
  cpc: 100,
};

export const DB_SIZES = [4, 6, 8, 12, 18, 24];

const PHASE_OPTIONS: SpecialLoadFieldOption[] = [
  { value: "single", label: "Single-phase (230 V)" },
  { value: "three", label: "Three-phase (400 V)" },
];

const METHOD_OPTIONS: SpecialLoadFieldOption[] = [
  { value: "conduit", label: "In conduit" },
  { value: "trunking", label: "In trunking" },
  { value: "surface", label: "Clipped to the surface" },
  { value: "concealed", label: "Concealed in the wall" },
];

const RCD_OPTIONS: SpecialLoadFieldOption[] = [
  { value: "unknown", label: "Not known yet" },
  { value: "required", label: "Manufacturer requires RCD protection" },
  { value: "not_required", label: "Manufacturer does not require an RCD" },
];

const YES_NO_OPTIONS: SpecialLoadFieldOption[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

const cableSizeOptions: SpecialLoadFieldOption[] = CABLE_SIZES.map((size) => ({
  value: String(size),
  label: `${size} mm²`,
}));

const breakerOptions: SpecialLoadFieldOption[] = BREAKER_RATINGS.map((rating) => ({
  value: String(rating),
  label: `${rating} A`,
}));

const field = {
  quantity(help = "How many of these the building has. Each one gets its own circuit."): SpecialLoadField {
    return { key: "quantity", label: "Quantity", kind: "number", group: "load", min: 1, max: 50, step: 1, help };
  },
  power(label = "Rated power", help = "The rating on the appliance plate."): SpecialLoadField {
    return { key: "rated_power_kw", label, kind: "number", group: "load", unit: "kW", min: 0.05, max: 500, step: 0.05, help };
  },
  current(help = "Fill this in when the plate gives amps instead of a power rating."): SpecialLoadField {
    return { key: "rated_current_a", label: "Rated current", kind: "number", group: "load", unit: "A", min: 0.1, max: 800, step: 0.1, help };
  },
  capacityHp(label = "Cooling capacity"): SpecialLoadField {
    return {
      key: "capacity_hp",
      label,
      kind: "number",
      group: "load",
      unit: "HP",
      min: 0.5,
      max: 50,
      step: 0.5,
      help: "Air conditioners are usually sold in HP; ESTIMO converts it to kilowatts.",
    };
  },
  voltage(): SpecialLoadField {
    return {
      key: "supply_voltage_v",
      label: "Supply voltage",
      kind: "number",
      group: "load",
      unit: "V",
      min: 100,
      max: 500,
      step: 5,
      help: "Defaults to 230 V single-phase or 400 V three-phase.",
    };
  },
  phase(): SpecialLoadField {
    return { key: "phase", label: "Supply", kind: "select", group: "load", options: PHASE_OPTIONS };
  },
  space(): SpecialLoadField {
    return {
      key: "target_space_id",
      label: "Space it serves",
      kind: "select",
      group: "route",
      optionsFrom: "spaces",
      help: "Picks the ESTIMO distance to that space. Type over it when the real run differs.",
    };
  },
  board(): SpecialLoadField {
    return {
      key: "serving_db_id",
      label: "Served from",
      kind: "select",
      group: "load",
      optionsFrom: "boards",
      help: "The board the circuit leaves from. The route is measured from here.",
    };
  },
  route(): SpecialLoadField {
    return {
      key: "route_length_m",
      label: "Distance from board",
      kind: "number",
      group: "route",
      unit: "m",
      min: 0.5,
      max: 400,
      step: 0.5,
      help: "Leave blank to use the ESTIMO route for the space.",
    };
  },
  method(): SpecialLoadField {
    return { key: "installation_method", label: "Installation method", kind: "select", group: "route", options: METHOD_OPTIONS };
  },
  dedicated(): SpecialLoadField {
    return {
      key: "dedicated_circuit",
      label: "Own circuit",
      kind: "select",
      group: "load",
      options: [
        { value: "yes", label: "Yes, a dedicated circuit" },
        { value: "no", label: "No, shares an existing circuit" },
      ],
      help: "A shared supply still gets its outlet and run, but no breaker or isolator of its own.",
    };
  },
  isolator(): SpecialLoadField {
    return { key: "local_isolator_required", label: "Local isolator required", kind: "select", group: "manufacturer", options: YES_NO_OPTIONS };
  },
  cableSize(): SpecialLoadField {
    return {
      key: "manufacturer_cable_size_mm2",
      label: "Manufacturer cable size",
      kind: "select",
      group: "manufacturer",
      options: cableSizeOptions,
      placeholder: "Not stated",
      help: "From the installation manual. It takes priority over ESTIMO's sizing.",
    };
  },
  breaker(): SpecialLoadField {
    return {
      key: "manufacturer_breaker_rating_a",
      label: "Manufacturer breaker rating",
      kind: "select",
      group: "manufacturer",
      options: breakerOptions,
      placeholder: "Not stated",
      help: "From the installation manual. It takes priority over ESTIMO's sizing.",
    };
  },
  rcd(): SpecialLoadField {
    return { key: "manufacturer_rcd_requirement", label: "Manufacturer RCD requirement", kind: "select", group: "manufacturer", options: RCD_OPTIONS };
  },
  manufacturerNotes(placeholder = "Model, manual reference, anything the manufacturer insists on."): SpecialLoadField {
    return { key: "manufacturer_notes", label: "Manufacturer notes", kind: "textarea", group: "notes", placeholder };
  },
  userNotes(placeholder = "Site conditions, access, anything the next person should know."): SpecialLoadField {
    return { key: "user_notes", label: "Site notes", kind: "textarea", group: "notes", placeholder };
  },
};

const CUSTOM_PRESET: SpecialLoadPreset[] = [{ code: "CUSTOM", name: "Custom", values: {} }];

/** The fields every load shares: what it draws, where it sits and what it hangs off. */
function circuitFields(options: { dedicated?: boolean } = {}): SpecialLoadField[] {
  return [
    field.quantity(),
    field.power(),
    field.current(),
    field.voltage(),
    field.phase(),
    field.board(),
    field.space(),
    field.route(),
    field.method(),
    ...(options.dedicated ? [field.dedicated()] : []),
    field.isolator(),
    field.cableSize(),
    field.breaker(),
    field.manufacturerNotes(),
    field.userNotes(),
  ];
}

export const SPECIAL_LOAD_DEFINITIONS: SpecialLoadDefinition[] = [
  {
    key: "refrigerator",
    name: "Fridge",
    tagline: "A plug-in appliance: outlet, run and connection.",
    spaceContext: "kitchen",
    powerFactor: 1,
    motorLoad: false,
    outlet: "socket",
    protection: "none",
    rcd: "unknown",
    isolator: "never",
    containment: "conduit",
    fallbackPowerKw: 0.5,
    required: ["quantity", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote: "Fridges usually share the kitchen socket circuit. Confirm whether the kitchen design gives it a dedicated circuit.",
  },
  {
    key: "freezer",
    name: "Freezer",
    tagline: "Standalone freezer, on a plug or on its own circuit.",
    spaceContext: "kitchen_or_shop",
    powerFactor: 1,
    motorLoad: false,
    outlet: "socket",
    protection: "mcb",
    rcd: "unknown",
    isolator: "never",
    containment: "conduit",
    fallbackPowerKw: 0.8,
    required: ["quantity", "phase"],
    fields: circuitFields({ dedicated: true }),
    presets: [
      { code: "PLUG_IN", name: "Standard plug-in freezer", values: { phase: "single", dedicated_circuit: false } },
      { code: "DEDICATED", name: "Dedicated freezer supply", values: { phase: "single", dedicated_circuit: true } },
      ...CUSTOM_PRESET,
    ],
    provisionalNote: "A plug-in freezer rarely needs its own breaker. Use the dedicated preset when the design gives it one.",
  },
  {
    key: "microwave",
    name: "Microwave",
    tagline: "A plug-in appliance on the kitchen ring or a local point.",
    spaceContext: "kitchen",
    powerFactor: 1,
    motorLoad: false,
    outlet: "socket",
    protection: "none",
    rcd: "unknown",
    isolator: "never",
    containment: "conduit",
    fallbackPowerKw: 1.5,
    required: ["quantity", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote: "Microwaves normally share the kitchen socket circuit; the outlet and its run are still costed.",
  },
  {
    key: "electric_cooker",
    name: "Electric cooker",
    tagline: "Cooker control unit and outlet on a dedicated circuit.",
    spaceContext: "kitchen",
    powerFactor: 1,
    motorLoad: false,
    outlet: "cooker",
    protection: "mcb",
    rcd: "unknown",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 7,
    required: ["quantity", "rated_power_kw", "phase"],
    fields: circuitFields(),
    presets: [
      { code: "COOKER_4_8", name: "4.8 kW", values: { rated_power_kw: 4.8, phase: "single" } },
      { code: "COOKER_6", name: "6 kW", values: { rated_power_kw: 6, phase: "single" } },
      { code: "COOKER_7_2", name: "7.2 kW", values: { rated_power_kw: 7.2, phase: "single" } },
      ...CUSTOM_PRESET,
    ],
    provisionalNote:
      "Cooker circuits are load-designed. ESTIMO's sizing is a provisional allowance until the cooker rating and the manufacturer's instructions are confirmed.",
  },
  {
    key: "dishwasher",
    name: "Dishwasher",
    tagline: "Dedicated appliance point with its own protection.",
    spaceContext: "kitchen",
    powerFactor: 1,
    motorLoad: false,
    outlet: "socket",
    protection: "mcb",
    rcd: "unknown",
    isolator: "optional",
    containment: "conduit",
    fallbackPowerKw: 2,
    required: ["quantity", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote: "Dishwashers are normally on a dedicated appliance circuit. Confirm the manufacturer's connection requirement.",
  },
  {
    key: "washing_machine",
    name: "Washing machine",
    tagline: "Dedicated appliance point, usually in the utility area.",
    spaceContext: "kitchen_or_utility",
    powerFactor: 1,
    motorLoad: false,
    outlet: "socket",
    protection: "mcb",
    rcd: "unknown",
    isolator: "optional",
    containment: "conduit",
    fallbackPowerKw: 2,
    required: ["quantity", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote: "The socket and its run are costed; the circuit protection follows the machine's rating.",
  },
  {
    key: "extractor",
    name: "Extractor",
    tagline: "Fused connection unit for an extractor fan.",
    spaceContext: "kitchen_or_bathroom",
    powerFactor: 1,
    motorLoad: false,
    outlet: "fcu",
    protection: "none",
    rcd: "unknown",
    isolator: "never",
    containment: "conduit",
    fallbackPowerKw: 0.3,
    required: ["quantity", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote: "Extractors are usually fed from the lighting circuit or a fused spur; the FCU and its run are costed.",
  },
  {
    key: "water_heater",
    name: "Water heater",
    tagline: "Dedicated heater circuit with a local double-pole isolator.",
    spaceContext: "bathroom",
    powerFactor: 1,
    motorLoad: false,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 3,
    required: ["quantity", "rated_power_kw", "phase"],
    fields: circuitFields(),
    presets: [
      { code: "WH_3KW", name: "3 kW", values: { rated_power_kw: 3, phase: "single", local_isolator_required: true } },
      { code: "WH_4_5KW", name: "4.5 kW", values: { rated_power_kw: 4.5, phase: "single", local_isolator_required: true } },
      { code: "WH_6KW", name: "6 kW", values: { rated_power_kw: 6, phase: "single", local_isolator_required: true } },
      ...CUSTOM_PRESET,
    ],
    provisionalNote:
      "ESTIMO sizes the heater circuit from its rating. Confirm the final cable and protective device against the heater's instructions, especially where the manufacturer calls for a 30 mA RCD.",
  },
  {
    key: "air_conditioner",
    name: "Air conditioner",
    minimumCableSizeMm2: 2.5,
    tagline: "Dedicated AC circuit with a local isolator.",
    spaceContext: "habitable_room",
    powerFactor: 0.9,
    motorLoad: true,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 1.35,
    fallbackCapacityHp: 1.5,
    required: ["quantity", "capacity_hp", "phase"],
    fields: [
      field.quantity(),
      field.capacityHp(),
      field.power("Rated input power", "The input power in kW, when the manual gives it. Leave blank to use the HP rating."),
      field.current(),
      field.voltage(),
      field.phase(),
      field.board(),
      field.space(),
      field.route(),
      field.method(),
      field.isolator(),
      field.cableSize(),
      field.breaker(),
      field.rcd(),
      field.manufacturerNotes("Outdoor unit model and the manufacturer's supply requirement."),
      field.userNotes(),
    ],
    presets: [
      { code: "AC_1HP", name: "1 HP", values: { capacity_hp: 1, phase: "single" } },
      { code: "AC_1_5HP", name: "1.5 HP", values: { capacity_hp: 1.5, phase: "single" } },
      { code: "AC_2HP", name: "2 HP", values: { capacity_hp: 2, phase: "single" } },
      { code: "AC_2_5HP", name: "2.5 HP", values: { capacity_hp: 2.5, phase: "single" } },
      ...CUSTOM_PRESET,
    ],
    provisionalNote:
      "ESTIMO's HP-to-kilowatt allowance is provisional. Confirm the input power, breaker and cable from the unit's manual before ordering.",
  },
  {
    key: "water_pump",
    name: "Water pump",
    minimumCableSizeMm2: 2.5,
    tagline: "Pump feeder, motor protection and a local isolator.",
    spaceContext: "building",
    powerFactor: 0.85,
    motorLoad: true,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 1.5,
    required: ["quantity", "rated_power_kw", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote:
      "Motor circuits need the pump's own data: starting method, overload and full-load current. ESTIMO's allowance is provisional.",
  },
  {
    key: "gate_motor",
    name: "Gate motor",
    tagline: "External feeder with an isolator at the gate.",
    spaceContext: "external",
    powerFactor: 0.85,
    motorLoad: true,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 0.75,
    required: ["quantity", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote:
      "The run to a gate is often long and buried; confirm the route, the burial depth and the manufacturer's cable.",
  },
  {
    key: "ev_charger",
    name: "EV charger",
    tagline: "Compound charger: load-sized circuit, protection and isolator.",
    spaceContext: "external",
    powerFactor: 1,
    motorLoad: false,
    outlet: "none",
    protection: "mcb",
    protectivePoles: "dp",
    rcd: "required",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 7.4,
    required: ["quantity", "rated_power_kw", "phase"],
    fields: circuitFields(),
    presets: [
      { code: "EV_3_6", name: "3.6 kW", values: { rated_power_kw: 3.6, phase: "single" } },
      { code: "EV_7_4", name: "7.4 kW", values: { rated_power_kw: 7.4, phase: "single" } },
      { code: "EV_11", name: "11 kW", values: { rated_power_kw: 11, phase: "three" } },
      { code: "EV_22", name: "22 kW", values: { rated_power_kw: 22, phase: "three" } },
      ...CUSTOM_PRESET,
    ],
    provisionalNote:
      "EV chargers need a load-designed circuit and a manufacturer-approved RCD. ESTIMO's provisional allowance must be confirmed against the charger's manual and the supply capacity.",
  },
  {
    key: "workshop_machine",
    name: "Workshop machine",
    minimumCableSizeMm2: 2.5,
    tagline: "Machine feeder with isolation and motor protection.",
    spaceContext: "workshop",
    powerFactor: 0.85,
    motorLoad: true,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 5,
    required: ["quantity", "rated_power_kw", "phase"],
    fields: circuitFields(),
    presets: [
      { code: "MACHINE_3", name: "3 kW", values: { rated_power_kw: 3, phase: "three" } },
      { code: "MACHINE_5_5", name: "5.5 kW", values: { rated_power_kw: 5.5, phase: "three" } },
      { code: "MACHINE_7_5", name: "7.5 kW", values: { rated_power_kw: 7.5, phase: "three" } },
      ...CUSTOM_PRESET,
    ],
    provisionalNote:
      "Machine circuits are engineered: the starter, overload and cable depend on the motor data. ESTIMO's figures are a provisional allowance.",
  },
  {
    key: "refrigeration_equipment",
    name: "Refrigeration plant",
    minimumCableSizeMm2: 2.5,
    tagline: "Dedicated refrigeration supply with isolation.",
    spaceContext: "shop_or_workshop",
    powerFactor: 0.9,
    motorLoad: true,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 3,
    required: ["quantity", "rated_power_kw", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote:
      "Refrigeration plant draws locked-rotor current on start. Confirm the manufacturer's circuit data before ordering.",
  },
  {
    key: "illuminated_sign",
    name: "Illuminated sign",
    tagline: "Signage supply: local FCU switch, 20 mm PVC & flexible conduit, outdoor junction box.",
    spaceContext: "external",
    powerFactor: 1,
    motorLoad: false,
    outlet: "fcu",
    protection: "mcb",
    rcd: "unknown",
    isolator: "never",
    containment: "conduit",
    fallbackPowerKw: 0.3,
    required: ["quantity", "phase"],
    fields: circuitFields(),
    presets: [
      { code: "SIGN_LED", name: "LED fascia / lightbox (0.3 kW)", values: { rated_power_kw: 0.3, phase: "single" } },
      { code: "SIGN_LARGE", name: "Large illuminated sign (1 kW)", values: { rated_power_kw: 1, phase: "single" } },
      ...CUSTOM_PRESET,
    ],
    provisionalNote:
      "Covers the electrical feed, containment, FCU switch and outdoor junction materials only (not the sign itself).",
  },
  {
    key: "pos_counter",
    name: "Counter & tills (POS)",
    minimumCableSizeMm2: 2.5,
    tagline: "POS, card machines and back-office: 2.5 mm² sockets, USB outlet, Cat6 data and trunking.",
    spaceContext: "shop_or_workshop",
    powerFactor: 1,
    motorLoad: false,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "never",
    containment: "conduit",
    fallbackPowerKw: 2.5,
    required: ["quantity", "phase"],
    fields: circuitFields(),
    presets: [
      { code: "POS_STANDARD", name: "Standard counter (2.5 kW)", values: { rated_power_kw: 2.5, phase: "single" } },
      { code: "POS_BUSY", name: "Busy checkout (3.5 kW)", values: { rated_power_kw: 3.5, phase: "single" } },
      ...CUSTOM_PRESET,
    ],
    provisionalNote:
      "Covers counter power, USB charging, Cat6 data outlets and PVC trunking (excludes POS and card terminal hardware).",
  },
];

const BY_KEY = new Map(SPECIAL_LOAD_DEFINITIONS.map((definition) => [definition.key, definition]));

/**
 * A load the schema does not describe yet still opens a usable form: quantity, power,
 * phase, board and route are enough for a provisional circuit.
 */
export function genericDefinition(key: string): SpecialLoadDefinition {
  const name = key.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());
  return {
    key,
    name,
    tagline: "Not yet described in the ESTIMO rulebook; enter what the plate says.",
    spaceContext: "building",
    powerFactor: 1,
    motorLoad: false,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "optional",
    containment: "conduit",
    fallbackPowerKw: 2,
    required: ["quantity", "rated_power_kw", "phase"],
    fields: circuitFields(),
    presets: CUSTOM_PRESET,
    provisionalNote:
      "This load has no ESTIMO assembly yet. The circuit is costed from its rating and route; confirm the materials by hand.",
  };
}

export function specialLoadDefinition(key: string): SpecialLoadDefinition {
  return BY_KEY.get(key) ?? genericDefinition(key);
}

/** The values a freshly selected load starts from. */
export function defaultSpecialLoadValues(): SpecialLoadValues {
  return {
    quantity: 1,
    rated_power_kw: null,
    rated_current_a: null,
    capacity_hp: null,
    supply_voltage_v: null,
    phase: "single",
    serving_db_id: "DB1",
    target_space_id: null,
    route_length_m: null,
    route_source: "AUTO",
    installation_method: "conduit",
    local_isolator_required: null,
    dedicated_circuit: null,
    manufacturer_cable_size_mm2: null,
    manufacturer_breaker_rating_a: null,
    manufacturer_rcd_requirement: "unknown",
    manufacturer_notes: "",
    user_notes: "",
    sizing_source: "ESTIMO_PROVISIONAL",
  };
}

let counter = 0;

/** A new instance for a load the person has just selected. */
export function newSpecialLoadInstance(loadKey: string, id?: string): SpecialLoadInstance {
  counter += 1;
  return {
    ...defaultSpecialLoadValues(),
    id: id ?? `load-${loadKey}-${Date.now().toString(36)}-${counter}`,
    load_key: loadKey,
    preset_code: null,
  };
}

/** Reads a stored instance, keeping only values ESTIMO understands. */
export function parseSpecialLoadInstance(value: unknown): SpecialLoadInstance | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.load_key !== "string" || !row.load_key) return null;

  const numberOrNull = (candidate: unknown) => {
    if (candidate === null || candidate === undefined || candidate === "") return null;
    const numeric = Number(candidate);
    return Number.isFinite(numeric) ? numeric : null;
  };
  const textOrEmpty = (candidate: unknown) => (typeof candidate === "string" ? candidate : "");

  const phase = row.phase === "three" ? "three" : row.phase === "single" ? "single" : null;
  const source =
    row.sizing_source === "MANUFACTURER" || row.sizing_source === "USER_OVERRIDE"
      ? row.sizing_source
      : "ESTIMO_PROVISIONAL";
  const method: InstallationMethod | null =
    row.installation_method === "trunking" ||
    row.installation_method === "surface" ||
    row.installation_method === "concealed" ||
    row.installation_method === "conduit"
      ? row.installation_method
      : null;

  return {
    id: typeof row.id === "string" && row.id ? row.id : `load-${row.load_key}-${Math.random().toString(36).slice(2, 8)}`,
    load_key: row.load_key,
    preset_code: typeof row.preset_code === "string" ? row.preset_code : null,
    quantity: Math.max(1, Math.round(numberOrNull(row.quantity) ?? 1)),
    rated_power_kw: numberOrNull(row.rated_power_kw),
    rated_current_a: numberOrNull(row.rated_current_a),
    capacity_hp: numberOrNull(row.capacity_hp),
    supply_voltage_v: numberOrNull(row.supply_voltage_v),
    phase,
    serving_db_id: typeof row.serving_db_id === "string" ? row.serving_db_id : null,
    target_space_id: typeof row.target_space_id === "string" ? row.target_space_id : null,
    route_length_m: numberOrNull(row.route_length_m),
    route_source: row.route_source === "USER_OVERRIDE" ? "USER_OVERRIDE" : "AUTO",
    route_aggregate: row.route_aggregate === true,
    installation_method: method,
    local_isolator_required:
      typeof row.local_isolator_required === "boolean" ? row.local_isolator_required : null,
    dedicated_circuit: typeof row.dedicated_circuit === "boolean" ? row.dedicated_circuit : null,
    manufacturer_cable_size_mm2: numberOrNull(row.manufacturer_cable_size_mm2),
    manufacturer_breaker_rating_a: numberOrNull(row.manufacturer_breaker_rating_a),
    manufacturer_rcd_requirement:
      row.manufacturer_rcd_requirement === "required" || row.manufacturer_rcd_requirement === "not_required"
        ? row.manufacturer_rcd_requirement
        : "unknown",
    manufacturer_notes: textOrEmpty(row.manufacturer_notes),
    user_notes: textOrEmpty(row.user_notes),
    sizing_source: source,
  };
}

export function parseSpecialLoadInstances(value: unknown): SpecialLoadInstance[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((row) => parseSpecialLoadInstance(row))
    .filter((row): row is SpecialLoadInstance => Boolean(row));
}

/** The required fields a person still has to fill in. */
export function missingRequirements(instance: SpecialLoadInstance): SpecialLoadFieldKey[] {
  const definition = specialLoadDefinition(instance.load_key);
  const missing: SpecialLoadFieldKey[] = [];

  for (const key of definition.required) {
    // a load with no units cannot be priced, whatever else is filled in
    if (key === "quantity" && !(instance.quantity >= 1)) {
      missing.push(key);
      continue;
    }
    if (key === "rated_power_kw") {
      // either a power rating or a current reading makes the circuit workable
      if (instance.rated_power_kw === null && instance.rated_current_a === null && instance.capacity_hp === null) {
        missing.push(key);
      }
      continue;
    }
    const value = instance[key];
    if (value === null || value === undefined || value === "") missing.push(key);
  }

  return missing;
}

export function isConfigured(instance: SpecialLoadInstance): boolean {
  return missingRequirements(instance).length === 0;
}

/** The confidence label the chip and the estimate show. */
export function configurationStatus(instance: SpecialLoadInstance): ConfigurationStatus {
  if (!isConfigured(instance)) return "NOT_CONFIGURED";
  // manufacturer figures for the whole circuit beat any judgement call about the source
  if (instance.manufacturer_breaker_rating_a !== null && instance.manufacturer_cable_size_mm2 !== null) {
    return "VERIFIED";
  }
  if (instance.sizing_source === "MANUFACTURER") return "VERIFIED";
  if (instance.sizing_source === "USER_OVERRIDE") return "OVERRIDDEN";
  return "PROVISIONAL";
}

export interface SpecialLoadSizing {
  /** Current the load draws, before any margin. */
  loadCurrentA: number;
  /** Current the circuit is designed for, including the motor margin. */
  designCurrentA: number;
  protectiveDeviceA: number;
  cableSizeMm2: number;
  cpcSizeMm2: number;
  containmentMm: number;
  rcdRequired: boolean;
  isolatorRatingA: number | null;
  /** kW used for the calculation, and whether ESTIMO had to assume it. */
  powerKw: number;
  assumedPower: boolean;
  basis: string[];
}

function nextBreakerRating(currentA: number): number {
  return BREAKER_RATINGS.find((rating) => rating >= currentA) ?? BREAKER_RATINGS[BREAKER_RATINGS.length - 1];
}

function cableFor(breakerA: number, method: InstallationMethod): number {
  const factor = METHOD_FACTOR[method];
  const needed = breakerA / factor;
  const size = CABLE_SIZES.find((candidate) => (CABLE_CAPACITY_A[candidate] ?? 0) >= needed);
  return size ?? CABLE_SIZES[CABLE_SIZES.length - 1];
}

function cpcFor(size: number): number {
  // same size up to 16 mm², then a 16 mm² protective conductor is the usual allowance
  return size <= 16 ? size : 16;
}

/** Works out the circuit a load implies, and says on what basis. */
export function sizeSpecialLoad(instance: SpecialLoadInstance): SpecialLoadSizing {
  const definition = specialLoadDefinition(instance.load_key);
  const phase: Phase = instance.phase ?? "single";
  const voltage = instance.supply_voltage_v ?? (phase === "three" ? 400 : 230);
  const method: InstallationMethod = instance.installation_method ?? "conduit";

  const hpPower = instance.capacity_hp ? instance.capacity_hp * AC_KW_PER_HP : null;
  const statedPower = instance.rated_power_kw ?? hpPower;
  const powerKw = statedPower ?? definition.fallbackPowerKw;
  const assumedPower = statedPower === null;

  const derivedCurrent =
    powerKw <= 0
      ? 0
      : (powerKw * 1000) / ((phase === "three" ? Math.sqrt(3) : 1) * voltage * definition.powerFactor);
  const loadCurrentA = instance.rated_current_a ?? derivedCurrent;
  const designCurrentA = loadCurrentA * (definition.motorLoad ? 1.25 : 1);

  const fromManufacturer = instance.manufacturer_breaker_rating_a;
  const rawDevice = fromManufacturer ?? nextBreakerRating(designCurrentA);
  // 63 A is the largest single-circuit device the catalogue prices; beyond it the
  // circuit needs an engineered protective device, which the basis says.
  const protectiveDeviceA = Math.min(63, rawDevice);
  // what the trade would run for this load, even when the sums allow something smaller
  const minimumCable = definition.minimumCableSizeMm2 ?? 0;
  const cableSizeMm2 =
    instance.manufacturer_cable_size_mm2 ?? Math.max(cableFor(protectiveDeviceA, method), minimumCable);
  const cpcSizeMm2 = cpcFor(cableSizeMm2);
  const containmentMm = cableSizeMm2 <= 4 ? 20 : cableSizeMm2 <= 10 ? 25 : 32;

  const rcdRequired =
    instance.manufacturer_rcd_requirement === "required"
      ? true
      : instance.manufacturer_rcd_requirement === "not_required"
        ? false
        : definition.rcd === "required";

  const wantsIsolator =
    instance.local_isolator_required === true
      ? true
      : instance.local_isolator_required === false
        ? false
        : definition.isolator === "always";

  const basis: string[] = [];
  if (assumedPower) {
    basis.push(`No rating entered: the rulebook figure of ${powerKw} kW is assumed.`);
  } else if (instance.rated_power_kw === null) {
    basis.push(`${instance.capacity_hp} HP converted to about ${Math.round(powerKw * 100) / 100} kW input.`);
  }
  basis.push(
    `${Math.round(loadCurrentA * 10) / 10} A at ${voltage} V ${phase === "three" ? "three-phase" : "single-phase"}` +
      (definition.motorLoad ? `, with a 1.25 motor margin (${Math.round(designCurrentA * 10) / 10} A).` : "."),
  );
  basis.push(
    fromManufacturer
      ? `Protective device taken from the manufacturer at ${protectiveDeviceA} A.`
      : `${protectiveDeviceA} A device chosen from the standard ratings.`,
  );
  if (rawDevice > protectiveDeviceA) {
    basis.push(
      `${rawDevice} A is beyond the largest stocked single-circuit device; the circuit needs an engineered protective device.`,
    );
  }
  basis.push(
    instance.manufacturer_cable_size_mm2
      ? `Cable size taken from the manufacturer at ${cableSizeMm2} mm².`
      : minimumCable > 0 && cableSizeMm2 === minimumCable
        ? `${cableSizeMm2} mm² is the smallest cable ${definition.name.toLowerCase()} circuits are run in, and it carries ${protectiveDeviceA} A when ${method}.`
        : `${cableSizeMm2} mm² copper carries ${protectiveDeviceA} A when ${method}.`,
  );

  return {
    loadCurrentA: Math.round(loadCurrentA * 10) / 10,
    designCurrentA: Math.round(designCurrentA * 10) / 10,
    protectiveDeviceA,
    cableSizeMm2,
    cpcSizeMm2,
    containmentMm,
    rcdRequired,
    isolatorRatingA: wantsIsolator ? (protectiveDeviceA <= 32 ? 32 : 63) : null,
    powerKw: Math.round(powerKw * 100) / 100,
    assumedPower,
    basis,
  };
}

/** The route length the circuit uses: what the person typed, or the ESTIMO distance. */
export function routeLengthFor(instance: SpecialLoadInstance, defaultRouteM: number): number {
  if (instance.route_source === "USER_OVERRIDE" && instance.route_length_m !== null) {
    return instance.route_length_m;
  }
  return instance.route_length_m ?? defaultRouteM;
}

function sizeKey(size: number): string {
  return String(size).replace(".", "p");
}

function cableMaterial(kind: "phase" | "neutral" | "cpc", size: number, quantity: number, basis: string): MaterialQuantity {
  const label =
    kind === "cpc"
      ? `${size} mm² protective conductor`
      : `${size} mm² ${kind === "phase" ? "phase" : "neutral"} conductor`;
  return material(`special_${kind}_${sizeKey(size)}`, label, "m", quantity, "cable", basis, "estimated");
}

function material(
  key: string,
  name: string,
  unit: string,
  engineering: number,
  packFamily: keyof typeof PACK_SIZES | null,
  basis: string,
  confidence: MaterialQuantity["confidence"],
): MaterialQuantity {
  const pack = packFamily ? (PACK_SIZES[packFamily] ?? null) : null;
  return {
    material_key: key,
    name,
    unit,
    engineering_quantity: Math.round(engineering * 10) / 10,
    purchase_quantity: pack ? Math.ceil(engineering / pack) * pack : Math.ceil(engineering),
    pack_size: pack,
    trace: [basis],
    confidence,
  };
}

export interface SpecialLoadMaterialOptions {
  /** Waste allowances, from the project's global parameters. */
  cableWastePct?: number;
  containmentWastePct?: number;
  /** Rate of conduit accessories per metre, as the quantity engine uses. */
  couplerPerM?: number;
  bendPerM?: number;
  drawBoxPerM?: number;
}

/**
 * Expands a configured load into the materials its circuit needs. Every quantity is for
 * the whole instance, that is, multiplied by the quantity the person entered.
 *
 * A load that is not configured returns nothing: an unconfigured load never quietly
 * contributes zero to the total, it is reported instead.
 */
export function specialLoadMaterials(
  instance: SpecialLoadInstance,
  defaultRouteM: number,
  options: SpecialLoadMaterialOptions = {},
): MaterialQuantity[] {
  if (!isConfigured(instance)) return [];

  const definition = specialLoadDefinition(instance.load_key);
  const sizing = sizeSpecialLoad(instance);
  const units = Math.round(instance.quantity);
  if (units < 1) return [];
  const perUnitRoute = routeLengthFor(instance, defaultRouteM);
  const cableWaste = 1 + (options.cableWastePct ?? 7.5) / 100;
  const containmentWaste = 1 + (options.containmentWastePct ?? 10) / 100;
  const couplers = options.couplerPerM ?? 0.3;
  const bends = options.bendPerM ?? 1 / 6;
  const drawBoxes = options.drawBoxPerM ?? 1 / 9;

  const rows: MaterialQuantity[] = [];
  const add = (row: MaterialQuantity) => rows.push(row);

  const basisRoute = `${perUnitRoute} m route from ${instance.serving_db_id ?? "the board"}`;
  // a shared supply gets its outlet and its run, but no board device of its own
  const dedicated = instance.dedicated_circuit !== false;

  // protection and control
  if (definition.protection === "mcb" && dedicated) {
    const word = instance.phase === "three" ? "tp" : definition.protectivePoles === "dp" ? "dp" : "sp";
    const poles =
      instance.phase === "three" ? "triple-pole" : definition.protectivePoles === "dp" ? "double-pole" : "single-pole";
    add(
      material(
        `mcb_${word}_${sizing.protectiveDeviceA}`,
        `${sizing.protectiveDeviceA} A ${poles} MCB`,
        "each",
        units,
        null,
        `${definition.name} protective device per circuit`,
        "medium",
      ),
    );
  }

  if (sizing.rcdRequired && dedicated) {
    const word = instance.phase === "three" ? "4p" : "2p";
    add(
      material(
        `rccb_${word}_30ma`,
        `${instance.phase === "three" ? "Four-pole" : "Two-pole"} 30 mA RCD`,
        "each",
        units,
        null,
        "30 mA RCD protection for the circuit",
        "medium",
      ),
    );
  }

  if (sizing.isolatorRatingA && dedicated) {
    const word = instance.phase === "three" ? "tpn" : "dp";
    add(
      material(
        `isolator_${word}_${sizing.isolatorRatingA}`,
        `${sizing.isolatorRatingA} A ${instance.phase === "three" ? "four-pole" : "double-pole"} isolator`,
        "each",
        units,
        null,
        "Local isolation at the load",
        "medium",
      ),
    );
  }

  // the load end
  if (definition.outlet === "socket") {
    add(material("socket_13a_double", "Double 13A socket outlet", "each", units, null, "Appliance outlet", "high"));
    add(material("socket_box_2g", "2-gang socket mounting box", "each", units, null, "Outlet box", "high"));
  } else if (definition.outlet === "fcu") {
    add(material("fcu_13a", "13A fused connection unit", "each", units, null, "Fused spur for the fan", "high"));
  } else if (definition.outlet === "cooker") {
    add(material("cooker_switch_45a", "45A double-pole cooker switch", "each", units, null, "Cooker control unit", "medium"));
    add(material("cooker_outlet", "45A cooker connection outlet", "each", units, null, "Cooker outlet at the appliance", "medium"));
  }

  // conductors: the run itself, plus a little for terminations at each end
  const runPerUnit = (perUnitRoute + 1.5) * cableWaste;
  const phaseRuns = instance.phase === "three" ? 3 : 1;
  add(cableMaterial("phase", sizing.cableSizeMm2, runPerUnit * phaseRuns * units, `${basisRoute}; ${phaseRuns === 3 ? "three phase" : "phase"} conductor`));
  add(cableMaterial("neutral", sizing.cableSizeMm2, runPerUnit * units, `${basisRoute}; neutral`));
  add(cableMaterial("cpc", sizing.cpcSizeMm2, runPerUnit * units, `${basisRoute}; protective conductor`));

  // containment: the person's installation method wins over the load's default family
  const containmentFamily =
    instance.installation_method === "trunking" ? "trunking" : definition.containment;
  if (containmentFamily === "trunking") {
    const trunking = sizing.cableSizeMm2 <= 6 ? "trunking_38x25" : "trunking_50x50";
    add(
      material(
        trunking,
        sizing.cableSizeMm2 <= 6 ? "38x25 mm PVC trunking" : "50x50 mm PVC trunking",
        "m",
        perUnitRoute * containmentWaste * units,
        "trunking",
        `${perUnitRoute} m of trunking from the board`,
        "estimated",
      ),
    );
  } else {
    add(
      material(
        `conduit_${sizing.containmentMm}`,
        `${sizing.containmentMm} mm PVC conduit`,
        "m",
        perUnitRoute * containmentWaste * units,
        "conduit",
        `${perUnitRoute} m of conduit from the board`,
        "estimated",
      ),
    );
    const runTotal = perUnitRoute * units;
    const accessory = (key: string, label: string, count: number, basis: string) => {
      if (count < 1) return;
      add(material(key, label, "each", count, null, basis, "estimated"));
    };
    accessory(
      `conduit_coupler_${sizing.containmentMm}`,
      `${sizing.containmentMm} mm conduit coupler`,
      Math.ceil(runTotal * couplers),
      "One coupler per 3.3 m of conduit, rounded up",
    );
    accessory(
      `conduit_bend_${sizing.containmentMm}`,
      `${sizing.containmentMm} mm conduit bend`,
      Math.ceil(runTotal * bends),
      "One bend per 6 m of conduit, rounded up",
    );
    accessory(
      `draw_box_${sizing.containmentMm}`,
      `${sizing.containmentMm} mm draw box`,
      Math.ceil(runTotal * drawBoxes),
      "One draw box per 9 m of conduit, rounded up",
    );
  }

  // terminations: two lugs per circuit, sized with the protective conductor
  if (dedicated) {
    const lug = sizing.cpcSizeMm2 <= 6 ? 6 : sizing.cpcSizeMm2 <= 10 ? 10 : 16;
    add(
      material(
        `termination_lug_${lug}`,
        `${lug} mm² copper cable lug`,
        "each",
        units * 2,
        null,
        "One termination at each end of the circuit",
        "medium",
      ),
    );
  }

  // signage & POS counter wiring kits (materials only, scaled per unit)
  if (instance.load_key === "illuminated_sign") {
    add(material("flexible_conduit_20", "20mm Flexible Conduit", "m", 2 * units, null, "Flexible final entry to sign housing", "estimated"));
    add(material("conduit_adaptor_20", "20mm Male/Female Conduit Adaptor", "each", 2 * units, null, "Rigid-to-flexible conduit entry", "estimated"));
    const saddles = Math.ceil(perUnitRoute * units);
    if (saddles > 0) {
      add(material("conduit_saddle_20", "20mm Conduit Saddle", "each", saddles, null, "External conduit fixing", "estimated"));
    }
    add(material("junction_box_100", "100x100mm Junction Box", "each", units, null, "Weatherproof connection enclosure at sign", "medium"));
    add(material("terminal_strip_15a", "15A Terminal Connector Strip", "strip", units, null, "Sign cable termination block", "medium"));
    add(material("insulation_tape_pvc", "PVC Electrical Insulation Tape", "roll", units, null, "Weather/joint sealing tape", "medium"));
  } else if (instance.load_key === "pos_counter") {
    add(material("socket_13a_double", "Double 13A socket outlet", "each", 3 * units, null, "POS and back-office power points", "high"));
    add(material("socket_13a_double_usb", "13A Double Socket with USB Charging", "each", units, null, "Card machine / handheld charging point", "high"));
    add(material("socket_box_2g", "2-gang socket mounting box", "each", 4 * units, null, "Flush boxes for counter sockets", "high"));
    add(material("data_rj45_outlet", "Cat6 RJ45 Data Outlet", "each", 3 * units, null, "POS, card terminal and back-office data", "high"));
    add(material("switch_mounting_box", "1-Gang 35mm Flush Box", "each", 3 * units, null, "Flush boxes for RJ45 outlets", "high"));
    const dataLength = Math.round(perUnitRoute * 3 * units * 10) / 10;
    if (dataLength > 0) {
      add(material("data_cable", "Cat6 UTP Data Cable", "m", dataLength, null, `${perUnitRoute} m × 3 Cat6 runs per counter`, "estimated"));
    }
    add(material("trunking_38x25", "38x25mm PVC Trunking", "m", 15 * units, "trunking", "Counter and back-office perimeter trunking", "estimated"));
    add(material("trunking_flat_bend", "PVC Trunking Flat Bend", "each", 2 * units, null, "Counter trunking turns", "estimated"));
    add(material("trunking_in_corner", "PVC Trunking Internal Corner", "each", 2 * units, null, "Counter trunking corners", "estimated"));
    add(material("trunking_joiner", "PVC Trunking Joiner", "each", 3 * units, null, "Counter trunking couplers", "estimated"));
  }

  // the bill tags these rows, so a technician can see which load bought what
  return rows.map((row) => ({ ...row, origins: [definition.name] }));
}

/** A one-line summary for the chip, built only from what the person entered. */
export function specialLoadSummary(instance: SpecialLoadInstance, defaultRouteM = 8): string {
  if (!isConfigured(instance)) {
    const missing = missingRequirements(instance);
    const labels = missing.map((key) => fieldLabel(key)).join(", ");
    return labels ? `Needs ${labels}` : STATUS_LABEL.NOT_CONFIGURED;
  }

  const sizing = sizeSpecialLoad(instance);
  const route = Math.round(routeLengthFor(instance, defaultRouteM) * 10) / 10;
  const definition = specialLoadDefinition(instance.load_key);
  const parts = [`${sizing.powerKw} kW`];
  if (instance.capacity_hp) parts.unshift(`${instance.capacity_hp} HP`);
  parts.push(`${route} m`);
  // a plug-in appliance has no device of its own, so the summary must not imply one
  if (definition.protection === "mcb") parts.push(`${sizing.protectiveDeviceA} A`);
  parts.push(`${sizing.cableSizeMm2} mm²`);
  if (instance.dedicated_circuit === false) parts.push("existing circuit");
  if (instance.serving_db_id) parts.push(`from ${instance.serving_db_id}`);
  const count = instance.quantity > 1 ? `${instance.quantity} × ` : "";
  return `${count}${parts.join(" · ")}`;
}

const FIELD_LABELS: Record<SpecialLoadFieldKey, string> = {
  quantity: "quantity",
  rated_power_kw: "rated power",
  rated_current_a: "rated current",
  capacity_hp: "cooling capacity",
  supply_voltage_v: "supply voltage",
  phase: "supply phase",
  serving_db_id: "serving board",
  target_space_id: "serving space",
  route_length_m: "route length",
  installation_method: "installation method",
  local_isolator_required: "isolator choice",
  dedicated_circuit: "dedicated circuit",
  manufacturer_cable_size_mm2: "manufacturer cable size",
  manufacturer_breaker_rating_a: "manufacturer breaker rating",
  manufacturer_rcd_requirement: "RCD requirement",
  manufacturer_notes: "manufacturer notes",
  user_notes: "site notes",
};

export function fieldLabel(key: SpecialLoadFieldKey): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ");
}

export interface SpecialLoadBreakdown {
  instanceId: string;
  loadKey: string;
  name: string;
  status: ConfigurationStatus;
  statusLabel: string;
  summary: string;
  sizing: SpecialLoadSizing | null;
  materials: MaterialQuantity[];
  /** The definition's caution, shown while the load is provisional. */
  note: string;
  warnings: string[];
}

export interface SpecialLoadTotals {
  selected: number;
  configured: number;
  provisional: number;
  verified: number;
  overridden: number;
  unconfigured: number;
  circuits: number;
}

export interface SpecialLoadOutcome extends EngineResult {
  specialLoadBreakdown: SpecialLoadBreakdown[];
  specialLoadTotals: SpecialLoadTotals;
}

export interface ApplySpecialLoadsOptions extends SpecialLoadMaterialOptions {
  /** The ESTIMO route to use when the person has not typed a distance. */
  defaultRouteM?: number;
  /** Board spare capacity, so the recommended board still matches the circuit count. */
  spareCapacityPct?: number;
}

/**
 * Adds configured special loads to an engine result: their materials, their circuits and
 * the cautions the estimate should carry. The engine itself stays free of special-load
 * pricing, so a rule change here cannot move the golden quantity outputs.
 */
export function applySpecialLoads(
  result: EngineResult,
  instances: SpecialLoadInstance[],
  options: ApplySpecialLoadsOptions = {},
): SpecialLoadOutcome {
  const defaultRouteM = options.defaultRouteM ?? 8;
  const breakdown: SpecialLoadBreakdown[] = [];
  const warnings: string[] = [];
  const totals: SpecialLoadTotals = {
    selected: instances.length,
    configured: 0,
    provisional: 0,
    verified: 0,
    overridden: 0,
    unconfigured: 0,
    circuits: 0,
  };

  const merged = new Map<string, MaterialQuantity>();
  for (const row of result.materialQuantities) {
    merged.set(row.material_key, { ...row, trace: [...row.trace] });
  }

  for (const instance of instances) {
    const definition = specialLoadDefinition(instance.load_key);
    const status = configurationStatus(instance);
    const sizing = status === "NOT_CONFIGURED" ? null : sizeSpecialLoad(instance);
    const materials = specialLoadMaterials(instance, defaultRouteM, options);
    const instanceWarnings: string[] = [];

    if (status === "NOT_CONFIGURED") {
      totals.unconfigured += 1;
      const missing = missingRequirements(instance).map((key) => fieldLabel(key));
      instanceWarnings.push(
        `${definition.name} · configuration required: add ${missing.join(", ") || "its details"} before it can be costed.`,
      );
    } else {
      totals.configured += 1;
      // a shared supply draws no new way on the board
      if (instance.dedicated_circuit !== false) totals.circuits += Math.max(0, Math.round(instance.quantity));
      if (status === "PROVISIONAL") totals.provisional += 1;
      if (status === "VERIFIED") totals.verified += 1;
      if (status === "OVERRIDDEN") totals.overridden += 1;

      if (status !== "VERIFIED") {
        instanceWarnings.push(`${definition.name} · ${specialLoadSummary(instance, defaultRouteM)}. ${definition.provisionalNote}`);
      }
      if (sizing?.assumedPower && status !== "VERIFIED") {
        instanceWarnings.push(
          `${definition.name}: no rating entered, so the rulebook figure of ${sizing.powerKw} kW is used. Confirm it before ordering.`,
        );
      }
    }

    for (const row of materials) {
      const existing = merged.get(row.material_key);
      if (existing) {
        existing.engineering_quantity = Math.round((existing.engineering_quantity + row.engineering_quantity) * 10) / 10;
        // the pack round-up is worked out again below, from the merged length
        existing.purchase_quantity = existing.engineering_quantity;
        existing.trace = [...existing.trace, ...row.trace].slice(0, 4);
        // two loads can share a material (1.5 mm² conductors, conduit): keep both names
        if (row.origins?.length) {
          existing.origins = Array.from(new Set([...(existing.origins ?? []), ...row.origins]));
        }
        continue;
      }
      merged.set(row.material_key, { ...row, trace: [...row.trace] });
    }

    breakdown.push({
      instanceId: instance.id,
      loadKey: instance.load_key,
      name: definition.name,
      status,
      statusLabel: STATUS_LABEL[status],
      summary: specialLoadSummary(instance, defaultRouteM),
      sizing,
      materials: materials.map((row) => ({ ...row, trace: [...row.trace] })),
      note: definition.provisionalNote,
      warnings: instanceWarnings,
    });
    warnings.push(...instanceWarnings);
  }

  // merged lengths are pack-rounded once, so two short runs buy one roll, not two
  for (const row of merged.values()) {
    if (row.pack_size) {
      row.purchase_quantity = Math.ceil(row.engineering_quantity / row.pack_size) * row.pack_size;
    }
  }

  // Circuits and the board follow the configured loads, not the raw selection.
  const totalsPatch = {
    ...result.totals,
    dedicated_circuits: totals.circuits,
    total_final_circuits:
      result.totals.total_final_circuits - result.totals.dedicated_circuits + totals.circuits,
  };
  const designWays = Math.ceil(totalsPatch.total_final_circuits * (1 + (options.spareCapacityPct ?? 25) / 100));
  const recommendedWays = DB_SIZES.find((size) => designWays <= size) ?? null;
  totalsPatch.db_design_ways = designWays;
  totalsPatch.recommended_db_ways = recommendedWays;

  // the engine's generic "special loads are not sized" caution is replaced by the
  // per-load cautions above, which know what was actually entered
  const keptWarnings = result.warnings.filter((warning) => !/special load/i.test(warning));
  if (totals.unconfigured) {
    warnings.push(
      `${totals.unconfigured} special load${totals.unconfigured === 1 ? " is" : "s are"} selected but not configured, so ${totals.unconfigured === 1 ? "it is" : "they are"} not in the total yet.`,
    );
  }
  if (totals.provisional || totals.overridden) {
    warnings.push(
      `${totals.provisional + totals.overridden} special load${totals.provisional + totals.overridden === 1 ? " is" : "s are"} sized provisionally. Confirm the protective device and cable against the manufacturer's instructions.`,
    );
  }
  if (recommendedWays === null) {
    warnings.push(
      `The plan needs ${designWays} ways including special loads, more than the largest stocked board (${DB_SIZES[DB_SIZES.length - 1]}).`,
    );
  }

  return {
    ...result,
    totals: totalsPatch,
    db: {
      ...result.db,
      finalCircuits: totalsPatch.total_final_circuits,
      designWays,
      recommendedWays,
      engineered: recommendedWays === null,
    },
    materialQuantities: Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)),
    warnings: [...keptWarnings, ...warnings],
    specialLoadBreakdown: breakdown,
    specialLoadTotals: totals,
  };
}

export interface SpaceRouteRow {
  template_id: string;
  space_no: number;
  db_key?: string;
  route_distance_from_db_m: number;
}

/**
 * The AC count on the plan is the quantity of the AC load.
 *
 * A person counts air conditioners per space in the Points table; that count is what the
 * configured AC's circuit, materials and price must multiply by. The instance keeps its
 * own rating, route and manufacturer figures; only the quantity comes from the plan.
 */
export function syncAcQuantity(instances: SpecialLoadInstance[], acCount: number): SpecialLoadInstance[] {
  const quantity = Math.max(0, Math.round(acCount));
  return instances.map((instance) =>
    instance.load_key === "air_conditioner" && instance.quantity !== quantity
      ? { ...instance, quantity }
      : instance,
  );
}

/**
 * Point overrides that stop the engine costing bare AC points while a configured AC load
 * covers them. Without this the plan's AC count would be costed twice: once by the generic
 * `ac_point` assembly and once by the configurator.
 */
export function acSuppressionOverrides(
  spaces: SpaceInput[],
  instances: SpecialLoadInstance[],
): PointOverride[] {
  const configured = instances.some(
    (instance) => instance.load_key === "air_conditioner" && isConfigured(instance),
  );
  if (!configured) return [];
  return spaces.map((space) => ({
    space_id: space.id,
    point_type: "ac" as const,
    value: 0,
    source: "user_override" as const,
  }));
}

/** Room types that satisfy a rulebook space context, for picking the space a load serves. */
const CONTEXT_ROOM_TYPES: Record<string, string[]> = {
  kitchen: ["kitchen"],
  kitchen_or_utility: ["kitchen", "utility_room"],
  kitchen_or_bathroom: ["kitchen", "bathroom", "wc"],
  bathroom: ["bathroom", "wc"],
  habitable_room: ["bedroom", "living_room", "dining_room", "private_office", "meeting_room", "reception"],
  workshop: ["workshop"],
  shop_or_workshop: ["shop_floor", "store", "workshop"],
  // the compound: a charger or gate motor sits outside, at the porch, the yard or the carport
  external: ["external_area", "porch_veranda", "garage"],
  garage: ["garage"],
  building: [],
};

/**
 * A selected load starts from the plan, not from a blank form: the space it serves and
 * the ESTIMO distance to that space are filled in, so the first number a person sees is
 * the project's own route rather than an 8 m placeholder.
 *
 * The simple summary and the itemized bill both seed their default loads through this, so
 * the two screens price the same appliances from the same routes.
 */
export function seedSpecialLoads(
  loadKeys: string[],
  spaces: SpaceInput[],
  routes: SpaceRouteRow[],
  templateId: string,
): SpecialLoadInstance[] {
  return loadKeys.map((loadKey) => {
    const instance = newSpecialLoadInstance(loadKey);
    const context = specialLoadDefinition(loadKey).spaceContext;
    const wanted = CONTEXT_ROOM_TYPES[context] ?? [];
    // follow the context's own order: the compound's yard before the carport, for example
    const byContext = wanted.map((roomType) => spaces.find((space) => space.room_type === roomType)).find(Boolean);
    // nothing in this plan suits the load: serve the largest room, which is the main space,
    // not whichever room happens to come first in the list (that used to be a washroom)
    const largest = [...spaces].sort(
      (a, b) =>
        (b.length_m ?? 0) * (b.width_m ?? 0) * Math.max(1, b.quantity ?? 1) -
        (a.length_m ?? 0) * (a.width_m ?? 0) * Math.max(1, a.quantity ?? 1),
    )[0];
    const target = byContext ?? largest ?? null;
    const targetId = target?.id ?? null;
    return {
      ...instance,
      target_space_id: targetId,
      serving_db_id: dbKeyForSpace(routes, templateId, targetId) ?? "DB1",
      route_length_m: autoRouteForSpace(routes, templateId, targetId),
    };
  });
}

/** Rooms a home is air conditioned in: the bedrooms and the living areas. */
const HOME_AC_ROOMS = ["bedroom", "living_room"];

/**
 * Which rooms ESTIMO air conditions by default.
 *
 * Homes: one unit per bedroom and living room; a single room gets none because there is
 * nowhere to put one. Offices: every room except the washrooms, because a washroom is the
 * one place an office does not cool.
 */
function shouldAirCondition(projectType: string, roomType: string): boolean {
  if (["one_bedroom", "two_bedroom", "three_bedroom", "four_bedroom_villa"].includes(projectType)) {
    return HOME_AC_ROOMS.includes(roomType);
  }
  if (projectType === "office") return roomType !== "wc" && roomType !== "bathroom";
  return false;
}

/**
 * The rooms ESTIMO air conditions in a plan: a home's bedrooms and living areas, or an
 * office's every room except the washrooms.
 */
export function acRoomsFor(projectType: string, spaces: SpaceInput[]): SpaceInput[] {
  return spaces.filter((space) => shouldAirCondition(projectType, space.room_type));
}

/**
 * The route a multi-unit load is priced at: the mean of the runs to every room it serves, so
 * a single line's cable equals the sum of the individual runs whatever order the rooms come in.
 */
export function averageRouteFor(
  routes: SpaceRouteRow[],
  templateId: string | null | undefined,
  spaces: SpaceInput[],
): { route_length_m: number | null; route_source: "AUTO"; route_aggregate: true } {
  // a row with quantity 3 stands for three rooms, so it weighs three times in the mean
  const runs = spaces
    .map((space) => ({
      distance: autoRouteForSpace(routes, templateId, space.id),
      units: Math.max(1, Math.round(space.quantity ?? 1)),
    }))
    .filter((run): run is { distance: number; units: number } => typeof run.distance === "number");
  const units = runs.reduce((sum, run) => sum + run.units, 0);
  const average = units
    ? Math.round((runs.reduce((sum, run) => sum + run.distance * run.units, 0) / units) * 10) / 10
    : null;
  return { route_length_m: average, route_source: "AUTO", route_aggregate: true };
}

/**
 * Rooms that start with an air conditioner, counted in the plan and carried by a single AC
 * load, so the estimate prices them without being asked.
 */
export function defaultAcAdditions(args: {
  projectType: string;
  templateId: string;
  spaces: SpaceInput[];
  routes: SpaceRouteRow[];
  overrides?: PointOverride[];
}): { overrides: PointOverride[]; instances: SpecialLoadInstance[] } {
  const existing = args.overrides ?? [];
  const acSpaces = acRoomsFor(args.projectType, args.spaces);
  if (!acSpaces.length) return { overrides: [], instances: [] };

  const overrides: PointOverride[] = acSpaces
    .filter((space) => !existing.some((entry) => entry.space_id === space.id && entry.point_type === "ac"))
    .map((space) => ({ space_id: space.id, point_type: "ac" as const, value: 1, source: "user_override" as const }));

  const [acLoad] = seedSpecialLoads(["air_conditioner"], args.spaces, args.routes, args.templateId);
  const instances: SpecialLoadInstance[] = [
    {
      ...acLoad,
      // ESTIMO plans every cooled room at 2 HP until the person opens the load and picks
      // the real unit; the estimate says it is provisional until then
      capacity_hp: 2,
      phase: "single",
      quantity: acSpaces.reduce((sum, space) => sum + Math.max(1, Math.round(space.quantity ?? 1)), 0),
      // one line covers every cooled room, so its route is the average of their routes:
      // the total cable equals the sum of the individual runs, in any order
      ...averageRouteFor(args.routes, args.templateId, acSpaces),
      sizing_source: "ESTIMO_PROVISIONAL",
    },
  ];
  return { overrides, instances };
}

/**
 * Commercial plan additions derived from the selected spaces:
 * - Kiosks with outdoor/signage space get an illuminated sign circuit
 * - Shop floors with checkout counters get POS/till power, USB, Cat6 data and trunking
 * - Workshops with machines get a workshop_machine circuit per machine (three-phase feeder
 *   with TP MCB, TPN isolator and SWA cable — quantities via specialLoadMaterials, not the
 *   legacy assembly, so the phase is correct and materials appear on the itemized bill)
 */
export function defaultCommercialAdditions(args: {
  projectType: string;
  templateId: string;
  spaces: SpaceInput[];
  routes: SpaceRouteRow[];
}): SpecialLoadInstance[] {
  if (!args.spaces.length) return [];
  const added: SpecialLoadInstance[] = [];

  if (args.projectType === "container_kiosk") {
    const porchSpaces = args.spaces.filter((space) => space.room_type === "porch_veranda");
    const signCount = porchSpaces.reduce((sum, space) => sum + Math.max(1, Math.round(space.quantity ?? 1)), 0);
    if (signCount > 0) {
      const [signLoad] = seedSpecialLoads(["illuminated_sign"], porchSpaces, args.routes, args.templateId);
      added.push({
        ...signLoad,
        rated_power_kw: 0.3,
        phase: "single",
        quantity: signCount,
        sizing_source: "ESTIMO_PROVISIONAL",
      });
    }
  }

  const counterSpaces = args.spaces.filter(
    (space) => space.room_type === "shop_floor" && (space.checkout_counters ?? 0) > 0,
  );
  const counterCount = counterSpaces.reduce(
    (sum, space) => sum + Math.max(0, Math.round(space.checkout_counters ?? 0)) * Math.max(1, Math.round(space.quantity ?? 1)),
    0,
  );
  if (counterCount > 0) {
    const [posLoad] = seedSpecialLoads(["pos_counter"], counterSpaces, args.routes, args.templateId);
    added.push({
      ...posLoad,
      rated_power_kw: 2.5,
      phase: "single",
      quantity: counterCount,
      sizing_source: "ESTIMO_PROVISIONAL",
    });
  }

  // Workshop machines: each machine_count unit gets its own three-phase feeder. A single
  // SpecialLoadInstance covers all of them so the person can open the configurator and
  // enter the real motor rating. ESTIMO starts at the rulebook fallback of 5 kW.
  const machineSpaces = args.spaces.filter(
    (space) => space.room_type === "workshop" && (space.machine_count ?? 0) > 0,
  );
  const machineCount = machineSpaces.reduce(
    (sum, space) => sum + Math.max(0, Math.round(space.machine_count ?? 0)) * Math.max(1, Math.round(space.quantity ?? 1)),
    0,
  );
  if (machineCount > 0) {
    const [machineLoad] = seedSpecialLoads(["workshop_machine"], machineSpaces, args.routes, args.templateId);
    added.push({
      ...machineLoad,
      // Fallback: 5 kW three-phase is the rulebook default for a general workshop machine.
      // The person must open the configurator and enter the real motor rating before the
      // estimate is confirmed; until then it shows as ESTIMO_PROVISIONAL.
      rated_power_kw: 5,
      phase: "three",
      quantity: machineCount,
      sizing_source: "ESTIMO_PROVISIONAL",
    });
  }

  return added;
}
/**
 * The ESTIMO route for a space, read from the published route table. Space ids carry the
 * template and the space number ("T011-3"), so the automatic distance survives a reload.
 */
export function autoRouteForSpace(
  routes: SpaceRouteRow[],
  templateId: string | null | undefined,
  spaceId: string | null | undefined,
): number | null {
  if (!templateId || !spaceId) return null;
  // "T020-8" and its copies ("T020-8-1") both refer to space 8: the number right after
  // the template, not the last one, which is the copy index
  const match = /^[A-Za-z0-9]+-(\d+)/.exec(spaceId);
  if (!match) return null;
  const spaceNo = Number(match[1]);
  const row = routes.find((route) => route.template_id === templateId && route.space_no === spaceNo);
  return row ? row.route_distance_from_db_m : null;
}

/** The board a space's route starts from, when the route table names one. */
export function dbKeyForSpace(
  routes: SpaceRouteRow[],
  templateId: string | null | undefined,
  spaceId: string | null | undefined,
): string | null {
  if (!templateId || !spaceId) return null;
  const match = /^[A-Za-z0-9]+-(\d+)/.exec(spaceId);
  if (!match) return null;
  const spaceNo = Number(match[1]);
  const row = routes.find((route) => route.template_id === templateId && route.space_no === spaceNo);
  return row?.db_key ?? null;
}

/** "Water heater · 4.5 kW · 18 m · 25 A" for the PDF and the saved estimate. */
export function specialLoadLabel(instance: SpecialLoadInstance, defaultRouteM = 8): string {
  const definition = specialLoadDefinition(instance.load_key);
  const status = configurationStatus(instance);
  if (status === "NOT_CONFIGURED") return `${definition.name} · configuration required`;
  return `${definition.name} · ${specialLoadSummary(instance, defaultRouteM)}`;
}

/** The labels a saved estimate or a PDF can list without the engine. */
export function specialLoadLabels(instances: SpecialLoadInstance[], defaultRouteM = 8): string[] {
  return instances.map((instance) => specialLoadLabel(instance, defaultRouteM));
}






