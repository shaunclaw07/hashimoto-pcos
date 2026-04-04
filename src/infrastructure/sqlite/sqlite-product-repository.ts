// src/infrastructure/sqlite/sqlite-product-repository.ts
import type { IProductRepository } from "../../core/ports/product-repository";
import type { Product, SearchQuery, SearchResult, Nutriments } from "../../core/domain/product";
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
  gemüse: "en:vegetables",
  obst: "en:fruits",
  fleisch: "en:meats",
  fisch: "en:fish",
  milchprodukte: "en:dairy",
  getreide: "en:cereals",
  snacks: "en:snacks",
};

export class SqliteProductRepository implements IProductRepository {
  async findByBarcode(barcode: string): Promise<Product | null> {
    try {
      const row = getDb()
        .prepare("SELECT * FROM products WHERE barcode = ?")
        .get(barcode) as DbProductRow | undefined;
      return row ? mapDbRowToProduct(row) : null;
    } catch {
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
        products: rows.map(mapDbRowToProduct),
        total: count,
        page,
      };
    } catch {
      return { products: [], total: 0, page };
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
    } catch {
      // best-effort
    }
  }
}
