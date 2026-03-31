/**
 * Unit tests for OpenFoodFacts API Client
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchProduct, isValidEan13, API_URL } from "../openfoodfacts";

describe("OpenFoodFacts API Client", () => {
  describe("isValidEan13", () => {
    it("should return true for valid 13-digit barcodes", () => {
      expect(isValidEan13("5000159484695")).toBe(true);
      expect(isValidEan13("3017620422003")).toBe(true);
      expect(isValidEan13("0000000000000")).toBe(true);
    });

    it("should return false for invalid barcodes", () => {
      expect(isValidEan13("123")).toBe(false);
      expect(isValidEan13("123456789012")).toBe(false); // 12 digits
      expect(isValidEan13("12345678901234")).toBe(false); // 14 digits
      expect(isValidEan13("123456789012a")).toBe(false); // contains letter
      expect(isValidEan13("")).toBe(false);
      expect(isValidEan13("abcdefghijklm")).toBe(false);
    });
  });

  describe("fetchProduct", () => {
    const validBarcode = "5000159484695";
    const notFoundBarcode = "0000000000001";

    beforeEach(() => {
      // Use native fetch mock
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should return success with product data for valid barcode", async () => {
      const mockProduct = {
        product_name: "Test Product",
        brands: "Test Brand",
        nutriscore_grade: "a",
        image_url: "https://images.openfoodfacts.org/test.jpg",
        nutriments: {
          "energy-kcal_100g": 450,
          sugars_100g: 5.0,
          fat_100g: 20.0,
        },
      };

      const mockResponse = {
        status: 1,
        status_verbose: "product found",
        product: mockProduct,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchProduct(validBarcode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.product.product_name).toBe("Test Product");
        expect(result.product.brands).toBe("Test Brand");
        expect(result.product.nutriscore_grade).toBe("a");
      }

      // Verify fetch was called with correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/${validBarcode}.json`,
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should return not_found error when product does not exist", async () => {
      const mockResponse = {
        status: 0,
        status_verbose: "product not found",
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchProduct(notFoundBarcode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("not_found");
        expect(result.error.message).toBe("product not found");
      }
    });

    it("should return invalid_barcode error for wrong format", async () => {
      const invalidBarcode = "123";

      const result = await fetchProduct(invalidBarcode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("invalid_barcode");
        expect(result.error.message).toContain("Invalid EAN-13 barcode format");
      }
    });

    it("should return invalid_barcode error for 12-digit barcode", async () => {
      const invalidBarcode = "123456789012"; // 12 digits

      const result = await fetchProduct(invalidBarcode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("invalid_barcode");
      }
    });

    it("should return invalid_barcode error for barcode with letters", async () => {
      const invalidBarcode = "123456789012a";

      const result = await fetchProduct(invalidBarcode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("invalid_barcode");
      }
    });

    it("should return network_error on fetch failure", async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network connection failed"));

      const result = await fetchProduct(validBarcode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("network_error");
        expect(result.error.message).toBe("Network connection failed");
      }
    });

    it("should return unknown_error on API error status", async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      });

      const result = await fetchProduct(validBarcode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("unknown_error");
        expect(result.error.message).toContain("500");
      }
    });

    it("should return unknown_error when response is missing product", async () => {
      const mockResponse = {
        status: 1,
        status_verbose: "product found",
        // product is missing
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchProduct(validBarcode);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe("unknown_error");
        expect(result.error.message).toContain("missing product data");
      }
    });

    it("should handle product with null image_url", async () => {
      const mockProduct = {
        product_name: "Test Product",
        brands: "Test Brand",
        image_url: null,
        image_front_url: null,
        nutriscore_grade: "b",
      };

      const mockResponse = {
        status: 1,
        status_verbose: "product found",
        product: mockProduct,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchProduct(validBarcode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.product.image_url).toBeNull();
        expect(result.product.image_front_url).toBeNull();
      }
    });

    it("should handle complete nutriments data", async () => {
      const mockProduct = {
        product_name: "Nutritious Product",
        nutriments: {
          "energy-kcal_100g": 450,
          sugars_100g: 5.0,
          fat_100g: 20.0,
          "saturated-fat_100g": 3.0,
          fiber_100g: 3.5,
          proteins_100g: 8.0,
          salt_100g: 1.2,
          sodium_100g: 0.5,
        },
      };

      const mockResponse = {
        status: 1,
        status_verbose: "product found",
        product: mockProduct,
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: "OK",
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchProduct(validBarcode);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.product.nutriments?.["energy-kcal_100g"]).toBe(450);
        expect(result.product.nutriments?.sugars_100g).toBe(5.0);
        expect(result.product.nutriments?.salt_100g).toBe(1.2);
      }
    });
  });
});
