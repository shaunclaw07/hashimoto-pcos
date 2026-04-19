const DASH_VARIANTS = /[\u2010\u2011\u2012\u2013\u2014]/g;

/**
 * Normalizes an ingredient name for stable alias matching.
 *
 * Lowercases, strips accents (NFKD), normalizes E-number spellings
 * (e.g. `E 322` → `e322`), and unifies dash/whitespace variants.
 *
 * @param value - Raw ingredient name
 * @returns Normalized name ready for keyword comparison
 */
export function normalizeIngredientName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(DASH_VARIANTS, "-")
    .replace(/\be\s*-?\s*(\d+[a-z]?)\b/g, "e$1")
    .replace(/([a-z0-9])\s+-\s+([a-z0-9])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}
