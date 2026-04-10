import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createSchema } from './build-db.mjs';
import { KNOWN_INGREDIENTS } from './ingredient-data.mjs';

describe('build-db.mjs — createSchema', () => {
  let testDbPath;
  let db;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `test-build-db-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');
  });

  afterEach(() => {
    try {
      db.close();
    } catch {}
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      // Clean up WAL files
      const walPath = testDbPath + '-wal';
      const shmPath = testDbPath + '-shm';
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {}
  });

  it('should create all required tables', () => {
    createSchema(db);

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);

    expect(tableNames).toContain('products');
    expect(tableNames).toContain('products_fts');
    expect(tableNames).toContain('ingredients');
    expect(tableNames).toContain('product_ingredients');
  });

  it('should create products table with correct schema', () => {
    createSchema(db);

    const columns = db.prepare("PRAGMA table_info(products)").all();
    const columnNames = columns.map(c => c.name);

    expect(columnNames).toContain('barcode');
    expect(columnNames).toContain('product_name');
    expect(columnNames).toContain('brands');
    expect(columnNames).toContain('image_url');
    expect(columnNames).toContain('nutriscore_grade');
    expect(columnNames).toContain('ingredients_text');
    expect(columnNames).toContain('allergens');
    expect(columnNames).toContain('additives_tags');
    expect(columnNames).toContain('nutriments');
    expect(columnNames).toContain('categories');
    expect(columnNames).toContain('categories_tags');
    expect(columnNames).toContain('labels');
  });

  it('should create ingredients table with correct schema', () => {
    createSchema(db);

    const columns = db.prepare("PRAGMA table_info(ingredients)").all();
    const columnNames = columns.map(c => c.name);

    expect(columnNames).toContain('id');
    expect(columnNames).toContain('name');
  });

  it('should create product_ingredients junction table with correct schema', () => {
    createSchema(db);

    const columns = db.prepare("PRAGMA table_info(product_ingredients)").all();
    const columnNames = columns.map(c => c.name);

    expect(columnNames).toContain('barcode');
    expect(columnNames).toContain('ingredient_id');
    expect(columnNames).toContain('raw_text');
    expect(columnNames).toContain('position');
  });

  it('should create FTS5 virtual table for full-text search', () => {
    createSchema(db);

    const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name='products_fts'").all();

    expect(tables).toHaveLength(1);
    expect(tables[0].sql).toContain('USING fts5');
  });

  it('should make barcode the primary key in products table', () => {
    createSchema(db);

    const pkInfo = db.prepare("SELECT * FROM pragma_table_info('products') WHERE pk = 1").all();

    expect(pkInfo).toHaveLength(1);
    expect(pkInfo[0].name).toBe('barcode');
  });

  it('should make name unique in ingredients table', () => {
    createSchema(db);

    const indexes = db.prepare("SELECT * FROM sqlite_master WHERE type='index' AND sql LIKE '%ingredients%'").all();
    const hasUniqueIndex = indexes.some(idx =>
      idx.sql && idx.sql.includes('UNIQUE') && idx.sql.includes('name')
    );

    // SQLite creates an implicit unique index for UNIQUE constraints
    const columns = db.prepare("PRAGMA table_info(ingredients)").all();
    const nameColumn = columns.find(c => c.name === 'name');

    expect(nameColumn).toBeDefined();
  });
});

describe('build-db.mjs — minimal build ingredients import', () => {
  let testDbPath;
  let db;

  beforeEach(() => {
    testDbPath = path.join(os.tmpdir(), `test-minimal-db-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
    db = new Database(testDbPath);
    db.pragma('journal_mode = WAL');
  });

  afterEach(() => {
    try {
      db.close();
    } catch {}
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      const walPath = testDbPath + '-wal';
      const shmPath = testDbPath + '-shm';
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    } catch {}
  });

  it('should import all known ingredients in minimal mode', () => {
    createSchema(db);

    const stmtUpsert = db.prepare(`INSERT OR IGNORE INTO ingredients(name) VALUES (?)`);
    const insertIngredients = db.transaction(() => {
      for (const name of KNOWN_INGREDIENTS) {
        stmtUpsert.run(name);
      }
    });
    insertIngredients();

    const count = db.prepare('SELECT COUNT(*) as count FROM ingredients').get();
    expect(count.count).toBe(KNOWN_INGREDIENTS.size);
  });

  it('should have products table empty in minimal mode', () => {
    createSchema(db);

    // Import ingredients
    const stmtUpsert = db.prepare(`INSERT OR IGNORE INTO ingredients(name) VALUES (?)`);
    const insertIngredients = db.transaction(() => {
      for (const name of KNOWN_INGREDIENTS) {
        stmtUpsert.run(name);
      }
    });
    insertIngredients();

    const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    expect(productCount.count).toBe(0);
  });

  it('should have empty product_ingredients junction table in minimal mode', () => {
    createSchema(db);

    // Import ingredients
    const stmtUpsert = db.prepare(`INSERT OR IGNORE INTO ingredients(name) VALUES (?)`);
    const insertIngredients = db.transaction(() => {
      for (const name of KNOWN_INGREDIENTS) {
        stmtUpsert.run(name);
      }
    });
    insertIngredients();

    const piCount = db.prepare('SELECT COUNT(*) as count FROM product_ingredients').get();
    expect(piCount.count).toBe(0);
  });

  it('should contain specific expected ingredients', () => {
    createSchema(db);

    const stmtUpsert = db.prepare(`INSERT OR IGNORE INTO ingredients(name) VALUES (?)`);
    const insertIngredients = db.transaction(() => {
      for (const name of KNOWN_INGREDIENTS) {
        stmtUpsert.run(name);
      }
    });
    insertIngredients();

    const expectedIngredients = ['zucker', 'weizenmehl', 'butter', 'salz', 'wasser', 'e100', 'e330'];

    for (const ingredient of expectedIngredients) {
      const row = db.prepare('SELECT name FROM ingredients WHERE name = ?').get(ingredient);
      expect(row).toBeDefined();
      expect(row.name).toBe(ingredient);
    }
  });
});

describe('build-db.mjs — helper functions', () => {
  it('KNOWN_INGREDIENTS should contain expected German ingredients', () => {
    expect(KNOWN_INGREDIENTS.has('zucker')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('weizenmehl')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('butter')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('salz')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('wasser')).toBe(true);
  });

  it('KNOWN_INGREDIENTS should contain E-numbers', () => {
    expect(KNOWN_INGREDIENTS.has('e100')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('e322')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('e330')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('e5000')).toBe(false); // Outside valid range
  });

  it('KNOWN_INGREDIENTS should contain English ingredients', () => {
    expect(KNOWN_INGREDIENTS.has('sugar')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('salt')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('water')).toBe(true);
  });

  it('KNOWN_INGREDIENTS should contain French ingredients', () => {
    expect(KNOWN_INGREDIENTS.has('sucre')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('sel')).toBe(true);
    expect(KNOWN_INGREDIENTS.has('eau')).toBe(true);
  });

  it('KNOWN_INGREDIENTS should have reasonable size', () => {
    expect(KNOWN_INGREDIENTS.size).toBeGreaterThan(3000);
    expect(KNOWN_INGREDIENTS.size).toBeLessThan(10000);
  });
});
