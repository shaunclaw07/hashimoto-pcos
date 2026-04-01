import Database from 'better-sqlite3';
import path from 'path';
import type { OpenFoodFactsProduct } from '@/lib/openfoodfacts';

export interface DbProductRow {
  barcode:          string;
  product_name:     string | null;
  brands:           string | null;
  image_url:        string | null;
  nutriscore_grade: string | null;
  ingredients_text: string | null;
  allergens:        string | null;
  additives_tags:   string | null;
  nutriments:       string | null;
  categories:       string | null;
  categories_tags:  string | null;
  labels:           string | null;
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = path.join(process.cwd(), 'data', 'products.db');
    _db = new Database(dbPath, { readonly: true });
  }
  return _db;
}

export function rowToProduct(row: DbProductRow): OpenFoodFactsProduct {
  return {
    product_name:     row.product_name     ?? undefined,
    brands:           row.brands           ?? undefined,
    image_url:        row.image_url        ?? undefined,
    nutriscore_grade: row.nutriscore_grade ?? undefined,
    ingredients_text: row.ingredients_text ?? undefined,
    allergens:        row.allergens        ?? undefined,
    additives: row.additives_tags
      ? row.additives_tags.split(',').map(t => t.trim()).filter(Boolean)
      : [],
    nutriments:  row.nutriments  ? JSON.parse(row.nutriments)  : undefined,
    categories:  row.categories  ?? undefined,
    labels:      row.labels      ?? undefined,
  };
}
