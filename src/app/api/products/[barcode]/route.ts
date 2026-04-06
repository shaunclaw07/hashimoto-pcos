// src/app/api/products/[barcode]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GetProductUseCase } from "@/core/use-cases/get-product";
import {
  makePrimaryProductRepository,
  makeFallbackProductRepository,
} from "@/infrastructure/container";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;

  const useCase = new GetProductUseCase(
    makePrimaryProductRepository(),
    makeFallbackProductRepository()
  );

  const result = await useCase.execute(barcode);

  if (!result.success) {
    const status =
      result.error.type === "not_found"
        ? 404
        : result.error.type === "invalid_barcode"
        ? 400
        : 503;
    return NextResponse.json(result, { status });
  }

  return NextResponse.json(result);
}
