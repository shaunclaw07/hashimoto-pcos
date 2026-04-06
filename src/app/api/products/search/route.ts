// src/app/api/products/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { SearchProductsUseCase } from "@/core/use-cases/search-products";
import {
  makePrimaryProductRepository,
  makeFallbackProductRepository,
} from "@/infrastructure/container";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const terms = searchParams.get("search_terms") ?? "";
  const category = searchParams.get("tag_0") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(20, parseInt(searchParams.get("page_size") ?? "20", 10));

  if (!terms.trim() && !category) {
    return NextResponse.json({ products: [], count: 0, page });
  }

  const useCase = new SearchProductsUseCase(
    makePrimaryProductRepository(),
    makeFallbackProductRepository()
  );

  const result = await useCase.execute({
    terms: terms.trim() || undefined,
    category: category || undefined,
    page,
    pageSize,
  });

  return NextResponse.json({
    products: result.products,
    count: result.total,
    page: result.page,
  });
}
