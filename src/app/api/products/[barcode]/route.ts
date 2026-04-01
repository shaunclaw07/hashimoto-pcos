import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToProduct, DbProductRow } from '@/lib/db';
import { fetchProduct, isValidEan13 } from '@/lib/openfoodfacts';

export async function GET(
  _req: NextRequest,
  { params }: { params: { barcode: string } }
) {
  const { barcode } = params;

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
      return NextResponse.json({ success: true, product: rowToProduct(row) });
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
