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
  it("gibt Ergebnisse aus Primary-Repo zurück", async () => {
    const useCase = new SearchProductsUseCase(makeRepo(mockResult), makeRepo(emptyResult));
    const result = await useCase.execute({ terms: "test", page: 1, pageSize: 20 });
    expect(result.total).toBe(1);
    expect(result.products[0].name).toBe("Test Produkt");
  });

  it("fällt auf Fallback zurück wenn Primary leer ist", async () => {
    const fallbackResult: SearchResult = { ...mockResult, total: 5 };
    const useCase = new SearchProductsUseCase(makeRepo(emptyResult), makeRepo(fallbackResult));
    const result = await useCase.execute({ terms: "test", page: 1, pageSize: 20 });
    expect(result.total).toBe(5);
  });

  it("gibt leeres Ergebnis zurück wenn beide Repos leer sind", async () => {
    const useCase = new SearchProductsUseCase(makeRepo(emptyResult), makeRepo(emptyResult));
    const result = await useCase.execute({ terms: "xyz", page: 1, pageSize: 20 });
    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("übergibt query-Parameter korrekt an Primary-Repo", async () => {
    const primary = makeRepo(mockResult);
    const useCase = new SearchProductsUseCase(primary, makeRepo(emptyResult));
    await useCase.execute({ terms: "linsen", category: "gemüse", page: 2, pageSize: 10 });
    expect(primary.search).toHaveBeenCalledWith({
      terms: "linsen",
      category: "gemüse",
      page: 2,
      pageSize: 10,
    });
  });
});
