export type CatalogueItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  spec: string;
  tier: string;
  relevance: string;
  keywords: string | null;
  price_ghs: number | null;
  price_updated_at: string | null;
};
