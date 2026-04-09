import type { Product, SearchQuery, SearchResult, Nutriments } from "../domain/product";

export interface IProductRepository {
  findByBarcode(barcode: string): Promise<Product | null>;
  search(query: SearchQuery): Promise<SearchResult>;
  updateNutriments(barcode: string, nutriments: Nutriments): Promise<void>;
}
