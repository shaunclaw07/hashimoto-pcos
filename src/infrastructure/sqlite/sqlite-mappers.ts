// src/infrastructure/sqlite/sqlite-mappers.ts
import type { Product, Nutriments } from "../../core/domain/product";
import type { DbProductRow } from "./sqlite-client";

function parseNutriments(json: string | null): Nutriments {
  if (!json) return {};
  try {
    const raw = JSON.parse(json);
    return {
      energyKcal: raw["energy-kcal_100g"] ?? undefined,
      fat: raw.fat_100g ?? undefined,
      saturatedFat: raw["saturated-fat_100g"] ?? undefined,
      sugars: raw.sugars_100g ?? undefined,
      fiber: raw.fiber_100g ?? undefined,
      protein: raw.proteins_100g ?? undefined,
      salt: raw.salt_100g ?? undefined,
    };
  } catch {
    return {};
  }
}

export function mapDbRowToProduct(row: DbProductRow, ingredientsList?: string[]): Product {
  const list = ingredientsList && ingredientsList.length > 0 ? ingredientsList : undefined;
  return {
    barcode: row.barcode,
    name: row.product_name ?? "",
    brand: row.brands ?? undefined,
    imageUrl: row.image_url ?? undefined,
    nutriments: parseNutriments(row.nutriments),
    labels: row.labels
      ? row.labels.split(",").map((l) => l.trim()).filter(Boolean)
      : [],
    ingredients: row.ingredients_text ?? "",
    ingredientsList: list,
    categories: row.categories
      ? row.categories.split(",").map((c) => c.trim()).filter(Boolean)
      : [],
    additives: row.additives_tags
      ? row.additives_tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
  };
}
