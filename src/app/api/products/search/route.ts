import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { SearchProductsUseCase } from "@/core/use-cases/search-products";
import { makePrimaryProductRepository } from "@/infrastructure/container";

// Server-side page size — locked to 50. The client-supplied page_size param is
// accepted for backward compatibility but ignored by the cached path so that all
// requests collapse onto a single cache slot (terms + category + page only).
const SERVER_PAGE_SIZE = 50;

// Lazy singleton — defers SQLite open until the first actual request, so a
// missing products.db does not crash the module at import time.
let _useCase: SearchProductsUseCase | null = null;

function getSearchUseCase(): SearchProductsUseCase {
  if (!_useCase) {
    _useCase = new SearchProductsUseCase(makePrimaryProductRepository());
  }
  return _useCase;
}

// Cache key = ["products-search"] + (terms, category, page).
// pageSize is NOT part of the cache key — it is hard-coded to SERVER_PAGE_SIZE.
// Shared across all requests on the same server instance; revalidates every hour.
const cachedSearchProducts = unstable_cache(
  async (terms: string, category: string, page: number) =>
    getSearchUseCase().execute({
      // terms is pre-trimmed by the caller; empty string becomes undefined
      terms: terms !== "" ? terms : undefined,
      category: category !== "" ? category : undefined,
      page,
      pageSize: SERVER_PAGE_SIZE,
    }),
  ["products-search"],
  { tags: ["products-search"], revalidate: 3600 }
);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const terms = searchParams.get("search_terms") ?? "";
  const category = searchParams.get("tag_0") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  if (!terms.trim() && !category) {
    return NextResponse.json({ products: [], count: 0, page });
  }

  // The client may send page_size but it is not used by the cache — the server
  // always responds with SERVER_PAGE_SIZE items and computes hasMore itself.
  const result = await cachedSearchProducts(terms.trim(), category, page);

  return NextResponse.json({
    products: result.products,
    count: result.total,
    page: result.page,
    // hasMore is server-derived: true when there are more results beyond this page
    hasMore: page * SERVER_PAGE_SIZE < result.total,
  });
}
