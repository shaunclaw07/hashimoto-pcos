// src/infrastructure/openfoodfacts/off-mappers.ts
import type { Product, Nutriments } from "../../core/domain/product";
import type { OffProduct, OffNutriments } from "./off-types";

function mapNutriments(off: OffNutriments | undefined): Nutriments {
  if (!off) return {};
  return {
    energyKcal: off["energy-kcal_100g"] ?? undefined,
    fat: off.fat_100g ?? undefined,
    saturatedFat: off["saturated-fat_100g"] ?? undefined,
    sugars: off.sugars_100g ?? undefined,
    fiber: off.fiber_100g ?? undefined,
    protein: off.proteins_100g ?? undefined,
    salt: off.salt_100g ?? undefined,
  };
}

export function mapOffProductToProduct(barcode: string, off: OffProduct): Product {
  const additives = off.additives_tags ?? off.additives ?? [];
  return {
    barcode,
    name: off.product_name ?? "",
    brand: off.brands ?? undefined,
    imageUrl: off.image_front_url ?? off.image_url ?? undefined,
    nutriments: mapNutriments(off.nutriments),
    labels: off.labels
      ? off.labels.split(",").map((l) => l.trim()).filter(Boolean)
      : [],
    ingredients: off.ingredients_text ?? "",
    categories: off.categories
      ? off.categories.split(",").map((c) => c.trim()).filter(Boolean)
      : [],
    additives,
  };
}
