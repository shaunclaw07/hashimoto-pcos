// src/infrastructure/sqlite/sqlite-client.ts
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

export interface DbProductRow {
  barcode: string;
  product_name: string | null;
  brands: string | null;
  image_url: string | null;
  nutriscore_grade: string | null;
  ingredients_text: string | null;
  allergens: string | null;
  additives_tags: string | null;
  nutriments: string | null;
  categories: string | null;
  categories_tags: string | null;
  labels: string | null;
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dbPath = path.join(process.cwd(), "data", "products.db");
    const dataDir = path.dirname(dbPath);

    // Ensure the data directory exists (recursive)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    try {
      _db = new Database(dbPath);
    } catch (err) {
      throw new Error(`Database initialization failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  return _db;
}
