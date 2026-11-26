/**
 * Preliminary estimate model.
 *
 * Every project type declares its own spaces. Each space contributes electrical
 * points (lights, sockets, AC, heaters, cooking) which drive the preliminary total
 * between a floor and a calibration anchor. Anchors are staging assumptions; the
 * 2-bedroom home is the first Golden Project reference.
 */

export type FittingQuality = "basic" | "standard" | "premium";

export type SpaceItem = {
  name: string;
  unit: string;
  lights?: number;
  sockets?: number;
  acs?: number;
  heaters?: number;
  switches?: number;
  cooking?: number;
};

export type SpaceField = {
  key: string;
  label: string;
  note: string;
  items: SpaceItem[];
};

export type ProjectType = {
  code: string;
  label: string;
  kind: "home" | "commercial";
  base: number;
  floor: number;
  fields: SpaceField[];
};

export type Counts = Record<string, number>;

export type Points = { lights: number; sockets: number; acs: number; heaters: number; switches: number; cooking: number };

export type EstimateLine = {
  label: string;
  quantity: string;
  unitPrice: number;
  amount: number;
};

export const FITTINGS: { value: FittingQuality; label: string; note: string }[] = [
  { value: "basic", label: "Basic", note: "Budget-friendly fittings" },
  { value: "standard", label: "Standard", note: "Good everyday quality" },
  { value: "premium", label: "Premium", note: "Higher-end finishes" },
];

const QUALITY_FACTOR: Record<FittingQuality, number> = { basic: 0.88, standard: 1, premium: 1.2 };

const homeFields: SpaceField[] = [
  {
    key: "bedrooms",
    label: "Bedrooms",
    note: "Each gets lights, sockets and a switch",
    items: [
      { name: "Light points", unit: "point", lights: 2 },
      { name: "Double sockets", unit: "socket", sockets: 4 },
      { name: "Light switch", unit: "switch", switches: 1 },
      { name: "AC point", unit: "point", acs: 1 },
    ],
  },
  {
    key: "bathrooms",
    label: "Bathrooms",
    note: "Wet-area fittings included",
    items: [
      { name: "Light point (IP-rated)", unit: "point", lights: 1 },
      { name: "Sockets (shaver / accessory)", unit: "socket", sockets: 2 },
      { name: "Light switch", unit: "switch", switches: 1 },
      { name: "Water heater point", unit: "point", heaters: 1 },
    ],
  },
  {
    key: "kitchens",
    label: "Kitchens",
    note: "Cooker and appliance points",
    items: [
      { name: "Light points", unit: "point", lights: 2 },
      { name: "Double sockets", unit: "socket", sockets: 4 },
      { name: "Light switch", unit: "switch", switches: 1 },
      { name: "Cooker point", unit: "point", cooking: 1 },
    ],
  },
  {
    key: "living",
    label: "Living rooms",
    note: "Lounge and dining areas",
    items: [
      { name: "Light points", unit: "point", lights: 3 },
      { name: "Double sockets", unit: "socket", sockets: 6 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "porches",
    label: "Porches and balconies",
    note: "Outdoor lights and sockets",
    items: [
      { name: "Outdoor light point", unit: "point", lights: 1 },
      { name: "Weatherproof sockets", unit: "socket", sockets: 2 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
];

const shopKioskFields: SpaceField[] = [
  {
    key: "serving",
    label: "Serving area",
    note: "Counter, display lighting and till points",
    items: [
      { name: "Light points", unit: "point", lights: 3 },
      { name: "Double sockets", unit: "socket", sockets: 4 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "storage",
    label: "Storage",
    note: "Stock and utility corner",
    items: [
      { name: "Light point", unit: "point", lights: 1 },
      { name: "Socket", unit: "socket", sockets: 1 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "signage",
    label: "Outdoor and signage",
    note: "External lighting and illuminated sign",
    items: [
      { name: "Outdoor light points", unit: "point", lights: 2 },
      { name: "Weatherproof socket", unit: "socket", sockets: 1 },
    ],
  },
  {
    key: "washroom",
    label: "Washroom",
    note: "Wet-area fittings included",
    items: [
      { name: "Light point (IP-rated)", unit: "point", lights: 1 },
      { name: "Sockets (accessory)", unit: "socket", sockets: 1 },
      { name: "Water heater point", unit: "point", heaters: 1 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
];

const shopRetailFields: SpaceField[] = [
  {
    key: "floor",
    label: "Sales floor",
    note: "Display lighting and customer sockets",
    items: [
      { name: "Light points", unit: "point", lights: 8 },
      { name: "Double sockets", unit: "socket", sockets: 12 },
      { name: "Light switches", unit: "switch", switches: 2 },
    ],
  },
  {
    key: "counter",
    label: "Counter and tills",
    note: "POS, card machines and back-office",
    items: [
      { name: "Light points", unit: "point", lights: 2 },
      { name: "Double sockets", unit: "socket", sockets: 4 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "storage",
    label: "Storage room",
    note: "Stock room and shelving",
    items: [
      { name: "Light points", unit: "point", lights: 2 },
      { name: "Sockets", unit: "socket", sockets: 2 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "washroom",
    label: "Washroom",
    note: "Wet-area fittings included",
    items: [
      { name: "Light point (IP-rated)", unit: "point", lights: 1 },
      { name: "Sockets (accessory)", unit: "socket", sockets: 2 },
      { name: "Water heater point", unit: "point", heaters: 1 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
];

const officeFields: SpaceField[] = [
  {
    key: "open",
    label: "Open office",
    note: "Desks, monitors and shared equipment",
    items: [
      { name: "Light points", unit: "point", lights: 6 },
      { name: "Double sockets", unit: "socket", sockets: 10 },
      { name: "Light switches", unit: "switch", switches: 2 },
    ],
  },
  {
    key: "meeting",
    label: "Meeting room",
    note: "Screens, conferencing and lighting",
    items: [
      { name: "Light points", unit: "point", lights: 2 },
      { name: "Double sockets", unit: "socket", sockets: 4 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "kitchenette",
    label: "Kitchenette",
    note: "Microwave, kettle and fridge",
    items: [
      { name: "Light point", unit: "point", lights: 1 },
      { name: "Double sockets", unit: "socket", sockets: 2 },
      { name: "Cooker / appliance point", unit: "point", cooking: 1 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "washroom",
    label: "Washroom",
    note: "Wet-area fittings included",
    items: [
      { name: "Light point (IP-rated)", unit: "point", lights: 1 },
      { name: "Sockets (accessory)", unit: "socket", sockets: 2 },
      { name: "Water heater point", unit: "point", heaters: 1 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "server",
    label: "Server room",
    note: "IT rack, cooling and a data feed",
    items: [
      { name: "Light points", unit: "point", lights: 1 },
      { name: "Double sockets", unit: "socket", sockets: 2 },
      { name: "AC point", unit: "point", acs: 1 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
];

const workshopFields: SpaceField[] = [
  {
    key: "workshop",
    label: "Workshop floor",
    note: "High-bay lighting and general power",
    items: [
      { name: "Light points", unit: "point", lights: 8 },
      { name: "Industrial sockets", unit: "socket", sockets: 10 },
      { name: "Light switches", unit: "switch", switches: 2 },
    ],
  },
  {
    key: "machines",
    label: "Machine points",
    note: "Dedicated machine supplies",
    items: [
      { name: "Machine socket points", unit: "point", sockets: 6 },
      { name: "Isolator points", unit: "point", switches: 2 },
    ],
  },
  {
    key: "store",
    label: "Store and loading",
    note: "Storage, loading bay and yard lighting",
    items: [
      { name: "Light points", unit: "point", lights: 3 },
      { name: "Sockets", unit: "socket", sockets: 2 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "office",
    label: "Site office",
    note: "Supervision desk and records",
    items: [
      { name: "Light points", unit: "point", lights: 2 },
      { name: "Double sockets", unit: "socket", sockets: 4 },
      { name: "AC point", unit: "point", acs: 1 },
      { name: "Light switch", unit: "switch", switches: 1 },
    ],
  },
  {
    key: "washroom",
    label: "Washrooms",
    note: "Staff washrooms, two as standard",
    items: [
      { name: "WC point", unit: "point", lights: 1, sockets: 1, heaters: 1, switches: 1 },
    ],
  },
  {
    key: "external",
    label: "External and yard",
    note: "Security lighting and outdoor sockets",
    items: [
      { name: "Outdoor light points", unit: "point", lights: 3 },
      { name: "Weatherproof socket", unit: "socket", sockets: 1 },
    ],
  },
];

export const PROJECT_TYPES: Record<string, ProjectType> = {
  "HOME-1R": { code: "HOME-1R", label: "Single Room", kind: "home", base: 9800, floor: 4200, fields: homeFields },
  "HOME-1B": { code: "HOME-1B", label: "1-Bedroom Home", kind: "home", base: 12800, floor: 5000, fields: homeFields },
  "HOME-2B": { code: "HOME-2B", label: "2-Bedroom Home", kind: "home", base: 16800, floor: 6000, fields: homeFields },
  "HOME-3B": { code: "HOME-3B", label: "3-Bedroom Home", kind: "home", base: 22000, floor: 7500, fields: homeFields },
  "HOME-4B": { code: "HOME-4B", label: "4-Bedroom / Villa", kind: "home", base: 30000, floor: 9500, fields: homeFields },
  "SHOP-KIOSK": { code: "SHOP-KIOSK", label: "Container / Kiosk", kind: "commercial", base: 6200, floor: 3200, fields: shopKioskFields },
  "SHOP-RETAIL": { code: "SHOP-RETAIL", label: "Shop / Retail", kind: "commercial", base: 11500, floor: 5200, fields: shopRetailFields },
  "COMM-OFF-S": { code: "COMM-OFF-S", label: "Office", kind: "commercial", base: 14500, floor: 6000, fields: officeFields },
  "IND-WORK": { code: "IND-WORK", label: "Workshop / Small Factory", kind: "commercial", base: 24000, floor: 9000, fields: workshopFields },
};

export const PROJECT_LABELS: Record<string, string> = Object.fromEntries(
  Object.values(PROJECT_TYPES).map((type) => [type.code, type.label]),
);

const DEFAULT_COUNTS: Record<string, Counts> = {
  "HOME-1R": { bedrooms: 1, bathrooms: 1, kitchens: 1, living: 1, porches: 0 },
  "HOME-1B": { bedrooms: 1, bathrooms: 1, kitchens: 1, living: 1, porches: 0 },
  "HOME-2B": { bedrooms: 2, bathrooms: 1, kitchens: 1, living: 1, porches: 0 },
  "HOME-3B": { bedrooms: 3, bathrooms: 2, kitchens: 1, living: 1, porches: 1 },
  "HOME-4B": { bedrooms: 4, bathrooms: 3, kitchens: 1, living: 2, porches: 1 },
  "SHOP-KIOSK": { serving: 1, storage: 1, signage: 1, washroom: 1 },
  "SHOP-RETAIL": { floor: 1, counter: 1, storage: 1, washroom: 1 },
  "COMM-OFF-S": { open: 1, meeting: 1, kitchenette: 1, washroom: 1, server: 1 },
  "IND-WORK": { workshop: 1, machines: 1, store: 1, office: 1, external: 1 },
};

export function projectType(code: string): ProjectType {
  return PROJECT_TYPES[code] ?? PROJECT_TYPES["HOME-2B"];
}

/**
 * Offices, shops and workshops must provide at least two washrooms: staff and customers
 * cannot share one, and a single WC fails the layouts these buildings are planned from.
 */
export const MINIMUM_WASHROOMS: Record<string, number> = {
  "COMM-OFF-S": 2,
  "SHOP-RETAIL": 2,
  "IND-WORK": 2,
};

export function minimumWashrooms(code: string): number {
  return MINIMUM_WASHROOMS[code] ?? 0;
}

/** The floor a stepper cannot go under, for any counter. */
export function minimumCount(code: string, key: string): number {
  return key === "washroom" ? minimumWashrooms(code) : 0;
}

/** Whole numbers, 0..20, and never below the building's minimum washrooms. */
export function clampCount(code: string, key: string, value: number): number {
  const rounded = Math.max(0, Math.min(20, Math.round(Number.isFinite(value) ? value : 0)));
  return Math.max(minimumCount(code, key), rounded);
}

export function defaultCounts(code: string): Counts {
  const type = projectType(code);
  const defaults = DEFAULT_COUNTS[type.code] ?? DEFAULT_COUNTS["HOME-2B"];
  return Object.fromEntries(
    type.fields.map((field) => [field.key, clampCount(type.code, field.key, defaults[field.key] ?? 0)]),
  );
}

export function totalSpaces(counts: Counts): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

export function pointsFor(code: string, counts: Counts): Points {
  const points: Points = { lights: 0, sockets: 0, acs: 0, heaters: 0, switches: 0, cooking: 0 };
  for (const field of projectType(code).fields) {
    const count = counts[field.key] ?? 0;
    if (!count) continue;
    for (const item of field.items) {
      points.lights += (item.lights ?? 0) * count;
      points.sockets += (item.sockets ?? 0) * count;
      points.acs += (item.acs ?? 0) * count;
      points.heaters += (item.heaters ?? 0) * count;
      points.switches += (item.switches ?? 0) * count;
      points.cooking += (item.cooking ?? 0) * count;
    }
  }
  return points;
}

export function computeEstimate(code: string, counts: Counts, quality: FittingQuality): number {
  const type = projectType(code);
  const points = pointsFor(type.code, counts);
  const baseline = pointsFor(type.code, defaultCounts(type.code));

  const pointDelta =
    (points.lights - baseline.lights) * 100 +
    (points.sockets - baseline.sockets) * 150 +
    (points.acs - baseline.acs) * 500 +
    (points.heaters - baseline.heaters) * 450;
  const cookerDelta = (points.cooking > 0 ? 0 : -650) - (baseline.cooking > 0 ? 0 : -650);

  const base = Math.max(type.floor, type.base + pointDelta + cookerDelta);
  return Math.round((base * QUALITY_FACTOR[quality]) / 100) * 100;
}

const LINES: { label: string; share: number }[] = [
  { label: "Cables and conduit", share: 0.34 },
  { label: "Sockets and switches", share: 0.12 },
  { label: "Light fittings", share: 0.1 },
  { label: "Distribution board and breakers", share: 0.14 },
  { label: "Earthing", share: 0.06 },
];

/** Splits the preliminary total into the cost groups shown on the estimate. */
export function estimateLines(total: number, code: string, counts: Counts): EstimateLine[] {
  const points = pointsFor(code, counts);
  const cableMetres = Math.round(
    (points.lights * 6 + points.sockets * 7 + points.acs * 10 + points.heaters * 8) / 5,
  ) * 5;

  const quantities: Record<string, string> = {
    "Cables and conduit": `${cableMetres} m`,
    "Sockets and switches": `${points.sockets + points.switches}`,
    "Light fittings": `${points.lights}`,
    "Distribution board and breakers": "1 set",
    Earthing: "1 set",
  };

  const shareTotal = LINES.reduce((sum, line) => sum + line.share, 0);

  return LINES.map(({ label, share }) => {
    const amount = Math.round((total * (share / shareTotal)) / 10) * 10;
    const quantity = quantities[label];
    const numeric = Number.parseInt(quantity, 10);
    return {
      label,
      quantity,
      amount,
      unitPrice: Number.isFinite(numeric) && numeric > 0 ? Math.round(amount / numeric) : amount,
    };
  });
}
