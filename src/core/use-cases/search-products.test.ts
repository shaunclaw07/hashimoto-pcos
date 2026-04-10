import { describe, it, expect, vi } from "vitest";
import { SearchProductsUseCase } from "./search-products";
import type { IProductRepository } from "../ports/product-repository";
import type { SearchResult } from "../domain/product";

function makeRepo(searchResult: SearchResult): IProductRepository {
  return {
    findByBarcode: vi.fn().mockResolvedValue(null),
    search: vi.fn().mockResolvedValue(searchResult),
    updateNutriments: vi.fn().mockResolvedValue(undefined),
  };
}

const emptyResult: SearchResult = { products: [], total: 0, page: 1 };
const mockResult: SearchResult = {
  products: [
    {
      barcode: "1234567890123",
      name: "Test Produkt",
      nutriments: {},
      labels: [],
      ingredients: "",
      categories: [],
      additives: [],
    },
  ],
  total: 1,
  page: 1,
};

describe("SearchProductsUseCase", () => {
  it("returns results from primary repo", async () => {
    const useCase = new SearchProductsUseCase(makeRepo(mockResult));
    const result = await useCase.execute({ terms: "test", page: 1, pageSize: 20 });
    expect(result.total).toBe(1);
    expect(result.products[0].name).toBe("Test Produkt");
  });

  it("returns empty result when primary is empty (no fallback)", async () => {
    const useCase = new SearchProductsUseCase(makeRepo(emptyResult));
    const result = await useCase.execute({ terms: "xyz", page: 1, pageSize: 20 });
    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("passes query parameters correctly to primary repo", async () => {
    const primary = makeRepo(mockResult);
    const useCase = new SearchProductsUseCase(primary);
    await useCase.execute({ terms: "linsen", category: "vegetables", page: 2, pageSize: 10 });
    expect(primary.search).toHaveBeenCalledWith({
      terms: "linsen",
      category: "vegetables",
      page: 2,
      pageSize: 10,
    });
  });

  it("calls primary.search exactly once", async () => {
    const primary = makeRepo(mockResult);
    const useCase = new SearchProductsUseCase(primary);
    await useCase.execute({ terms: "test", page: 1, pageSize: 20 });
    expect(primary.search).toHaveBeenCalledTimes(1);
  });
});
