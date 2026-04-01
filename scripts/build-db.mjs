#!/usr/bin/env node
// scripts/build-db.mjs
// Usage: node scripts/build-db.mjs [path/to/en.openfoodfacts.org.products.csv]

import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = process.argv[2] ?? path.join(__dirname, '..', 'en.openfoodfacts.org.products.csv');
const DB_PATH = path.join(__dirname, '..', 'data', 'products.db');

const DACH_TAGS = new Set(['en:germany', 'en:austria', 'en:switzerland']);

function isValidEan13(code) {
  return /^\d{13}$/.test(code ?? '');
}

function isDach(countriesTags) {
  if (!countriesTags) return false;
  return countriesTags.split(',').some(t => DACH_TAGS.has(t.trim()));
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
    product_name     TEXT,
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

const insertBatch = db.transaction((rows) => {
  for (const row of rows) {
    stmtInsert.run(row);
    stmtFts.run({
      barcode: row.barcode,
      product_name: row.product_name ?? '',
      brands: row.brands ?? '',
    });
  }
});

// ── Stream CSV ────────────────────────────────────────────────────────────────
let total = 0;
let inserted = 0;
const batch = [];
const BATCH_SIZE = 1000;

console.log(`Reading: ${CSV_PATH}`);
console.log('Filtering DACH products (DE/AT/CH) with valid EAN-13 barcodes...\n');

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

  const nutriments = JSON.stringify({
    'energy-kcal_100g':   parseFloat(r['energy-kcal_100g'])   || null,
    sugars_100g:          parseFloat(r.sugars_100g)            || null,
    fat_100g:             parseFloat(r.fat_100g)               || null,
    'saturated-fat_100g': parseFloat(r['saturated-fat_100g'])  || null,
    fiber_100g:           parseFloat(r.fiber_100g)             || null,
    proteins_100g:        parseFloat(r.proteins_100g)          || null,
    salt_100g:            parseFloat(r.salt_100g)              || null,
    sodium_100g:          parseFloat(r.sodium_100g)            || null,
  });

  batch.push({
    barcode:          r.code,
    product_name:     r.product_name_de || r.product_name || null,
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
console.log(`\n\nFertig!`);
console.log(`  CSV-Zeilen verarbeitet : ${total.toLocaleString('de-DE')}`);
console.log(`  DACH-Produkte inserted : ${inserted.toLocaleString('de-DE')}`);
console.log(`  Datenbank              : ${DB_PATH}`);
