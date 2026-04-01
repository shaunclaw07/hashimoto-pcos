import { NextRequest, NextResponse } from 'next/server';
import { getDb, rowToProduct, DbProductRow } from '@/lib/db';

// Maps German category keys (from lebensmittel/page.tsx) to OFf categories_tags
const CATEGORY_TAGS: Record<string, string> = {
  'gemüse':        'en:vegetables',
  'obst':          'en:fruits',
  'fleisch':       'en:meats',
  'fisch':         'en:fish',
  'milchprodukte': 'en:dairy',
  'getreide':      'en:cereals',
  'snacks':        'en:snacks',
};

interface OffProduct {
  code?: string;
  _id?: string;
  product_name?: string;
  product_name_de?: string;
  brands?: string;
  image_small_url?: string;
  image_url?: string;
  nutriments?: Record<string, unknown>;
  labels?: string;
  ingredients_text?: string;
  additives_tags?: string[];
  categories?: string;
}

async function fetchFromOff(query: string, category: string, page: number): Promise<NextResponse> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    page: String(page),
    lang: 'de',
  });
  if (category && category !== 'alle') {
    params.set('tagtype_0', 'categories');
    params.set('tag_contains_0', 'contains');
    params.set('tag_0', category);
  }
  try {
    const res = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`);
    if (!res.ok) return NextResponse.json({ products: [], count: 0, page }, { status: res.status });
    const data = await res.json() as { products?: OffProduct[]; count?: number };
    return NextResponse.json({ products: data.products ?? [], count: data.count ?? 0, page });
  } catch {
    return NextResponse.json({ products: [], count: 0, page }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query    = searchParams.get('search_terms') ?? '';
  const category = searchParams.get('tag_0')        ?? '';
  const page     = Math.max(1, parseInt(searchParams.get('page')      ?? '1',  10));
  const pageSize = Math.min(20, parseInt(searchParams.get('page_size') ?? '20', 10));
  const offset   = (page - 1) * pageSize;

  if (!query.trim() && !category) {
    return NextResponse.json({ products: [], count: 0, page });
  }

  const categoryTag = CATEGORY_TAGS[category] ?? null;

  try {
    const db = getDb();

    let rows: DbProductRow[];
    let count: number;

    if (query.trim()) {
      const ftsQuery = query.trim().split(/\s+/).map(t => `"${t}"*`).join(' AND ');

      if (categoryTag) {
        rows = db.prepare(`
          SELECT p.* FROM products p
          JOIN products_fts f ON p.rowid = f.rowid
          WHERE products_fts MATCH ? AND p.categories_tags LIKE ?
          ORDER BY rank LIMIT ? OFFSET ?
        `).all(ftsQuery, `%${categoryTag}%`, pageSize, offset) as DbProductRow[];

        count = (db.prepare(`
          SELECT COUNT(*) AS c FROM products p
          JOIN products_fts f ON p.rowid = f.rowid
          WHERE products_fts MATCH ? AND p.categories_tags LIKE ?
        `).get(ftsQuery, `%${categoryTag}%`) as { c: number }).c;
      } else {
        rows = db.prepare(`
          SELECT p.* FROM products p
          JOIN products_fts f ON p.rowid = f.rowid
          WHERE products_fts MATCH ?
          ORDER BY rank LIMIT ? OFFSET ?
        `).all(ftsQuery, pageSize, offset) as DbProductRow[];

        count = (db.prepare(`
          SELECT COUNT(*) AS c FROM products p
          JOIN products_fts f ON p.rowid = f.rowid
          WHERE products_fts MATCH ?
        `).get(ftsQuery) as { c: number }).c;
      }
    } else {
      // Category-only browse
      rows = db.prepare(`
        SELECT * FROM products WHERE categories_tags LIKE ? LIMIT ? OFFSET ?
      `).all(`%${categoryTag}%`, pageSize, offset) as DbProductRow[];

      count = (db.prepare(`
        SELECT COUNT(*) AS c FROM products WHERE categories_tags LIKE ?
      `).get(`%${categoryTag}%`) as { c: number }).c;
    }

    // Fall back to OFf if local DB has no results
    if (rows.length === 0) {
      return fetchFromOff(query, category, page);
    }

    const products = rows.map(row => ({
      code:            row.barcode,
      product_name:    row.product_name ?? 'Unbekanntes Produkt',
      product_name_de: row.product_name ?? undefined,
      brands:          row.brands       ?? undefined,
      image_small_url: row.image_url    ?? undefined,
      ...rowToProduct(row),
    }));

    return NextResponse.json({ products, count, page });
  } catch {
    // SQLite unavailable — fall back to OFf
    return fetchFromOff(query, category, page);
  }
}
