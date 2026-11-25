/**
 * Bridges engine material keys to catalogue materials, so quantities can be priced
 * with the same price list the estimating app already uses.
 *
 * A key maps to one catalogue material; quantities are converted into that material's
 * selling unit (conduit is sold by the 3 m length, cable by the metre).
 */

import type { MaterialQuantity } from "./types";

export interface CatalogueLink {
  /** Catalogue material id, or null when the catalogue has no equivalent yet. */
  id: string | null;
  /** How the engine unit becomes the catalogue unit. */
  convert?: "metres-to-lengths";
  /** Length of one catalogue unit, in metres, when converting. */
  unitLength?: number;
}

export const MATERIAL_CATALOGUE: Record<string, CatalogueLink> = {
  "25a_sp_mcb": { id: "mat-pro-mcb-sp-40a" },
  "20a_sp_mcb": { id: "mat-pro-mcb-sp-40a" },
  "16a_sp_mcb": { id: "mat-pro-mcb-sp-40a" },
  "40a_sp_mcb": { id: "mat-pro-mcb-sp-40a" },
  "13a_fcu": { id: "mat-sws-fcu-13a" },
  "ac_isolator": { id: "mat-iso-dp-32a" },
  "equipment_isolator": { id: "mat-iso-dp-32a" },
  "gate_motor_isolator": { id: "mat-iso-dp-32a" },
  "pump_isolator": { id: "mat-iso-dp-32a" },
  "machine_isolator": { id: "mat-iso-dp-63a" },
  "machine_protective_device": { id: "mat-pro-mcb-sp-63a" },
  "20a_dp_water_heater_switch": { id: "mat-iso-dp-32a" },
  "45a_cooker_control_unit": { id: "mat-sws-cook-45a-out" },
  "cooker_outlet_plate": { id: "mat-sws-cook-45a-out" },
  "ev_charger_rcbo": { id: "mat-iso-dp-63a" },
  "2.5mm2_power_cable": { id: "mat-cab-twe-2c-e-2p5" },
  "4mm2_phase_conductor": { id: "mat-cab-sc-cu-4" },
  "4mm2_neutral_conductor": { id: "mat-cab-sc-cu-4" },
  "6mm2_phase_conductor": { id: "mat-cab-sc-cu-6" },
  "6mm2_neutral_conductor": { id: "mat-cab-sc-cu-6" },
  "1.5mm2_phase_conductor": { id: "mat-cab-twe-2c-e-1p5" },
  "1.5mm2_neutral_conductor": { id: "mat-cab-twe-2c-e-1p5" },
  "25mm_conduit": { id: "mat-con-pvc-25", convert: "metres-to-lengths", unitLength: 3 },
  "external_containment": { id: "mat-con-pvc-25", convert: "metres-to-lengths", unitLength: 3 },

  double_13a_socket: { id: "mat-sws-soc-13a-2g" },
  socket_mounting_box: { id: "mat-acc-box-2g-35" },
  switch_mechanism: { id: "mat-sws-sw-1g1w" },
  switch_mounting_box: { id: "mat-acc-box-1g-35" },
  light_fitting_allowance: { id: "mat-lgt-down-12w" },
  ceiling_junction_box: { id: "mat-con-jbox-100" },
  "2.5mm2_phase_conductor": { id: "mat-cab-sc-cu-2p5" },
  "2.5mm2_neutral_conductor": { id: "mat-cab-sc-cu-2p5" },
  cpc_conductor: { id: "mat-cab-sc-gy-2p5" },
  lighting_conductors: { id: "mat-cab-twe-2c-e-1p5" },
  "20mm_conduit": { id: "mat-con-pvc-20", convert: "metres-to-lengths", unitLength: 3 },
  conduit_coupler: { id: "mat-con-coup-20" },
  conduit_bend: { id: "mat-con-bend-20" },
  draw_box: { id: "mat-con-ibox-20" },
  earth_electrode: { id: "mat-ear-rod-16x1200" },
  earth_clamp: { id: "mat-ear-clamp" },
  earth_inspection_chamber: { id: "mat-ear-pit" },
  main_earthing_conductor: { id: "mat-cab-sc-gy-6" },
};

export interface PriceEntry {
  price: number;
  brand: string | null;
  source: string | null;
  updatedAt: string | null;
}

export interface PricedLine {
  materialKey: string;
  name: string;
  catalogueId: string;
  catalogueName: string;
  catalogueUnit: string;
  /** Quantity in catalogue units (metres, lengths, each). */
  quantity: number;
  engineeringQuantity: number;
  purchaseQuantity: number;
  unitPrice: number | null;
  amount: number | null;
  brand: string | null;
  confidence: MaterialQuantity["confidence"];
  trace: string[];
}

export interface CatalogueMaterialInfo {
  id: string;
  name: string;
  unit: string;
}

/** Aggregates engine lines that point at the same catalogue material. */
export function priceQuantities(
  materials: MaterialQuantity[],
  prices: Record<string, PriceEntry>,
  catalogue: Map<string, CatalogueMaterialInfo>,
): PricedLine[] {
  const merged = new Map<string, PricedLine>();

  for (const material of materials) {
    const link = MATERIAL_CATALOGUE[material.material_key];
    if (!link?.id) continue;
    const info = catalogue.get(link.id);
    if (!info) continue;

    // Everything a person sees is in catalogue units: lengths of conduit, metres of
    // cable, pieces of accessories. The engineering quantity stays in metres.
    const unitLength = link.unitLength ?? 3;
    const convert = link.convert === "metres-to-lengths";
    const quantity = convert
      ? Math.ceil(material.engineering_quantity / unitLength)
      : material.purchase_quantity;
    const purchase = quantity;

    const existing = merged.get(link.id);
    if (existing) {
      existing.quantity = Math.round((existing.quantity + quantity) * 10) / 10;
      existing.engineeringQuantity = Math.round((existing.engineeringQuantity + material.engineering_quantity) * 10) / 10;
      existing.purchaseQuantity = Math.round((existing.purchaseQuantity + purchase) * 10) / 10;
      // a merged line (phase + neutral, for example) must total both runs
      existing.amount =
        existing.unitPrice == null ? null : Math.round(existing.unitPrice * existing.quantity * 100) / 100;
      existing.trace = [...existing.trace, ...material.trace];
      continue;
    }

    const price = prices[link.id];
    merged.set(link.id, {
      materialKey: material.material_key,
      name: material.name,
      catalogueId: link.id,
      catalogueName: info.name,
      catalogueUnit: info.unit,
      quantity,
      engineeringQuantity: material.engineering_quantity,
      purchaseQuantity: purchase,
      unitPrice: price ? price.price : null,
      amount: price ? Math.round(price.price * quantity * 100) / 100 : null,
      brand: price?.brand ?? null,
      confidence: material.confidence,
      trace: [...material.trace],
    });
  }

  return Array.from(merged.values()).sort((a, b) => a.catalogueName.localeCompare(b.catalogueName));
}

export const CONFIDENCE_NOTE =
  "Quantities are preliminary estimating outputs. They do not replace compliant electrical design and installation by qualified professionals.";
