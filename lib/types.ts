/** Domain types shared across the ESTIMO app. */

export type CatalogueMaterial = {
  id: string;
  code: string;
  name: string;
  purpose: string;
  spec: string;
  tier: string;
  relevance: string;
  keywords: string[];
  categoryCode: string;
  category: string;
  unitCode: string;
  unit: string;
};

/** A material line held in the browser estimate basket. */
export type BasketItem = {
  materialId: string;
  name: string;
  category: string;
  unit: string;
  /** Which estimate the line belongs to, so several can share the basket. */
  groupId?: string;
  groupName?: string;
  quantity: number;
  priceGhs: number | null;
  brandName: string | null;
  supplierName: string | null;
  verifiedAt: string | null;
};

export type SavedEstimateItem = {
  name: string;
  quantity: number;
  unit: string;
  /** Unit price at the time it was added, when one was published. */
  priceGhs?: number | null;
};

/** The take-off behind a saved estimate, so it can be reopened as it was. */
export type SavedQuantities = {
  templateId: string;
  specLevel: string;
  ruleSet: string;
  spaces: {
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
  }[];
  overrides?: { space_id: string; point_type: string; value: number; source: string }[];
};

export type SavedEstimate = {
  id: string;
  name: string;
  kind: "quick" | "materials";
  createdAt: string;
  detail: string;
  totalGhs: number | null;
  items?: SavedEstimateItem[];
  /** Editable selection, so a saved estimate can be reopened and adjusted. */
  template?: string;
  counts?: Record<string, number>;
  quality?: string;
  quantities?: SavedQuantities;
};
