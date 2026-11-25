/**
 * ESTIMO special-load schema.
 *
 * A special load is described here once: the fields a technician fills in, the presets
 * that make the common sizes one click, and the policy that decides which materials
 * ESTIMO adds to the bill of quantities. The configurator renders these definitions, so
 * a new load is a data entry, not a new form component.
 *
 * Nothing in this file prices anything. It only says what to ask, what the answer means
 * for the circuit, and which assembly components the answer brings with it.
 */

export type Phase = "single" | "three";
export type InstallationMethod = "conduit" | "trunking" | "surface" | "concealed";
export type RcdRequirement = "unknown" | "required" | "not_required";
export type RouteSource = "AUTO" | "USER_OVERRIDE";

export type SpecialLoadFieldKey =
  | "quantity"
  | "rated_power_kw"
  | "rated_current_a"
  | "capacity_hp"
  | "supply_voltage_v"
  | "phase"
  | "serving_db_id"
  | "route_length_m"
  | "installation_method"
  | "local_isolator_required"
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
  route_length_m: number | null;
  route_source: RouteSource;
  installation_method: InstallationMethod | null;
  local_isolator_required: boolean | null;
  manufacturer_cable_size_mm2: number | null;
  manufacturer_breaker_rating_a: number | null;
  manufacturer_rcd_requirement: RcdRequirement | null;
  manufacturer_notes: string;
  user_notes: string;
}

export type SpecialLoadFieldKind = "number" | "select" | "boolean" | "text" | "textarea";

/** Lists the UI resolves at render time, because they depend on the project. */
export type SpecialLoadOptionsFrom = "boards" | "cable_sizes" | "breaker_ratings";

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
  /** RCD/RCBO policy when the manufacturer has not said otherwise. */
  rcd: RcdRequirement;
  /** Local isolator policy. */
  isolator: "always" | "optional" | "never";
  /** Containment family for the run from the board. */
  containment: "conduit" | "trunking";
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
    return { key: "capacity_hp", label, kind: "number", group: "load", unit: "HP", min: 0.5, max: 50, step: 0.5, help: "Air conditioners are usually sold in HP; ESTIMO converts it to kilowatts." };
  },
  voltage(): SpecialLoadField {
    return { key: "supply_voltage_v", label: "Supply voltage", kind: "number", group: "load", unit: "V", min: 100, max: 500, step: 5, help: "Defaults to 230 V single-phase or 400 V three-phase." };
  },
  phase(): SpecialLoadField {
    return { key: "phase", label: "Supply", kind: "select", group: "load", options: PHASE_OPTIONS };
  },
  board(): SpecialLoadField {
    return { key: "serving_db_id", label: "Served from", kind: "select", group: "load", optionsFrom: "boards", help: "The board the circuit leaves from. The route is measured from here." };
  },
  route(): SpecialLoadField {
    return { key: "route_length_m", label: "Distance from board", kind: "number", group: "route", unit: "m", min: 0.5, max: 400, step: 0.5, help: "Leave blank to use the ESTIMO route for the space." };
  },
  method(): SpecialLoadField {
    return { key: "installation_method", label: "Installation method", kind: "select", group: "route", options: METHOD_OPTIONS };
  },
  isolator(): SpecialLoadField {
    return { key: "local_isolator_required", label: "Local isolator required", kind: "select", group: "manufacturer", options: YES_NO_OPTIONS };
  },
  cableSize(): SpecialLoadField {
    return { key: "manufacturer_cable_size_mm2", label: "Manufacturer cable size", kind: "select", group: "manufacturer", options: cableSizeOptions, placeholder: "Not stated", help: "From the installation manual. It takes priority over ESTIMO's sizing." };
  },
  breaker(): SpecialLoadField {
    return { key: "manufacturer_breaker_rating_a", label: "Manufacturer breaker rating", kind: "select", group: "manufacturer", options: breakerOptions, placeholder: "Not stated", help: "From the installation manual. It takes priority over ESTIMO's sizing." };
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

const presets = {
  waterHeater: [
    { code: "WH_3KW", name: "3 kW", values: { rated_power_kw: 3, phase: "single", local_isolator_required: true } },
    { code: "WH_4_5KW", name: "4.5 kW", values: { rated_power_kw: 4.5, phase: "single", local_isolator_required: true } },
    { code: "WH_6KW", name: "6 kW", values: { rated_power_kw: 6, phase: "single", local_isolator_required: true } },
    { code: "CUSTOM", name: "Custom" },
  ] satisfies SpecialLoadPreset[],
  ev: [
    { code: "EV_3_6", name: "3.6 kW", values: { rated_power_kw: 3.6, phase: "single" } },
    { code: "EV_7_4", name: "7.4 kW", values: { rated_power_kw: 7.4, phase: "single" } },
    { code: "EV_11", name: "11 kW", values: { rated_power_kw: 11, phase: "three" } },
    { code: "EV_22", name: "22 kW", values: { rated_power_kw: 22, phase: "three" } },
    { code: "CUSTOM", name: "Custom" },
  ] satisfies SpecialLoadPreset[],
  ac: [
    { code: "AC_1HP", name: "1 HP", values: { capacity_hp: 1, phase: "single" } },
    { code: "AC_1_5HP", name: "1.5 HP", values: { capacity_hp: 1.5, phase: "single" } },
    { code: "AC_2HP", name: "2 HP", values: { capacity_hp: 2, phase: "single" } },
    { code: "AC_2_5HP", name: "2.5 HP", values: { capacity_hp: 2.5, phase: "single" } },
    { code: "CUSTOM", name: "Custom" },
  ] satisfies SpecialLoadPreset[],
  custom: [{ code: "CUSTOM", name: "Custom" }] satisfies SpecialLoadPreset[],
};

/** Appliance loads that sit on a socket and only need a run to the board. */
function applianceFields(options: { power?: boolean } = {}): SpecialLoadField[] {
  return [
    field.quantity(),
    ...(options.power === false ? [] : [field.power()]),
    field.current(),
    field.voltage(),
    field.phase(),
    field.board(),
    field.route(),
    field.method(),
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
    fields: applianceFields(),
    presets: presets.custom,
    provisionalNote: "Fridges are usually plugged into a socket circuit. Confirm whether the kitchen design gives it a dedicated circuit.",
  },
  {
    key: "freezer",
    name: "Freezer",
    tagline: "Standalone freezer, on a plug or on its own circuit.",
    spaceContext: "kitchen_or_shop",
    powerFactor: 1,
    motorLoad: false,
    outlet: "socket",
    protection: "none",
    rcd: "unknown",
    isolator: "never",
    containment: "conduit",
    fallbackPowerKw: 0.8,
    required: ["quantity", "phase"],
    fields: applianceFields({ power: true }),
    presets: presets.custom,
    provisionalNote: "A plug-in freezer does not need a breaker of its own. Choose the dedicated preset when the design gives it one.",
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
    fields: applianceFields(),
    presets: presets.custom,
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
    fields: [
      field.quantity(),
      field.power(),
      field.current(),
      field.voltage(),
      field.phase(),
      field.board(),
      field.route(),
      field.method(),
      field.isolator(),
      field.cableSize(),
      field.breaker(),
      field.rcd(),
      field.manufacturerNotes("Cooker make, model and the control-unit requirement."),
      field.userNotes(),
    ],
    presets: [
      { code: "COOKER_4_8", name: "4.8 kW", values: { rated_power_kw: 4.8, phase: "single" } },
      { code: "COOKER_6", name: "6 kW", values: { rated_power_kw: 6, phase: "single" } },
      { code: "COOKER_7_2", name: "7.2 kW", values: { rated_power_kw: 7.2, phase: "single" } },
      { code: "CUSTOM", name: "Custom" },
    ],
    provisionalNote: "Cooker circuits are load-designed. ESTIMO's sizing is a provisional allowance until the cooker rating and the manufacturer's instructions are confirmed.",
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
    fields: applianceFields(),
    presets: presets.custom,
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
    fields: applianceFields(),
    presets: presets.custom,
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
    fields: applianceFields({ power: false }),
    presets: presets.custom,
    provisionalNote: "Extractors are usually fed from the lighting or a fused spur; the FCU and its run are costed.",
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
    fields: [
      field.quantity(),
      field.power(),
      field.current(),
      field.voltage(),
      field.phase(),
      field.board(),
      field.route(),
      field.method(),
      field.isolator(),
      field.cableSize(),
      field.breaker(),
      field.rcd(),
      field.manufacturerNotes("Heater make, model and the water-heater switch the instructions call for."),
      field.userNotes(),
    ],
    presets: presets.waterHeater,
    provisionalNote: "ESTIMO sizes the heater circuit from its rating. Confirm the final cable and protective device against the heater's instructions, especially where the manufacturer calls for a 30 mA RCD.",
  },
  {
    key: "air_conditioner",
    name: "Air conditioner",
    tagline: "Dedicated AC circuit with a local isolator.",
    spaceContext: "habitable_room",
    powerFactor: 0.9,
    motorLoad: true,
    outlet: "none",
    protection: "mcb",
    rcd: "unknown",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 1.12,
    fallbackCapacityHp: 1.5,
    required: ["quantity", "phase"],
    fields: [
      field.quantity(),
      field.capacityHp(),
      field.power("Rated input power", "The input power in kW, when the manual gives it. Leave blank to use the HP rating."),
      field.current(),
      field.voltage(),
      field.phase(),
      field.board(),
      field.route(),
      field.method(),
      field.isolator(),
      field.cableSize(),
      field.breaker(),
      field.rcd(),
      field.manufacturerNotes("Outdoor unit model and the manufacturer's supply requirement."),
      field.userNotes(),
    ],
    presets: presets.ac,
    provisionalNote: "ESTIMO's HP-to-kilowatt allowance is provisional. Confirm the input power, breaker and cable from the unit's manual before ordering.",
  },
  {
    key: "water_pump",
    name: "Water pump",
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
    fields: [
      field.quantity(),
      field.power(),
      field.current(),
      field.voltage(),
      field.phase(),
      field.board(),
      field.route(),
      field.method(),
      field.isolator(),
      field.cableSize(),
      field.breaker(),
      field.rcd(),
      field.manufacturerNotes("Pump model, starter and overload requirement."),
      field.userNotes(),
    ],
    presets: presets.custom,
    provisionalNote: "Motor circuits need the pump's own data: starting method, overload and full-load current. ESTIMO's allowance is provisional.",
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
    fields: applianceFields({ power: false }),
    presets: presets.custom,
    provisionalNote: "The run to a gate is often long and buried; confirm the route, the burial depth and the manufacturer's cable.",
  },
  {
    key: "ev_charger",
    name: "EV charger",
    tagline: "Load-sized charger circuit, protection and isolator.",
    spaceContext: "garage",
    powerFactor: 1,
    motorLoad: false,
    outlet: "none",
    protection: "mcb",
    rcd: "required",
    isolator: "always",
    containment: "conduit",
    fallbackPowerKw: 7.4,
    required: ["quantity", "rated_power_kw", "phase"],
    fields: [
      field.quantity(),
      field.power(),
      field.current("The charger's maximum demand current, when the manual gives it."),
      field.voltage(),
      field.phase(),
      field.board(),
      field.route(),
      field.method(),
      field.isolator(),
      field.cableSize(),
      field.breaker(),
      field.rcd(),
      field.manufacturerNotes("Charger model, RCD type and the earthing arrangement the manual requires."),
      field.userNotes(),
    ],
    presets: presets.ev,
    provisionalNote: "EV chargers need a load-designed circuit and a manufacturer-approved RCD. ESTIMO's provisional allowance must be confirmed against the charger's manual and the supply capacity.",
  },
  {
    key: "workshop_machine",
    name: "Workshop machine",
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
    fields: [
      field.quantity(),
      field.power(),
      field.current(),
      field.voltage(),
      field.phase(),
      field.board(),
      field.route(),
      field.method(),
      field.isolator(),
      field.cableSize(),
      field.breaker(),
      field.rcd(),
      field.manufacturerNotes("Machine model, starter type and full-load current."),
      field.userNotes(),
    ],
    presets: [
      { code: "MACHINE_3", name: "3 kW", values: { rated_power_kw: 3, phase: "three" } },
      { code: "MACHINE_5_5", name: "5.5 kW", values: { rated_power_kw: 5.5, phase: "three" } },
      { code: "MACHINE_7_5", name: "7.5 kW", values: { rated_power_kw: 7.5, phase: "three" } },
      { code: "CUSTOM", name: "Custom" },
    ],
    provisionalNote: "Machine circuits are engineered: the starter, overload and cable depend on the motor data. ESTIMO's figures are a provisional allowance.",
  },
  {
    key: "refrigeration_equipment",
    name: "Refrigeration plant",
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
    fields: [
      field.quantity(),
      field.power(),
      field.current(),
      field.voltage(),
      field.phase(),
      field.board(),
      field.route(),
      field.method(),
      field.isolator(),
      field.cableSize(),
      field.breaker(),
      field.rcd(),
      field.manufacturerNotes("Condensing-unit model and its supply requirement."),
      field.userNotes(),
    ],
    presets: presets.custom,
    provisionalNote: "Refrigeration plant draws locked-rotor current on start. Confirm the manufacturer's circuit data before ordering.",
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
    fields: applianceFields(),
    presets: presets.custom,
    provisionalNote: "This load has no ESTIMO assembly yet. The circuit is costed from its rating and route; confirm the materials by hand.",
  };
}

export function specialLoadDefinition(key: string): SpecialLoadDefinition {
  return BY_KEY.get(key) ?? genericDefinition(key);
}

/** The values a freshly selected load starts from. */
export function defaultSpecialLoadValues(key: string): SpecialLoadValues {
  return {
    quantity: 1,
    rated_power_kw: null,
    rated_current_a: null,
    capacity_hp: null,
    supply_voltage_v: null,
    phase: "single",
    serving_db_id: "DB1",
    route_length_m: null,
    route_source: "AUTO",
    installation_method: "conduit",
    local_isolator_required: null,
    manufacturer_cable_size_mm2: null,
    manufacturer_breaker_rating_a: null,
    manufacturer_rcd_requirement: "unknown",
    manufacturer_notes: "",
    user_notes: "",
  };
}

/** Applies a preset without losing notes or the route the person already typed. */
export function presetValues(base: SpecialLoadValues, preset: SpecialLoadPreset): SpecialLoadValues {
  return { ...base, ...preset.values, preset_code: preset.code } as SpecialLoadValues;
}
