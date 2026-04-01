#!/usr/bin/env node
// scripts/extract-fixtures.mjs
// Extracts test fixture products from products.db and writes them to tests/fixtures/products/
// Usage: node scripts/extract-fixtures.mjs

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'products.db');
const OUT_DIR = path.join(__dirname, '..', 'tests', 'fixtures', 'products');

const FIXTURES = {
  'sehr-gut':    '0058504211064', // Green Lentils — SEHR GUT
  'gut':         '0011110009234', // 100% Whole Wheat Bagels — GUT
  'neutral':     '0000683442920', // Designer Whey Protein Vanilla — NEUTRAL
  'weniger-gut': '0009000837100', // Schafsalami — WENIGER GUT
  'vermeiden':   '0009800895007', // Hazelnut Spread with Cocoa (nutella) — VERMEIDEN
};

const db = new Database(DB_PATH, { readonly: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const [name, barcode] of Object.entries(FIXTURES)) {
  const row = db.prepare('SELECT * FROM products WHERE barcode = ?').get(barcode);
  if (!row) {
    console.warn(`⚠ Barcode ${barcode} (${name}) not found in DB`);
    continue;
  }

  const product = {
    product_name:     row.product_name     ?? undefined,
    brands:           row.brands           ?? undefined,
    image_url:        row.image_url        ?? undefined,
    nutriscore_grade: row.nutriscore_grade ?? undefined,
    ingredients_text: row.ingredients_text ?? undefined,
    allergens:        row.allergens        ?? undefined,
    additives: row.additives_tags
      ? row.additives_tags.split(',').map(t => t.trim()).filter(Boolean)
      : [],
    nutriments: row.nutriments ? JSON.parse(row.nutriments) : undefined,
    categories:  row.categories  ?? undefined,
    labels:      row.labels      ?? undefined,
  };

  const fixture = { barcode, ...product };
  const outPath = path.join(OUT_DIR, `${name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2) + '\n');
  console.log(`✓ ${name}.json  (${row.product_name}, ${barcode})`);
}

db.close();
console.log(`\nFixtures written to ${OUT_DIR}`);
