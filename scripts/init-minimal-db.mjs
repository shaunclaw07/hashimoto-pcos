#!/usr/bin/env node
// scripts/init-minimal-db.mjs
// Minimal database initialization without external dependencies.
// Only requires better-sqlite3 (which is a production dependency).

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { KNOWN_INGREDIENTS } from './ingredient-data.mjs';
import { createSchema } from './create-schema.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'products.db');

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

// Set world-readable/writable permissions for the DB and its directory.
// Unlike chown, chmod works on any filesystem (including PVCs).
// The nextjs user (1001) will be able to read/write the DB.
try {
  fs.chmodSync(DB_PATH, 0o644);
  fs.chmodSync(dataDir, 0o777);
} catch (err) {
  console.warn('[init-minimal-db] chmod skipped:', err.message);
}

console.log(`[init-minimal-db] Done! Database created at ${DB_PATH}`);
console.log(`[init-minimal-db] Ingredients imported: ${KNOWN_INGREDIENTS.size}`);
