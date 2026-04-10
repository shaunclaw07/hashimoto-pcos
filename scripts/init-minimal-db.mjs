#!/usr/bin/env node
// scripts/init-minimal-db.mjs
// Minimal database initialization without external dependencies.
// Only requires better-sqlite3 (which is a production dependency).

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { KNOWN_INGREDIENTS } from './ingredient-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'products.db');

/**
 * Creates the database schema (tables, FTS index, relations).
 */
function createSchema(db) {
  db.exec(`
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
  `);
}

// Main
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (fs.existsSync(DB_PATH)) {
  console.log('[init-minimal-db] Database already exists, skipping initialization.');
  process.exit(0);
}

console.log('[init-minimal-db] Creating minimal database...');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

createSchema(db);

// Import all known ingredients
const stmtUpsert = db.prepare('INSERT OR IGNORE INTO ingredients(name) VALUES (?)');
const insertIngredients = db.transaction(() => {
  for (const name of KNOWN_INGREDIENTS) {
    stmtUpsert.run(name);
  }
});
insertIngredients();

db.close();

console.log(`[init-minimal-db] Done! Database created at ${DB_PATH}`);
console.log(`[init-minimal-db] Ingredients imported: ${KNOWN_INGREDIENTS.size}`);
