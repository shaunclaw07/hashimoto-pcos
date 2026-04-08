#!/usr/bin/env node
// scripts/build-db.mjs
// Usage: node scripts/build-db.mjs [path/to/en.openfoodfacts.org.products.csv]

import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { isKnownIngredient } from './ingredient-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = process.argv[2] ?? path.join(__dirname, '..', 'en.openfoodfacts.org.products.csv');
const DB_PATH = path.join(__dirname, '..', 'data', 'products.db');

const DACH_TAGS = new Set(['en:germany', 'en:austria', 'en:switzerland']);

// Minimum number of nutriment fields that must have a valid numeric value
const MIN_NUTRIMENTS = 5;

// Known placeholder names to reject
const PLACEHOLDER_NAMES = new Set(['xxx', 'unknown', 'none', 'n/a', 'to be completed', '-']);

// Stop-words — fragments from nutrition tables that survive normalization
const STOP_WORDS = new Set([
  'nhrwerte', 'nahrwerte', 'zutaten', 'ingredients', 'inhaltsstoffe',
  'producent', 'hersteller', 'filledby', 'filled by', 'hinweis', 'portion',
  'serviervorschlag', 'durchschnitt', 'per 100', 'per portion', 'nr', 'art',
  'charge', 'mindesthaltbarkeit', 'verbraucher', 'konsumenten', 'erstellt',
  'hergestellt', 'importeur', 'imported by', 'imported', 'distributed',
  'distributeur', 'produit en', 'fabrique', 'fabriqué', 'hergestellt',
]);

function isValidProductName(name) {
  if (!name || typeof name !== 'string') return false;
  const t = name.trim();
  if (t.length < 2) return false;
  if (PLACEHOLDER_NAMES.has(t.toLowerCase())) return false;
  return true;
}

// ── Ingredient Parsing ──────────────────────────────────────────────────────────

/**
 * Parses an ingredients_text string into normalized ingredient segments.
 * Strategy: aggressive normalization + whitelist validation.
 * Only segments matching a known ingredient are kept.
 */
function parseIngredients(text) {
  if (!text || typeof text !== 'string') return [];

  // Split on comma, semicolon, or colon (used in "Säuerungsmittel: Citronensäure" patterns)
  const segments = text.split(/[,;:]/);
  const seen = new Set();
  const result = [];

  for (const rawSegment of segments) {
    let seg = rawSegment.trim();
    if (!seg) continue;

    // Step 1: Strip parenthetical content (quantities, percentages, descriptions)
    // Handles nested parens by repeating until stable
    let prev;
    do {
      prev = seg;
      seg = seg.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    } while (seg !== prev && seg.includes('('));

    // Step 2: Remove trailing percentages: "13,8%", "4.1%", "5 %", "0,0%"
    seg = seg.replace(/\d+[,.]?\d*\s*%\s*/g, '').trim();

    // Step 3: Normalize internal hyphens: "Soja - protein" → "Sojaprotein"
    seg = seg.replace(/([a-zäöüß])\s*-\s+([a-zäöüß])/gi, '$1$2').trim();
    // Also handle "Raps - Öl" → "RapsÖl" (uppercase-lowercase)
    seg = seg.replace(/([a-zäöüß])\s+-\s+([A-ZÄÖÜ])/g, '$1$2').trim();

    // Step 4: Remove encoding artifacts — isolated hyphen between lowercase chars
    // "ent - ölt" → "entölt", "4% - protein" → "protein"
    seg = seg.replace(/([a-zäöüß])\s*-\s+(?=[a-zäöüß])/gi, '$1').trim();

    // Step 5: Collapse multiple spaces, dashes, underscores
    seg = seg.replace(/\s{2,}/g, ' ').replace(/[_—–-]{2,}/g, ' ').trim();

    // Step 6: Clean Unicode artifacts: ×, •, °, ©, ®, ™, ¹, ², ³, etc.
    seg = seg.replace(/[×•°©®™¹²³⁴⁵⁶⁷⁸⁹@#$%^&®]+/g, ' ').trim();

    // Step 7: Strip E-number format: "E 412", "e 500" → "e412"
    seg = seg.replace(/^e\s*(\d+[a-z]?)\s*$/i, 'e$1').trim();

    // Step 8: Remove any remaining digits-only or digit-starting tokens
    // These are nutrition table fragments
    seg = seg.replace(/^[\d,.]+\s*/g, '').trim();
    if (!seg || /^\d+$/.test(seg)) continue;

    // Step 9: Remove segments that are clearly garbage
    if (seg.length < 2) continue;
    if (/^[^a-zäöüß]+$/i.test(seg)) continue; // only symbols/letters

    // Step 10: Lowercase for canonical form
    const canonical = seg.toLowerCase();

    // Step 11: Quick stop-word guard for nutrition-table fragments
    if (STOP_WORDS.has(canonical)) continue;

    // Step 12: Deduplicate
    if (seen.has(canonical)) continue;
    seen.add(canonical);

    // Step 13: Whitelist check — the primary filter
    if (!isKnownIngredient(canonical)) continue;

    result.push({ raw: rawSegment.trim(), canonical });
  }

  return result;
}

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

// ── Setup DB ──────────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log('Removed existing database.');
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

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
console.log(`Filtering DACH products (DE/AT/CH) with valid EAN-13 barcodes, ≥${MIN_NUTRIMENTS} nutriments, and non-empty product name...\n`);

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
console.log(`  DACH products inserted      : ${inserted.toLocaleString()} (≥${MIN_NUTRIMENTS} nutriments, valid name)`);
console.log(`  Ingredient mappings         : ${ingredientTotal.toLocaleString()}`);
console.log(`  Database                    : ${DB_PATH}`);
