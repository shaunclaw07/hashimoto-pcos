import type { Product, SearchQuery, SearchResult, Nutriments } from "../domain/product";
import type { ParsedIngredient } from "../services/ingredient-parser";

export interface IProductRepository {
  findByBarcode(barcode: string): Promise<Product | null>;
  search(query: SearchQuery): Promise<SearchResult>;
  updateNutriments(barcode: string, nutriments: Nutriments): Promise<void>;
  saveProduct(product: Product, parsedIngredients: ParsedIngredient[]): Promise<void>;
}
