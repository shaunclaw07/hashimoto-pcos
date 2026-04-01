import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToProduct, updateNutriments, DbProductRow } from '@/lib/db';
import { fetchProduct, isValidEan13 } from '@/lib/openfoodfacts';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  const { barcode } = await params;

  if (!isValidEan13(barcode)) {
    return NextResponse.json(
      { success: false, error: { type: 'invalid_barcode', message: `Ungültiger EAN-13 Barcode: ${barcode}` } },
      { status: 400 }
    );
  }

  // 1. Try local SQLite
  try {
    const row = getDb()
      .prepare('SELECT * FROM products WHERE barcode = ?')
      .get(barcode) as DbProductRow | undefined;

    if (row) {
      const product = rowToProduct(row);
      const hasNutriments = product.nutriments &&
        Object.values(product.nutriments).some(v => v !== null && v !== undefined);

      if (!hasNutriments) {
        // Local product has no nutriment data — enrich from OFf API and cache
        const offResult = await fetchProduct(barcode);
        if (offResult.success && offResult.product.nutriments) {
          product.nutriments = offResult.product.nutriments;
          try {
            updateNutriments(barcode, offResult.product.nutriments);
          } catch {
            // Cache update is best-effort — don't fail the request
          }
        }
      }

      return NextResponse.json({ success: true, product });
    }
  } catch {
    // DB not available — fall through to API
  }

  // 2. Fall back to OpenFoodFacts API
  const result = await fetchProduct(barcode);
  const status = result.success ? 200
    : result.error.type === 'not_found' ? 404
    : 503;
  return NextResponse.json(result, { status });
}
