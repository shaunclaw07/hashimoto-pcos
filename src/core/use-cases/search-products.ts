import type { IProductRepository } from "../ports/product-repository";
import type { SearchQuery, SearchResult } from "../domain/product";

export class SearchProductsUseCase {
  constructor(private readonly primaryRepo: IProductRepository) {}

  async execute(query: SearchQuery): Promise<SearchResult> {
    return this.primaryRepo.search(query);
  }
}
