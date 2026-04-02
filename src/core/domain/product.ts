export interface Nutriments {
  energyKcal?: number;
  fat?: number;
  saturatedFat?: number;
  carbohydrates?: number;
  sugars?: number;
  fiber?: number;
  protein?: number;
  salt?: number;
}

export interface Product {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutriments: Nutriments;
  labels: string[];
  ingredients: string;
  categories: string[];
  additives: string[];
}

export interface SearchQuery {
  terms?: string;
  category?: string;
  page: number;
  pageSize: number;
}

export interface SearchResult {
  products: Product[];
  total: number;
  page: number;
}
