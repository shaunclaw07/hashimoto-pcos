import type { IProductRepository } from "../ports/product-repository";
import type { SearchQuery, SearchResult } from "../domain/product";

export class SearchProductsUseCase {
  constructor(
    private readonly primaryRepo: IProductRepository,
    private readonly fallbackRepo: IProductRepository
  ) {}

  async execute(query: SearchQuery): Promise<SearchResult> {
    const result = await this.primaryRepo.search(query);
    if (result.total > 0) return result;
    return this.fallbackRepo.search(query);
  }
}
