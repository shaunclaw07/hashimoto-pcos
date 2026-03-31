/**
 * OpenFoodFacts API Client
 * 
 * API Documentation: https://world.openfoodfacts.org/api/v0/product/{barcode}.json
 */

export const API_URL = "https://world.openfoodfacts.org/api/v0/product";

/**
 * Ingredients analysis tags from OpenFoodFacts
 */
export interface IngredientsAnalysis {
  palmoil: string[];
  vegan: string[];
  vegetarian: string[];
}

/**
 * Nutritional values per 100g
 */
export interface Nutriments {
  "energy-kcal_100g"?: number;
  sugars_100g?: number;
  fat_100g?: number;
  "saturated-fat_100g"?: number;
  fiber_100g?: number;
  proteins_100g?: number;
  salt_100g?: number;
  sodium_100g?: number;
}

/**
 * OpenFoodFacts Product (subset of API fields)
 */
export interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  image_url?: string | null;
  image_front_url?: string | null;
  nutriscore_grade?: string;
  ingredients_text?: string;
  ingredients_analysis?: IngredientsAnalysis;
  allergens?: string;
  additives?: string[];
  nutriments?: Nutriments;
  categories?: string;
  labels?: string;
}

/**
 * OpenFoodFacts API Response
 */
export interface OpenFoodFactsResponse {
  status: number;
  status_verbose?: string;
  product?: OpenFoodFactsProduct;
}

/**
 * Error types for fetchProduct
 */
export type FetchProductError =
  | { type: "invalid_barcode"; message: string }
  | { type: "not_found"; message: string }
  | { type: "network_error"; message: string }
  | { type: "unknown_error"; message: string };

/**
 * Result type for fetchProduct
 */
export type FetchProductResult =
  | { success: true; product: OpenFoodFactsProduct }
  | { success: false; error: FetchProductError };

/**
 * Validates EAN-13 barcode format (13 digits)
 */
export function isValidEan13(barcode: string): boolean {
  return /^\d{13}$/.test(barcode);
}

/**
 * Fetches a product from OpenFoodFacts by barcode
 * 
 * @param barcode - EAN-13 barcode (13 digits)
 * @returns Promise<FetchProductResult> with product or error
 */
export async function fetchProduct(barcode: string): Promise<FetchProductResult> {
  // Validate barcode format
  if (!isValidEan13(barcode)) {
    return {
      success: false,
      error: {
        type: "invalid_barcode",
        message: `Invalid EAN-13 barcode format: ${barcode}. Expected 13 digits.`,
      },
    };
  }

  try {
    const url = `${API_URL}/${barcode}.json`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: {
          type: "unknown_error",
          message: `API returned status ${response.status}: ${response.statusText}`,
        },
      };
    }

    const data: OpenFoodFactsResponse = await response.json();

    // Check if product was not found (status 0)
    if (data.status === 0) {
      return {
        success: false,
        error: {
          type: "not_found",
          message: data.status_verbose || "Product not found",
        },
      };
    }

    // Check if product exists
    if (!data.product) {
      return {
        success: false,
        error: {
          type: "unknown_error",
          message: "API response missing product data",
        },
      };
    }

    return {
      success: true,
      product: data.product,
    };
  } catch (error) {
    // Network error or JSON parsing error
    const message = error instanceof Error ? error.message : "Unknown network error";
    return {
      success: false,
      error: {
        type: "network_error",
        message,
      },
    };
  }
}
