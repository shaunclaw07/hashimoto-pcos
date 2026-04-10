import { describe, it, expect, vi } from "vitest";
import { GetProductUseCase } from "./get-product";
import type { IProductRepository } from "../ports/product-repository";
import type { Product } from "../domain/product";

const mockProduct: Product = {
  barcode: "4006040197219",
  name: "Test Produkt",
  brand: "Test Brand",
  nutriments: { sugars: 5, fiber: 8, protein: 3 },
  labels: [],
  ingredients: "",
  categories: [],
  additives: [],
};

const mockProductNoNutriments: Product = {
  ...mockProduct,
  nutriments: {},
};

function makeRepo(overrides: Partial<IProductRepository> = {}): IProductRepository {
  return {
    findByBarcode: vi.fn().mockResolvedValue(null),
    search: vi.fn().mockResolvedValue({ products: [], total: 0, page: 1 }),
    updateNutriments: vi.fn().mockResolvedValue(undefined),
    saveProduct: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("GetProductUseCase", () => {
  it("gibt invalid_barcode zurück für ungültige EAN", async () => {
    const useCase = new GetProductUseCase(makeRepo(), makeRepo());
    const result = await useCase.execute("123");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.type).toBe("invalid_barcode");
  });

  it("gibt Produkt aus Primary-Repo zurück", async () => {
    const primary = makeRepo({ findByBarcode: vi.fn().mockResolvedValue(mockProduct) });
    const useCase = new GetProductUseCase(primary, makeRepo());
    const result = await useCase.execute("4006040197219");
    expect(result.success).toBe(true);
    if (result.success) expect(result.product.name).toBe("Test Produkt");
  });

  it("fällt auf Fallback-Repo zurück wenn Primary null gibt", async () => {
    const fallback = makeRepo({ findByBarcode: vi.fn().mockResolvedValue(mockProduct) });
    const useCase = new GetProductUseCase(makeRepo(), fallback);
    const result = await useCase.execute("4006040197219");
    expect(result.success).toBe(true);
    if (result.success) expect(result.product.name).toBe("Test Produkt");
  });

  it("gibt not_found zurück wenn beide Repos null geben", async () => {
    const useCase = new GetProductUseCase(makeRepo(), makeRepo());
    const result = await useCase.execute("4006040197219");
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.type).toBe("not_found");
  });

  it("reichert Produkt ohne Nährwerte aus Fallback an", async () => {
    const enriched: Product = { ...mockProduct, nutriments: { sugars: 5, fiber: 8 } };
    const primary = makeRepo({
      findByBarcode: vi.fn().mockResolvedValue(mockProductNoNutriments),
    });
    const fallback = makeRepo({ findByBarcode: vi.fn().mockResolvedValue(enriched) });

    const useCase = new GetProductUseCase(primary, fallback);
    const result = await useCase.execute("4006040197219");

    expect(result.success).toBe(true);
    if (result.success) expect(result.product.nutriments.fiber).toBe(8);
    expect(primary.updateNutriments).toHaveBeenCalledWith(
      "4006040197219",
      enriched.nutriments
    );
  });

  it("speichert OFF-Produkt in Primary wenn Fallback es liefert", async () => {
    const fallbackProduct: Product = {
      ...mockProduct,
      ingredients: "Zucker, Wasser, Salz",
    };
    const primary = makeRepo();
    const fallback = makeRepo({ findByBarcode: vi.fn().mockResolvedValue(fallbackProduct) });

    const useCase = new GetProductUseCase(primary, fallback);
    const result = await useCase.execute("4006040197219");

    expect(result.success).toBe(true);
    expect(primary.saveProduct).toHaveBeenCalledOnce();
    expect(primary.saveProduct).toHaveBeenCalledWith(
      fallbackProduct,
      expect.any(Array)
    );
  });

  it("gibt Produkt zurück auch wenn saveProduct fehlschlägt (graceful degradation)", async () => {
    const primary = makeRepo({
      saveProduct: vi.fn().mockRejectedValue(new Error("DB error")),
    });
    const fallback = makeRepo({ findByBarcode: vi.fn().mockResolvedValue(mockProduct) });

    const useCase = new GetProductUseCase(primary, fallback);
    const result = await useCase.execute("4006040197219");

    expect(result.success).toBe(true);
    if (result.success) expect(result.product.name).toBe("Test Produkt");
  });

  it("ruft saveProduct nicht auf wenn Produkt bereits in Primary vorhanden", async () => {
    const primary = makeRepo({ findByBarcode: vi.fn().mockResolvedValue(mockProduct) });
    const fallback = makeRepo();

    const useCase = new GetProductUseCase(primary, fallback);
    await useCase.execute("4006040197219");

    expect(primary.saveProduct).not.toHaveBeenCalled();
  });
});
