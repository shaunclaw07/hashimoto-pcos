// src/infrastructure/sqlite/sqlite-product-repository.ts
import type { IProductRepository } from "../../core/ports/product-repository";
import type { Product, SearchQuery, SearchResult, Nutriments } from "../../core/domain/product";
import type { ParsedIngredient } from "../../core/services/ingredient-parser";
import { getDb } from "./sqlite-client";
import { mapDbRowToProduct } from "./sqlite-mappers";
import type { DbProductRow } from "./sqlite-client";

/**
 * Sanitizes user input for SQLite FTS (Full-Text Search) queries.
 * Removes FTS metacharacters that could be used for injection attacks.
 *
 * FTS metacharacters: " ( ) * AND OR NOT NEAR
 *
 * @param input - Raw user input string
 * @returns Sanitized string safe for FTS queries
 */
export function sanitizeFtsInput(input: string): string {
  // Handle null/undefined/empty input gracefully
  if (!input || typeof input !== "string") {
    return "";
  }

  // Trim and normalize whitespace
  const trimmed = input.trim().replace(/\s+/g, " ");

  // Remove FTS metacharacters: quotes, parentheses, asterisks
  const sanitized = trimmed.replace(/["()*]/g, "");

  // Split on whitespace and filter out FTS operators
  // including NEAR with optional distance argument (NEAR/3, NEAR/10, etc.)
  const terms = sanitized.split(/\s+/).filter(term => {
    const upper = term.toUpperCase();
    // Match full operator including NEAR/NEAR/N (FTS5 syntax)
    if (/^NEAR\/?\d*$/.test(upper)) return false;
    return upper !== "AND" && upper !== "OR" && upper !== "NOT";
  });

  return terms.join(" ");
}

const CATEGORY_TAGS: Record<string, string> = {
  vegetables: "en:vegetables",
  fruits: "en:fruits",
  meat: "en:meats",
  fish: "en:fish",
  dairy: "en:dairy",
  grains: "en:cereals",
  snacks: "en:snacks",
};

export class SqliteProductRepository implements IProductRepository {
  async findByBarcode(barcode: string): Promise<Product | null> {
    try {
      const row = getDb()
        .prepare("SELECT * FROM products WHERE barcode = ?")
        .get(barcode) as DbProductRow | undefined;
      if (!row) return null;
      const ingredientsList = await this.findIngredientsByBarcode(barcode);
      return mapDbRowToProduct(row, ingredientsList);
    } catch (err) {
      console.error("[SqliteProductRepository] findByBarcode failed:", err);
      return null;
    }
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const { terms, category, page, pageSize } = query;
    const offset = (page - 1) * pageSize;
    const categoryTag = category ? (CATEGORY_TAGS[category] ?? null) : null;

    try {
      const db = getDb();
      let rows: DbProductRow[];
      let count: number;

      if (terms?.trim()) {
        const sanitizedTerms = sanitizeFtsInput(terms);
        const ftsQuery = sanitizedTerms
          .split(/\s+/)
          .map((t) => `"${t}"*`)
          .join(" AND ");

        if (categoryTag) {
          rows = db
            .prepare(
              `SELECT p.* FROM products p
               JOIN products_fts f ON p.rowid = f.rowid
               WHERE products_fts MATCH ? AND p.categories_tags LIKE ?
               ORDER BY rank LIMIT ? OFFSET ?`
            )
            .all(ftsQuery, `%${categoryTag}%`, pageSize, offset) as DbProductRow[];

          count = (
            db
              .prepare(
                `SELECT COUNT(*) AS c FROM products p
                 JOIN products_fts f ON p.rowid = f.rowid
                 WHERE products_fts MATCH ? AND p.categories_tags LIKE ?`
              )
              .get(ftsQuery, `%${categoryTag}%`) as { c: number }
          ).c;
        } else {
          rows = db
            .prepare(
              `SELECT p.* FROM products p
               JOIN products_fts f ON p.rowid = f.rowid
               WHERE products_fts MATCH ?
               ORDER BY rank LIMIT ? OFFSET ?`
            )
            .all(ftsQuery, pageSize, offset) as DbProductRow[];

          count = (
            db
              .prepare(
                `SELECT COUNT(*) AS c FROM products p
                 JOIN products_fts f ON p.rowid = f.rowid
                 WHERE products_fts MATCH ?`
              )
              .get(ftsQuery) as { c: number }
          ).c;
        }
      } else if (categoryTag) {
        rows = db
          .prepare(
            "SELECT * FROM products WHERE categories_tags LIKE ? LIMIT ? OFFSET ?"
          )
          .all(`%${categoryTag}%`, pageSize, offset) as DbProductRow[];

        count = (
          db
            .prepare(
              "SELECT COUNT(*) AS c FROM products WHERE categories_tags LIKE ?"
            )
            .get(`%${categoryTag}%`) as { c: number }
        ).c;
      } else {
        return { products: [], total: 0, page };
      }

      return {
        products: rows.map((row) => mapDbRowToProduct(row)),
        total: count,
        page,
      };
    } catch (err) {
      console.error("[SqliteProductRepository] search failed:", err);
      return { products: [], total: 0, page };
    }
  }

  private async findIngredientsByBarcode(barcode: string): Promise<string[]> {
    try {
      const rows = getDb()
        .prepare(
          `SELECT i.name FROM ingredients i
           JOIN product_ingredients pi ON i.id = pi.ingredient_id
           WHERE pi.barcode = ?
           ORDER BY pi.position`
        )
        .all(barcode) as { name: string }[];
      return rows.map((r) => r.name);
    } catch (err) {
      console.error("[SqliteProductRepository] findIngredientsByBarcode failed:", err);
      return [];
    }
  }

  async saveProduct(product: Product, parsedIngredients: ParsedIngredient[]): Promise<void> {
    try {
      const db = getDb();
      const nutrientsJson = JSON.stringify({
        "energy-kcal_100g": product.nutriments.energyKcal ?? null,
        fat_100g: product.nutriments.fat ?? null,
        "saturated-fat_100g": product.nutriments.saturatedFat ?? null,
        sugars_100g: product.nutriments.sugars ?? null,
        fiber_100g: product.nutriments.fiber ?? null,
        proteins_100g: product.nutriments.protein ?? null,
        salt_100g: product.nutriments.salt ?? null,
      });

      db.prepare(
        `INSERT INTO products (barcode, product_name, brands, image_url, nutriments, labels, ingredients_text, categories)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(barcode) DO UPDATE SET
           product_name = excluded.product_name,
           brands = excluded.brands,
           image_url = excluded.image_url,
           nutriments = excluded.nutriments,
           labels = excluded.labels,
           ingredients_text = excluded.ingredients_text,
           categories = excluded.categories`
      ).run(
        product.barcode,
        product.name,
        product.brand ?? null,
        product.imageUrl ?? null,
        nutrientsJson,
        product.labels.join(",") || null,
        product.ingredients || null,
        product.categories.join(",") || null,
      );

      // Keep the FTS index in sync (external content table — no automatic trigger)
      db.prepare(
        `INSERT OR REPLACE INTO products_fts(rowid, barcode, product_name, brands)
         VALUES ((SELECT rowid FROM products WHERE barcode = ?), ?, ?, ?)`
      ).run(product.barcode, product.barcode, product.name, product.brand ?? null);

      if (parsedIngredients.length > 0) {
        // Remove stale ingredient links before re-inserting
        db.prepare("DELETE FROM product_ingredients WHERE barcode = ?").run(product.barcode);

        for (let i = 0; i < parsedIngredients.length; i++) {
          const { raw, canonical } = parsedIngredients[i];
          db.prepare("INSERT OR IGNORE INTO ingredients (name) VALUES (?)").run(canonical);
          const row = db.prepare("SELECT id FROM ingredients WHERE name = ?").get(canonical) as { id: number };
          db.prepare(
            "INSERT OR IGNORE INTO product_ingredients (barcode, ingredient_id, raw_text, position) VALUES (?, ?, ?, ?)"
          ).run(product.barcode, row.id, raw, i);
        }
      }
    } catch (err) {
      console.error("[SqliteProductRepository] saveProduct failed:", err);
    }
  }

  async updateNutriments(barcode: string, nutriments: Nutriments): Promise<void> {
    const raw = {
      "energy-kcal_100g": nutriments.energyKcal,
      fat_100g: nutriments.fat,
      "saturated-fat_100g": nutriments.saturatedFat,
      sugars_100g: nutriments.sugars,
      fiber_100g: nutriments.fiber,
      proteins_100g: nutriments.protein,
      salt_100g: nutriments.salt,
    };
    try {
      getDb()
        .prepare("UPDATE products SET nutriments = ? WHERE barcode = ?")
        .run(JSON.stringify(raw), barcode);
    } catch (err) {
      console.error("[SqliteProductRepository] updateNutriments failed:", err);
    }
  }
}
