import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { SearchProductsUseCase } from "@/core/use-cases/search-products";
import {
  makePrimaryProductRepository,
  makeFallbackProductRepository,
} from "@/infrastructure/container";

const MAX_PAGE_SIZE = 200;

// Use case instantiated once at module scope — reuses the SQLite singleton (getDb())
const useCase = new SearchProductsUseCase(
  makePrimaryProductRepository(),
  makeFallbackProductRepository()
);

// Cache results server-side for 1 hour.
// Cache key = ["products-search"] + (terms, category, page, pageSize).
// Shared across all requests on the same server instance.
const cachedSearchProducts = unstable_cache(
  async (terms: string, category: string, page: number, pageSize: number) =>
    useCase.execute({
      terms: terms || undefined,
      category: category || undefined,
      page,
      pageSize,
    }),
  ["products-search"],
  { tags: ["products-search"], revalidate: 3600 }
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const terms = searchParams.get("search_terms") ?? "";
  const category = searchParams.get("tag_0") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("page_size") ?? "50", 10))
  );

  if (!terms.trim() && !category) {
    return NextResponse.json({ products: [], count: 0, page });
  }

  const result = await cachedSearchProducts(terms.trim(), category, page, pageSize);

  return NextResponse.json({
    products: result.products,
    count: result.total,
    page: result.page,
  });
}
