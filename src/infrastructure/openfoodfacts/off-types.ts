// src/infrastructure/openfoodfacts/off-types.ts
// Internal OFF types — use only within the off-adapter.

export interface OffNutriments {
  "energy-kcal_100g"?: number;
  fat_100g?: number;
  "saturated-fat_100g"?: number;
  sugars_100g?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
}

export interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string | null;
  image_front_url?: string | null;
  ingredients_text?: string;
  additives?: string[];
  additives_tags?: string[];
  categories?: string;
  labels?: string;
  nutriments?: OffNutriments;
}

export interface OffApiResponse {
  status: number;
  status_verbose?: string;
  product?: OffProduct;
}

export interface OffSearchResponse {
  products?: OffProduct[];
  count?: number;
}
