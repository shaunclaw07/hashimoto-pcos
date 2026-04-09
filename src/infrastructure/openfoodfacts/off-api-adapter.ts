// src/infrastructure/openfoodfacts/off-api-adapter.ts
import type { IProductRepository } from "../../core/ports/product-repository";
import type { Product, SearchQuery, SearchResult, Nutriments } from "../../core/domain/product";
import { mapOffProductToProduct } from "./off-mappers";
import type { OffApiResponse, OffSearchResponse, OffProduct } from "./off-types";

const API_BASE = "https://world.openfoodfacts.org";

export class OffApiAdapter implements IProductRepository {
  async findByBarcode(barcode: string): Promise<Product | null> {
    try {
      const res = await fetch(`${API_BASE}/api/v0/product/${barcode}.json`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data: OffApiResponse = await res.json();
      if (data.status === 0 || !data.product) return null;
      return mapOffProductToProduct(barcode, data.product);
    } catch (err) {
      console.error("[OffApiAdapter] findByBarcode failed:", err);
      return null;
    }
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    const { terms, category, page, pageSize } = query;
    const params = new URLSearchParams({
      search_terms: terms ?? "",
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: String(pageSize),
      page: String(page),
      lang: "de",
    });
    if (category && category !== "alle") {
      params.set("tagtype_0", "categories");
      params.set("tag_contains_0", "contains");
      params.set("tag_0", category);
    }
    try {
      const res = await fetch(`${API_BASE}/cgi/search.pl?${params}`);
      if (!res.ok) return { products: [], total: 0, page };
      const data: OffSearchResponse = await res.json();
      const products = (data.products ?? []).map((p: OffProduct) => {
        const barcode = (p as Record<string, unknown>).code as string ?? "";
        return mapOffProductToProduct(barcode, p);
      });
      return { products, total: data.count ?? 0, page };
    } catch (err) {
      console.error("[OffApiAdapter] search failed:", err);
      return { products: [], total: 0, page };
    }
  }

  // OFf API ist read-only — no-op
  async updateNutriments(_barcode: string, _nutriments: Nutriments): Promise<void> {}
}
