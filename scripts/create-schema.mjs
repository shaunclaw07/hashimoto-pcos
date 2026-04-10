// scripts/create-schema.mjs
// Shared database schema definition used by build-db.mjs and init-minimal-db.mjs
// Centralized here to prevent schema drift between build tools.

/**
 * SQL to create all database tables, indexes, and FTS virtual table.
 * Must be kept in sync with src/infrastructure/sqlite/sqlite-schema.ts
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS products (
  barcode          TEXT PRIMARY KEY,
  product_name     TEXT NOT NULL,
  brands           TEXT,
  image_url        TEXT,
  nutriscore_grade TEXT,
  ingredients_text TEXT,
  allergens        TEXT,
  additives_tags   TEXT,
  nutriments       TEXT,
  categories       TEXT,
  categories_tags  TEXT,
  labels           TEXT
);
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  barcode       UNINDEXED,
  product_name,
  brands,
  content='products',
  content_rowid='rowid'
);
CREATE TABLE IF NOT EXISTS ingredients (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS product_ingredients (
  barcode        TEXT NOT NULL,
  ingredient_id  INTEGER NOT NULL,
  raw_text       TEXT NOT NULL,
  position       INTEGER NOT NULL,
  FOREIGN KEY (barcode) REFERENCES products(barcode) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
  PRIMARY KEY (barcode, position),
  UNIQUE (barcode, ingredient_id)
);
`;

/**
 * Creates all database tables (schema) for the products database.
 * Idempotent — uses CREATE TABLE IF NOT EXISTS so it is safe to call
 * on an already-initialized database.
 *
 * @param {Database} db - better-sqlite3 database instance
 */
export function createSchema(db) {
  db.exec(SCHEMA_SQL);
}
