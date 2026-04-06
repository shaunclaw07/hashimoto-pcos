import { isValidBarcode } from "../services/barcode-service";
import type { IProductRepository } from "../ports/product-repository";
import type { Product } from "../domain/product";

export type GetProductError =
  | { type: "invalid_barcode"; message: string }
  | { type: "not_found"; message: string }
  | { type: "network_error"; message: string };

export type GetProductResult =
  | { success: true; product: Product }
  | { success: false; error: GetProductError };

function hasNutriments(product: Product): boolean {
  return Object.values(product.nutriments).some(
    (v) => v !== null && v !== undefined
  );
}

export class GetProductUseCase {
  constructor(
    private readonly primaryRepo: IProductRepository,
    private readonly fallbackRepo: IProductRepository
  ) {}

  async execute(barcode: string): Promise<GetProductResult> {
    if (!isValidBarcode(barcode)) {
      return {
        success: false,
        error: { type: "invalid_barcode", message: `Ungültiger Barcode: ${barcode}` },
      };
    }

    let product = await this.primaryRepo.findByBarcode(barcode);

    if (!product) {
      const fallback = await this.fallbackRepo.findByBarcode(barcode);
      if (!fallback) {
        return {
          success: false,
          error: { type: "not_found", message: "Produkt nicht gefunden" },
        };
      }
      return { success: true, product: fallback };
    }

    // Product found locally but without nutriments → enrich
    if (!hasNutriments(product)) {
      const enriched = await this.fallbackRepo.findByBarcode(barcode);
      if (enriched) {
        await this.primaryRepo.updateNutriments(barcode, enriched.nutriments);
        product = { ...product, nutriments: enriched.nutriments };
      }
    }

    return { success: true, product };
  }
}
