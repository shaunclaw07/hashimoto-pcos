import { describe, it, expect } from "vitest";
import { mapDbRowToProduct } from "./sqlite-mappers";
import type { DbProductRow } from "./sqlite-client";

describe("mapDbRowToProduct", () => {
  const baseRow: DbProductRow = {
    barcode: "1234567890123",
    product_name: "Testprodukt",
    brands: "Testmarke",
    image_url: "http://example.com/img.jpg",
    nutriments: null,
    labels: null,
    ingredients_text: "Zucker, Wasser",
    categories: null,
    additives_tags: null,
    nutriscore_grade: null,
    allergens: null,
    categories_tags: null,
  };

  it("maps basic fields correctly", () => {
    const result = mapDbRowToProduct(baseRow);
    expect(result.barcode).toBe("1234567890123");
    expect(result.name).toBe("Testprodukt");
    expect(result.brand).toBe("Testmarke");
    expect(result.imageUrl).toBe("http://example.com/img.jpg");
  });

  it("sets ingredientsList when provided", () => {
    const ingredientsList = ["Zucker", "Wasser", "Salz"];
    const result = mapDbRowToProduct(baseRow, ingredientsList);
    expect(result.ingredientsList).toEqual(["Zucker", "Wasser", "Salz"]);
  });

  it("omits ingredientsList when not provided", () => {
    const result = mapDbRowToProduct(baseRow);
    expect(result.ingredientsList).toBeUndefined();
  });

  it("omits ingredientsList when empty array is provided", () => {
    const result = mapDbRowToProduct(baseRow, []);
    expect(result.ingredientsList).toBeUndefined();
  });

  it("handles null optional fields", () => {
    const row: DbProductRow = {
      ...baseRow,
      brands: null,
      image_url: null,
      labels: null,
      categories: null,
      additives_tags: null,
    };
    const result = mapDbRowToProduct(row);
    expect(result.brand).toBeUndefined();
    expect(result.imageUrl).toBeUndefined();
    expect(result.labels).toEqual([]);
    expect(result.categories).toEqual([]);
    expect(result.additives).toEqual([]);
  });

  it("splits comma-separated labels", () => {
    const row: DbProductRow = { ...baseRow, labels: "bio, gluten-free" };
    const result = mapDbRowToProduct(row);
    expect(result.labels).toEqual(["bio", "gluten-free"]);
  });

  it("filters empty strings from labels", () => {
    const row: DbProductRow = { ...baseRow, labels: "bio, , gluten-free" };
    const result = mapDbRowToProduct(row);
    expect(result.labels).toEqual(["bio", "gluten-free"]);
  });

  it("parses nutriments JSON correctly", () => {
    const row: DbProductRow = {
      ...baseRow,
      nutriments: JSON.stringify({
        "energy-kcal_100g": 540,
        fat_100g: 29.7,
        "saturated-fat_100g": 10.8,
        sugars_100g: 56.8,
        fiber_100g: 2.7,
        proteins_100g: 5.41,
        salt_100g: 0.1,
      }),
    };
    const result = mapDbRowToProduct(row);
    expect(result.nutriments.energyKcal).toBe(540);
    expect(result.nutriments.fat).toBe(29.7);
    expect(result.nutriments.saturatedFat).toBe(10.8);
    expect(result.nutriments.sugars).toBe(56.8);
    expect(result.nutriments.fiber).toBe(2.7);
    expect(result.nutriments.protein).toBe(5.41);
    expect(result.nutriments.salt).toBe(0.1);
  });

  it("returns empty nutriments when JSON is invalid", () => {
    const row: DbProductRow = { ...baseRow, nutriments: "invalid json" };
    const result = mapDbRowToProduct(row);
    expect(result.nutriments).toEqual({});
  });
});
