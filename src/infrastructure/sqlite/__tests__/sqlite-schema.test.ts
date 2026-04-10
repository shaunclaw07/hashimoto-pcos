import Database from "better-sqlite3";
import { describe, it, expect } from "vitest";
import { createSchema } from "../sqlite-schema";

describe("createSchema", () => {
  it("creates all required tables on a fresh in-memory database", () => {
    const db = new Database(":memory:");
    createSchema(db);

    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      )
      .all() as { name: string }[];

    expect(tables.map((t) => t.name)).toContain("products");
    expect(tables.map((t) => t.name)).toContain("ingredients");
    expect(tables.map((t) => t.name)).toContain("product_ingredients");
    db.close();
  });

  it("creates the products_fts virtual table", () => {
    const db = new Database(":memory:");
    createSchema(db);

    const ftsTables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='products_fts'"
      )
      .all();

    expect(ftsTables).toHaveLength(1);
    db.close();
  });

  it("is idempotent — calling twice does not throw", () => {
    const db = new Database(":memory:");
    createSchema(db);

    expect(() => {
      createSchema(db);
    }).not.toThrow();

    db.close();
  });

  it("allows inserting a product after schema creation", () => {
    const db = new Database(":memory:");
    createSchema(db);

    db.prepare(
      `INSERT INTO products (barcode, product_name, brands, image_url, nutriscore_grade, ingredients_text, allergens, additives_tags, nutriments, categories, categories_tags, labels)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      "1234567890123",
      "Test Product",
      "Test Brand",
      "https://example.com/image.jpg",
      "d",
      "water, sugar, salt",
      "",
      "",
      "{}",
      "",
      "",
      ""
    );

    const row = db
      .prepare("SELECT barcode, product_name FROM products WHERE barcode = ?")
      .get("1234567890123") as { barcode: string; product_name: string };

    expect(row.barcode).toBe("1234567890123");
    expect(row.product_name).toBe("Test Product");
    db.close();
  });
});
