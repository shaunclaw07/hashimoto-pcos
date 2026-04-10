#!/usr/bin/env node
// scripts/build-db.mjs
// Usage: node scripts/build-db.mjs [path/to/en.openfoodfacts.org.products.csv]
// Usage (minimal): node scripts/build-db.mjs --minimal

import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { parseIngredients, isValidProductName } from './ingredient-parser.mjs';
import { KNOWN_INGREDIENTS } from './ingredient-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isMinimal = process.argv.includes('--minimal');
const CSV_PATH = isMinimal
  ? null
  : (process.argv[2] ?? path.join(__dirname, '..', 'en.openfoodfacts.org.products.csv'));
const DB_PATH = path.join(__dirname, '..', 'data', 'products.db');

const DACH_TAGS = new Set(['en:germany', 'en:austria', 'en:switzerland']);

// Minimum number of nutriment fields that must have a valid numeric value
const MIN_NUTRIMENTS = 5;

const NUTRIMENT_FIELDS = [
  'energy-kcal_100g',
  'sugars_100g',
  'fat_100g',
  'saturated-fat_100g',
  'fiber_100g',
  'proteins_100g',
  'salt_100g',
  'sodium_100g',
];

function isValidEan13(code) {
  return /^\d{13}$/.test(code ?? '');
}

function isDach(countriesTags) {
  if (!countriesTags) return false;
  return countriesTags.split(',').some(t => DACH_TAGS.has(t.trim()));
}

function parseNutriments(r) {
  const values = {};
  let count = 0;
  for (const field of NUTRIMENT_FIELDS) {
    const raw = r[field];
    const num = raw !== '' && raw != null ? parseFloat(raw) : NaN;
    const val = Number.isFinite(num) ? num : null;
    values[field] = val;
    if (val !== null) count++;
  }
  return { values, count };
}

/**
 * Creates the database schema (tables, FTS index, relations).
 * Reusable for both full and minimal builds.
 */
function createSchema(db) {
  db.exec(`
    CREATE TABLE products (
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
    CREATE VIRTUAL TABLE products_fts USING fts5(
      barcode       UNINDEXED,
      product_name,
      brands,
      content='products',
      content_rowid='rowid'
    );
    CREATE TABLE ingredients (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL UNIQUE
    );
    CREATE TABLE product_ingredients (
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

// ── Setup DB ──────────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Removed existing database.');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// ── Minimal mode: schema + ingredients only ───────────────────────────────────
if (isMinimal) {
  createSchema(db);

  // Import all known ingredients
  const stmtUpsert = db.prepare(`INSERT OR IGNORE INTO ingredients(name) VALUES (?)`);
  const insertIngredients = db.transaction(() => {
    for (const name of KNOWN_INGREDIENTS) {
      stmtUpsert.run(name);
    }
  });
  insertIngredients();

  db.close();
  console.log(`Done! Minimal database created at ${DB_PATH}`);
  console.log(`  Ingredients imported: ${KNOWN_INGREDIENTS.size}`);
  process.exit(0);
}

// ── Full mode: proceed with CSV import ────────────────────────────────────────
createSchema(db);

const stmtInsert = db.prepare(`
  INSERT OR REPLACE INTO products
    (barcode, product_name, brands, image_url, nutriscore_grade,
     ingredients_text, allergens, additives_tags, nutriments,
     categories, categories_tags, labels)
  VALUES
    (@barcode, @product_name, @brands, @image_url, @nutriscore_grade,
     @ingredients_text, @allergens, @additives_tags, @nutriments,
     @categories, @categories_tags, @labels)
`);

const stmtFts = db.prepare(`
  INSERT INTO products_fts(rowid, barcode, product_name, brands)
  VALUES (
    (SELECT rowid FROM products WHERE barcode = @barcode),
    @barcode, @product_name, @brands
  )
`);

// Pre-load existing ingredients for O(1) lookup (populated during bulk insert)
const ingredientIdByName = new Map();
const stmtUpsertIngredient = db.prepare(`
  INSERT OR IGNORE INTO ingredients(name) VALUES (?)
`);
const stmtGetIngredientId = db.prepare(`SELECT id FROM ingredients WHERE name = ?`);
const stmtInsertPI = db.prepare(`
  INSERT OR IGNORE INTO product_ingredients(barcode, ingredient_id, raw_text, position)
  VALUES (?, ?, ?, ?)
`);

function upsertIngredient(canonical) {
  let id = ingredientIdByName.get(canonical);
  if (id !== undefined) return id;

  stmtUpsertIngredient.run(canonical);
  const row = stmtGetIngredientId.get(canonical);
  id = row.id;
  ingredientIdByName.set(canonical, id);
  return id;
}

const insertBatch = db.transaction((rows) => {
  for (const row of rows) {
    stmtInsert.run(row);
    stmtFts.run({
      barcode: row.barcode,
      product_name: row.product_name ?? '',
      brands: row.brands ?? '',
    });

    // Parse and insert normalized ingredients
    if (row.ingredients_text) {
      const parsed = parseIngredients(row.ingredients_text);
      for (let i = 0; i < parsed.length; i++) {
        const { raw, canonical } = parsed[i];
        const ingId = upsertIngredient(canonical);
        stmtInsertPI.run(row.barcode, ingId, raw, i);
      }
      ingredientTotal += parsed.length;
    }
  }
});

// ── Stream CSV ────────────────────────────────────────────────────────────────
let total = 0;
let inserted = 0;
let ingredientTotal = 0;
const batch = [];
const BATCH_SIZE = 1000;

console.log(`Reading: ${CSV_PATH}`);
console.log(`Filtering DACH products (DE/AT/CH) with valid EAN-13 barcodes, >=${MIN_NUTRIMENTS} nutriments, and non-empty product name...\n`);

const parser = createReadStream(CSV_PATH).pipe(
  parse({
    delimiter: '\t',
    columns: true,
    relax_column_count: true,
    skip_empty_lines: true,
    quote: false,
  })
);

for await (const r of parser) {
  total++;
  if (total % 50_000 === 0) {
    process.stdout.write(`\rRows: ${total.toLocaleString('de-DE')}  |  Inserted: ${inserted.toLocaleString('de-DE')}`);
  }

  if (!isValidEan13(r.code)) continue;
  if (!isDach(r.countries_tags)) continue;

  // Use German product name if available, else fallback
  const productName = r.product_name_de || r.product_name || null;
  if (!isValidProductName(productName)) continue;

  const { values, count } = parseNutriments(r);
  if (count < MIN_NUTRIMENTS) continue;

  const nutriments = JSON.stringify({
    'energy-kcal_100g':   values['energy-kcal_100g'],
    sugars_100g:          values['sugars_100g'],
    fat_100g:             values['fat_100g'],
    'saturated-fat_100g': values['saturated-fat_100g'],
    fiber_100g:           values['fiber_100g'],
    proteins_100g:        values['proteins_100g'],
    salt_100g:            values['salt_100g'],
    sodium_100g:          values['sodium_100g'],
  });

  batch.push({
    barcode:          r.code,
    product_name:     productName,
    brands:           r.brands          || null,
    image_url:        r.image_front_small_url || r.image_small_url || r.image_url || null,
    nutriscore_grade: r.nutriscore_grade || null,
    ingredients_text: r.ingredients_text_de || r.ingredients_text || null,
    allergens:        r.allergens        || null,
    additives_tags:   r.additives_tags   || null,
    nutriments,
    categories:       r.categories       || null,
    categories_tags:  r.categories_tags  || null,
    labels:           r.labels           || null,
  });

  if (batch.length >= BATCH_SIZE) {
    insertBatch(batch);
    inserted += batch.length;
    batch.length = 0;
  }
}

if (batch.length > 0) {
  insertBatch(batch);
  inserted += batch.length;
}

db.close();
console.log(`\n\nDone!`);
console.log(`  CSV rows processed          : ${total.toLocaleString()}`);
console.log(`  DACH products inserted      : ${inserted.toLocaleString()} (>=${MIN_NUTRIMENTS} nutriments, valid name)`);
console.log(`  Ingredient mappings         : ${ingredientTotal.toLocaleString()}`);
console.log(`  Database                    : ${DB_PATH}`);
