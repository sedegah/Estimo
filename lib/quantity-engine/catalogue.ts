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
  "data_cable": { id: "mat-cab-data-cat6" },
  "load_sized_power_cable": { id: "mat-cab-swa-4c-6" },
  "load_sized_containment": { id: "mat-con-pvc-25", convert: "metres-to-lengths", unitLength: 3 },
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

  // Special-load circuits: the configurator sizes devices and cables per load, so each
  // rating and each conductor size needs its own line to be priced honestly.
  mcb_sp_6: { id: "mat-pro-mcb-sp-6a" },
  mcb_sp_10: { id: "mat-pro-mcb-sp-10a" },
  mcb_sp_16: { id: "mat-pro-mcb-sp-16a" },
  mcb_sp_20: { id: "mat-pro-mcb-sp-20a" },
  mcb_sp_25: { id: "mat-pro-mcb-sp-25a" },
  mcb_sp_32: { id: "mat-pro-mcb-sp-32a" },
  mcb_sp_40: { id: "mat-pro-mcb-sp-40a" },
  mcb_sp_50: { id: "mat-pro-mcb-sp-50a" },
  mcb_sp_63: { id: "mat-pro-mcb-sp-63a" },
  mcb_tp_6: { id: "mat-pro-mcb-tp-10a" },
  mcb_tp_10: { id: "mat-pro-mcb-tp-10a" },
  mcb_tp_16: { id: "mat-pro-mcb-tp-16a" },
  mcb_tp_20: { id: "mat-pro-mcb-tp-20a" },
  mcb_tp_25: { id: "mat-pro-mcb-tp-25a" },
  mcb_tp_32: { id: "mat-pro-mcb-tp-32a" },
  mcb_tp_40: { id: "mat-pro-mcb-tp-63a" },
  mcb_tp_50: { id: "mat-pro-mcb-tp-63a" },
  mcb_tp_63: { id: "mat-pro-mcb-tp-63a" },
  rccb_2p_30ma: { id: "mat-pro-rccb-2p-63a-30" },
  rccb_4p_30ma: { id: "mat-pro-rccb-4p-63a-30" },
  isolator_dp_32: { id: "mat-iso-dp-32a" },
  isolator_dp_63: { id: "mat-iso-dp-63a" },
  isolator_tpn_32: { id: "mat-iso-tpn-32a" },
  isolator_tpn_63: { id: "mat-iso-tpn-63a" },
  socket_13a_double: { id: "mat-sws-soc-13a-2g" },
  socket_box_2g: { id: "mat-acc-box-2g-35" },
  fcu_13a: { id: "mat-sws-fcu-13a" },
  cooker_switch_45a: { id: "mat-sws-cook-45a-dp" },
  cooker_outlet: { id: "mat-sws-cook-45a-out" },
  special_phase_1p5: { id: "mat-cab-sc-cu-1p5" },
  special_neutral_1p5: { id: "mat-cab-sc-cu-1p5" },
  special_cpc_1p5: { id: "mat-cab-sc-gy-1p5" },
  special_phase_2p5: { id: "mat-cab-sc-cu-2p5" },
  special_neutral_2p5: { id: "mat-cab-sc-cu-2p5" },
  special_cpc_2p5: { id: "mat-cab-sc-gy-2p5" },
  special_phase_4: { id: "mat-cab-sc-cu-4" },
  special_neutral_4: { id: "mat-cab-sc-cu-4" },
  special_cpc_4: { id: "mat-cab-sc-cu-4" },
  special_phase_6: { id: "mat-cab-sc-cu-6" },
  special_neutral_6: { id: "mat-cab-sc-cu-6" },
  special_cpc_6: { id: "mat-cab-sc-gy-6" },
  special_phase_10: { id: "mat-cab-sc-cu-10" },
  special_neutral_10: { id: "mat-cab-sc-cu-10" },
  special_cpc_10: { id: "mat-cab-sc-gy-10" },
  special_phase_16: { id: "mat-cab-sc-cu-16" },
  special_neutral_16: { id: "mat-cab-sc-cu-16" },
  special_cpc_16: { id: "mat-cab-sc-gy-16" },
  special_phase_25: { id: "mat-cab-sc-cu-25" },
  special_neutral_25: { id: "mat-cab-sc-cu-25" },
  special_cpc_25: { id: "mat-cab-sc-gy-16" },
  special_phase_35: { id: "mat-cab-sc-cu-35" },
  special_neutral_35: { id: "mat-cab-sc-cu-35" },
  special_cpc_35: { id: "mat-cab-sc-gy-16" },
  conduit_20: { id: "mat-con-pvc-20", convert: "metres-to-lengths", unitLength: 3 },
  conduit_25: { id: "mat-con-pvc-25", convert: "metres-to-lengths", unitLength: 3 },
  conduit_32: { id: "mat-con-pvc-32", convert: "metres-to-lengths", unitLength: 3 },
  conduit_coupler_20: { id: "mat-con-coup-20" },
  conduit_coupler_25: { id: "mat-con-coup-25" },
  conduit_coupler_32: { id: "mat-con-coup-25" },
  conduit_bend_20: { id: "mat-con-bend-20" },
  conduit_bend_25: { id: "mat-con-bend-25" },
  conduit_bend_32: { id: "mat-con-bend-25" },
  draw_box_20: { id: "mat-con-ibox-20" },
  draw_box_25: { id: "mat-con-ibox-20" },
  draw_box_32: { id: "mat-con-ibox-20" },
  trunking_38x25: { id: "mat-trk-pvc-38x25", convert: "metres-to-lengths", unitLength: 3 },
  trunking_50x50: { id: "mat-trk-pvc-50x50", convert: "metres-to-lengths", unitLength: 3 },
  termination_lug_6: { id: "mat-term-lug-cu-6" },
  termination_lug_10: { id: "mat-term-lug-cu-10" },
  termination_lug_16: { id: "mat-term-lug-cu-16" },
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
  /** Special loads whose materials this line includes, for the bill to show. */
  origins: string[];
  /** True when the line also carries materials that no special load asked for. */
  mixed: boolean;
}

export interface CatalogueMaterialInfo {
  id: string;
  name: string;
  unit: string;
}

export interface PriceOptions {
  /**
   * Price what the job measures rather than what it buys.
   *
   * The bill rounds cable into 100 m rolls and conduit into 3 m lengths, because that is
   * what leaves the merchant. Attributing a whole roll to one appliance would say a fridge
   * costs more than the cable for the house, so a per-load figure is priced by the metre.
   */
  measured?: boolean;
}

/** Aggregates engine lines that point at the same catalogue material. */
export function priceQuantities(
  materials: MaterialQuantity[],
  prices: Record<string, PriceEntry>,
  catalogue: Map<string, CatalogueMaterialInfo>,
  options: PriceOptions = {},
): PricedLine[] {
  interface Collected {
    material: MaterialQuantity;
    info: CatalogueMaterialInfo;
    engineering: number;
    pack: number | null;
    unitLength: number;
    convert: boolean;
    trace: string[];
    origins: string[];
    mixed: boolean;
  }

  // First pass: merge by catalogue material and add up what the job measures. Rounding
  // happens once, after the merge: phase, neutral and earth of one run are one drum, not
  // three, and two short appliance runs do not each buy their own.
  const collected = new Map<string, Collected>();

  for (const material of materials) {
    const link = MATERIAL_CATALOGUE[material.material_key];
    if (!link?.id) continue;
    const info = catalogue.get(link.id);
    if (!info) continue;

    const existing = collected.get(link.id);
    if (existing) {
      existing.engineering = Math.round((existing.engineering + material.engineering_quantity) * 10) / 10;
      existing.pack = existing.pack ?? material.pack_size ?? null;
      existing.trace = [...existing.trace, ...material.trace].slice(0, 8);
      if (!material.origins?.length) existing.mixed = true;
      for (const name of material.origins ?? []) {
        if (!existing.origins.includes(name)) existing.origins.push(name);
      }
      continue;
    }

    collected.set(link.id, {
      material,
      info,
      engineering: material.engineering_quantity,
      pack: material.pack_size ?? null,
      unitLength: link.unitLength ?? 3,
      convert: link.convert === "metres-to-lengths",
      trace: [...material.trace],
      origins: [...(material.origins ?? [])],
      mixed: !material.origins?.length,
    });
  }

  const lines: PricedLine[] = [];
  for (const [catalogueId, entry] of collected) {
    const price = prices[catalogueId];
    const quantity = entry.convert
      ? Math.ceil(entry.engineering / entry.unitLength)
      : options.measured
        ? entry.engineering
        : entry.pack
          ? Math.ceil(entry.engineering / entry.pack) * entry.pack
          : Math.ceil(entry.engineering);

    lines.push({
      materialKey: entry.material.material_key,
      name: entry.material.name,
      catalogueId,
      catalogueName: entry.info.name,
      catalogueUnit: entry.info.unit,
      quantity,
      engineeringQuantity: entry.engineering,
      purchaseQuantity: quantity,
      unitPrice: price ? price.price : null,
      amount: price ? Math.round(price.price * quantity * 100) / 100 : null,
      brand: price?.brand ?? null,
      confidence: entry.material.confidence,
      trace: entry.trace,
      origins: entry.origins,
      mixed: entry.mixed,
    });
  }

  return lines.sort((a, b) => a.catalogueName.localeCompare(b.catalogueName));
}

export const CONFIDENCE_NOTE =
  "Quantities are preliminary estimating outputs. They do not replace compliant electrical design and installation by qualified professionals.";
