import { describe, it, expect, vi } from "vitest";
import { ManageFavoritesUseCase } from "./manage-favorites";
import type { IFavoritesRepository, SavedProduct } from "../ports/favorites-repository";
import type { Product } from "../domain/product";
import type { ScoreResult } from "../domain/score";

const mockProduct: Product = {
  barcode: "1234567890123",
  name: "Test Produkt",
  nutriments: {},
  labels: [],
  ingredients: "",
  categories: [],
  additives: [],
};

const mockScore: ScoreResult = {
  score: 3.5,
  stars: 4,
  label: "GUT",
  breakdown: [],
  bonuses: 0.5,
  maluses: 0,
};

function makeRepo(store: Record<string, SavedProduct> = {}): IFavoritesRepository {
  return {
    getAll: vi.fn().mockImplementation(() => Object.values(store)),
    save: vi.fn().mockImplementation((barcode: string, entry: SavedProduct) => {
      store[barcode] = entry;
    }),
    remove: vi.fn().mockImplementation((barcode: string) => {
      delete store[barcode];
    }),
    isSaved: vi.fn().mockImplementation((barcode: string) => barcode in store),
  };
}

describe("ManageFavoritesUseCase", () => {
  it("speichert ein Produkt", () => {
    const store: Record<string, SavedProduct> = {};
    const repo = makeRepo(store);
    const useCase = new ManageFavoritesUseCase(repo);
    useCase.save("1234567890123", mockProduct, mockScore);
    expect(repo.save).toHaveBeenCalledWith(
      "1234567890123",
      expect.objectContaining({ product: mockProduct, score: mockScore })
    );
  });

  it("entfernt ein Produkt", () => {
    const store: Record<string, SavedProduct> = {};
    const repo = makeRepo(store);
    const useCase = new ManageFavoritesUseCase(repo);
    useCase.save("1234567890123", mockProduct, mockScore);
    useCase.remove("1234567890123");
    expect(repo.remove).toHaveBeenCalledWith("1234567890123");
  });

  it("prüft ob Produkt gespeichert ist", () => {
    const store: Record<string, SavedProduct> = {
      "1234567890123": { product: mockProduct, score: mockScore, savedAt: 0 },
    };
    const useCase = new ManageFavoritesUseCase(makeRepo(store));
    expect(useCase.isSaved("1234567890123")).toBe(true);
    expect(useCase.isSaved("9999999999999")).toBe(false);
  });

  it("gibt alle gespeicherten Produkte zurück", () => {
    const store: Record<string, SavedProduct> = {
      "1234567890123": { product: mockProduct, score: mockScore, savedAt: 0 },
    };
    const useCase = new ManageFavoritesUseCase(makeRepo(store));
    const all = useCase.getAll();
    expect(all).toHaveLength(1);
  });
});
