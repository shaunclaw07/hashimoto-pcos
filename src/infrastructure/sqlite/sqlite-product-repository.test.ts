import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeFtsInput, SqliteProductRepository } from "./sqlite-product-repository";

// Create mock DB outside module scope
const mockPrepare = vi.fn();
const mockDb = { prepare: mockPrepare };

// Use dynamic import to avoid hoisting issues with better-sqlite3
vi.mock("./sqlite-client", () => ({
  getDb: vi.fn(() => mockDb),
}));

import { getDb } from "./sqlite-client";

describe("sanitizeFtsInput", () => {
  it("soll Anfuehrungszeichen entfernen", () => {
    expect(sanitizeFtsInput('test" AND invalid')).not.toContain('"');
  });

  it("soll FTS-Operatoren AND/OR/NOT entfernen", () => {
    const result = sanitizeFtsInput("test AND invalid OR something NOT other");
    expect(result.toUpperCase()).not.toContain(" AND ");
    expect(result.toUpperCase()).not.toContain(" OR ");
    expect(result.toUpperCase()).not.toContain(" NOT ");
  });

  it("soll runde Klammern entfernen", () => {
    expect(sanitizeFtsInput("test (invalid)")).not.toContain("(");
    expect(sanitizeFtsInput("test (invalid)")).not.toContain(")");
  });

  it("soll Sternchen fuer Injection-Versuche entfernen", () => {
    const result = sanitizeFtsInput("test*");
    expect(result).not.toContain("*");
  });

  it("soll NEAR mit Distanz-Argument entfernen", () => {
    const result = sanitizeFtsInput("coffee NEAR/3 tea");
    expect(result.toUpperCase()).not.toContain("NEAR");
  });

  it("soll leere Eingabe sicher behandeln", () => {
    expect(sanitizeFtsInput("")).toBe("");
    expect(sanitizeFtsInput("   ")).toBe("");
    expect(sanitizeFtsInput(null as unknown as string)).toBe("");
  });

  it("soll legale Suchbegriffe korrekt verarbeiten", () => {
    const result = sanitizeFtsInput("bio linsen");
    expect(result.toLowerCase()).toContain("bio");
    expect(result.toLowerCase()).toContain("linsen");
  });

  it("soll mehrere Leerzeichen korrekt behandeln", () => {
    const result = sanitizeFtsInput("bio   linsen");
    expect(result).toBeTruthy();
  });
});

describe("SqliteProductRepository", () => {
  let repo: SqliteProductRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mockPrepare function before each test
    mockPrepare.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("findByBarcode", () => {
    it("soll console.error bei DB-Fehler loggen", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      // better-sqlite3 prepare().get() is synchronous, so throw directly
      mockPrepare.mockReturnValue({
        get: vi.fn(() => { throw new Error("DB error"); }),
      });

      repo = new SqliteProductRepository();
      const result = await repo.findByBarcode("1234567890123");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "[SqliteProductRepository] findByBarcode failed:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it("populates ingredientsList from findIngredientsByBarcode", async () => {
      const mockRow = {
        barcode: "1234567890123",
        product_name: "Testprodukt",
        brands: "Testmarke",
        image_url: null,
        nutriments: null,
        labels: null,
        ingredients_text: "Zucker, Wasser, Salz",
        categories: null,
        additives_tags: null,
      };
      const ingredientsRows = [{ name: "Zucker" }, { name: "Wasser" }, { name: "Salz" }];
      mockPrepare.mockReturnValueOnce({
        get: vi.fn(() => mockRow),
      }).mockReturnValueOnce({
        all: vi.fn(() => ingredientsRows),
      });

      repo = new SqliteProductRepository();
      const result = await repo.findByBarcode("1234567890123");

      expect(result).not.toBeNull();
      expect(result!.ingredientsList).toEqual(["Zucker", "Wasser", "Salz"]);
    });

    it("omits ingredientsList when findIngredientsByBarcode returns empty", async () => {
      const mockRow = {
        barcode: "1234567890123",
        product_name: "Testprodukt",
        brands: null,
        image_url: null,
        nutriments: null,
        labels: null,
        ingredients_text: "",
        categories: null,
        additives_tags: null,
      };
      mockPrepare.mockReturnValueOnce({
        get: vi.fn(() => mockRow),
      }).mockReturnValueOnce({
        all: vi.fn(() => []),
      });

      repo = new SqliteProductRepository();
      const result = await repo.findByBarcode("1234567890123");

      expect(result).not.toBeNull();
      expect(result!.ingredientsList).toBeUndefined();
    });
  });

  describe("search", () => {
    it("soll console.error bei DB-Fehler loggen", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockPrepare.mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error("DB error")),
      });

      repo = new SqliteProductRepository();
      const result = await repo.search({ terms: "test", page: 1, pageSize: 20 });

      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[SqliteProductRepository] search failed:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("updateNutriments", () => {
    it("soll console.error bei DB-Fehler loggen", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      // better-sqlite3 prepare().run() is synchronous, so throw directly
      mockPrepare.mockReturnValue({
        run: vi.fn(() => { throw new Error("DB error"); }),
      });

      repo = new SqliteProductRepository();
      await repo.updateNutriments("1234567890123", {
        energyKcal: 100, fat: 5, saturatedFat: 2, sugars: 3, fiber: 1, protein: 4, salt: 0.5
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[SqliteProductRepository] updateNutriments failed:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("findIngredientsByBarcode", () => {
    it("returns ingredient names in position order", async () => {
      const rows = [{ name: "zucker" }, { name: "wasser" }, { name: "salz" }];
      mockPrepare.mockReturnValue({ all: vi.fn(() => rows) });

      repo = new SqliteProductRepository();
      const result = await repo.findIngredientsByBarcode("1234567890123");

      expect(result).toEqual(["zucker", "wasser", "salz"]);
    });

    it("returns empty array when no ingredients found", async () => {
      mockPrepare.mockReturnValue({ all: vi.fn(() => []) });

      repo = new SqliteProductRepository();
      const result = await repo.findIngredientsByBarcode("0000000000000");

      expect(result).toEqual([]);
    });

    it("returns empty array and logs error when DB throws", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockPrepare.mockReturnValue({
        all: vi.fn(() => { throw new Error("DB error"); }),
      });

      repo = new SqliteProductRepository();
      const result = await repo.findIngredientsByBarcode("1234567890123");

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("findIngredientsByBarcode"),
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});
