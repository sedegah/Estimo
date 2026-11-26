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
  // a compound charger gets its own double-pole breaker: both poles isolated at the point
  mcb_dp_6: { id: "mat-pro-mcb-dp-6a" },
  mcb_dp_10: { id: "mat-pro-mcb-dp-10a" },
  mcb_dp_16: { id: "mat-pro-mcb-dp-16a" },
  mcb_dp_20: { id: "mat-pro-mcb-dp-20a" },
  mcb_dp_25: { id: "mat-pro-mcb-dp-32a" },
  mcb_dp_32: { id: "mat-pro-mcb-dp-32a" },
  mcb_dp_40: { id: "mat-pro-mcb-dp-63a" },
  mcb_dp_50: { id: "mat-pro-mcb-dp-63a" },
  mcb_dp_63: { id: "mat-pro-mcb-dp-63a" },
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

  // fan points: the fan itself, its regulator and its hook hang off the point count
  ceiling_fan: { id: "mat-fan-ceiling-56" },
  fan_regulator: { id: "mat-fan-regulator" },
  fan_hook: { id: "mat-fan-hook" },
};

/**
 * Budget rates for allowance items: things the estimate carries at a planning rate because
 * the exact model is chosen on site. A published catalogue price always wins over these.
 */
export const ALLOWANCE_PRICES_GHS: Record<string, number> = {
  "mat-fan-ceiling-56": 480,
  "mat-fan-regulator": 65,
  "mat-fan-hook": 30,
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

/** Aggregates engine lines that point at the same catalogue material. */
export function priceQuantities(
  materials: MaterialQuantity[],
  prices: Record<string, PriceEntry>,
  catalogue: Map<string, CatalogueMaterialInfo>,
): PricedLine[] {
  interface Collected {
    material: MaterialQuantity;
    info: CatalogueMaterialInfo;
    engineering: number;
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
      unitLength: link.unitLength ?? 3,
      convert: link.convert === "metres-to-lengths",
      trace: [...material.trace],
      origins: [...(material.origins ?? [])],
      mixed: !material.origins?.length,
    });
  }

  const lines: PricedLine[] = [];
  for (const [catalogueId, entry] of collected) {
    const published = prices[catalogueId];
    const allowance = ALLOWANCE_PRICES_GHS[catalogueId];
    const price: PriceEntry | undefined = published
      ? published
      : allowance !== undefined
        ? { price: allowance, brand: "ESTIMO allowance", source: "allowance", updatedAt: null }
        : undefined;
    // Priced on the measured quantity, rounded up to what is ordered: conduit in 3 m
    // lengths, everything else in whole units. Buying packs is a purchasing step; rounding
    // here would hide a load's cost inside a drum the plan has already paid for.
    const quantity = entry.convert
      ? Math.ceil(entry.engineering / entry.unitLength)
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

/**
 * Conductor sizes, smallest first, with the catalogue material that prices them. A smaller
 * cable must never cost more than the next size up: when it does, the price list has a bad
 * row and the estimate would be quietly wrong.
 */
const CONDUCTOR_PRICES: { id: string; label: string }[] = [
  { id: "mat-cab-sc-cu-1p5", label: "1.5 mm² copper single-core" },
  { id: "mat-cab-sc-cu-2p5", label: "2.5 mm² copper single-core" },
  { id: "mat-cab-sc-cu-4", label: "4 mm² copper single-core" },
  { id: "mat-cab-sc-cu-6", label: "6 mm² copper single-core" },
  { id: "mat-cab-sc-cu-10", label: "10 mm² copper single-core" },
  { id: "mat-cab-sc-cu-16", label: "16 mm² copper single-core" },
  { id: "mat-cab-sc-cu-25", label: "25 mm² copper single-core" },
];

/** Price-list problems that would make a cable estimate wrong, in plain words. */
export function conductorPriceWarnings(prices: Record<string, PriceEntry>): string[] {
  const warnings: string[] = [];
  for (let index = 0; index < CONDUCTOR_PRICES.length - 1; index += 1) {
    const smaller = CONDUCTOR_PRICES[index];
    const larger = CONDUCTOR_PRICES[index + 1];
    const small = prices[smaller.id]?.price;
    const big = prices[larger.id]?.price;
    if (small === undefined || big === undefined) continue;
    if (small > big * 1.5) {
      warnings.push(
        `Catalogue price check: ${smaller.label} is GHS ${small.toFixed(2)}/m but ${larger.label} is GHS ${big.toFixed(2)}/m. The smaller cable is priced higher, so small circuits look dearer than large ones; check the price list.`,
      );
    }
  }
  return warnings;
}
export const CONFIDENCE_NOTE =
  "Quantities are preliminary estimating outputs. They do not replace compliant electrical design and installation by qualified professionals.";
