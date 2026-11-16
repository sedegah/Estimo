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
};
