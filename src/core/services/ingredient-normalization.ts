const DASH_VARIANTS = /[\u2010\u2011\u2012\u2013\u2014]/g;

export function normalizeIngredientName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(DASH_VARIANTS, "-")
    .replace(/\be\s*-?\s*(\d+[a-z]?)\b/g, "e$1")
    .replace(/([a-z])\s+-\s+([a-z])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .trim();
}
