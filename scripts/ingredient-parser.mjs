import { isKnownIngredient } from './ingredient-data.mjs';

const PLACEHOLDER_NAMES = new Set(['xxx', 'unknown', 'none', 'n/a', 'to be completed', '-']);

/**
 * Returns true if the product name is non-empty and not a known placeholder.
 */
export function isValidProductName(name) {
  if (!name || typeof name !== 'string') return false;
  const t = name.trim();
  if (t.length < 2) return false;
  return !PLACEHOLDER_NAMES.has(t.toLowerCase());
}

/**
 * Parses a raw ingredients text string into an array of normalized ingredient objects.
 */
export function parseIngredients(text) {
  if (!text || typeof text !== 'string') return [];

  const segments = text.split(/[,;:]/);
  const seen = new Set();
  const result = [];

  for (const rawSegment of segments) {
    let seg = rawSegment.trim();
    if (!seg) continue;

    // Step 1: Strip parenthetical content
    let prev;
    do {
      prev = seg;
      seg = seg.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    } while (seg !== prev && seg.includes('('));

    // Step 2: Remove trailing percentages
    seg = seg.replace(/\d+[,.]?\d*\s*%\s*/g, '').trim();

    // Step 3: Normalize internal hyphens
    seg = seg.replace(/([a-zäöüß])\s*-\s+([a-zäöüß])/gi, '$1$2').trim();
    seg = seg.replace(/([a-zäöüß])\s+-\s+([A-ZÄÖÜ])/g, '$1$2').trim();

    // Step 4: Remove encoding artifacts
    seg = seg.replace(/([a-zäöüß])\s*-\s+(?=[a-zäöüß])/gi, '$1').trim();

    // Step 5: Collapse multiple spaces, dashes, underscores
    seg = seg.replace(/\s{2,}/g, ' ').replace(/[_—–-]{2,}/g, ' ').trim();

    // Step 6: Clean Unicode artifacts
    seg = seg.replace(/[×•°©®™¹²³⁴⁵⁶⁷⁸⁹@#$%^&®]+/g, ' ').trim();

    // Step 7: Normalize E-number format
    seg = seg.replace(/^e\s*(\d+[a-z]?)\s*$/i, 'e$1').trim();

    // Step 8: Remove digit-starting tokens
    seg = seg.replace(/^[\d,.]+\s*/g, '').trim();
    if (!seg || /^\d+$/.test(seg)) continue;

    // Step 9: Remove segments that are clearly garbage
    if (seg.length < 2) continue;
    if (/^[^a-zäöüß]+$/i.test(seg)) continue;

    // Step 10: Lowercase for canonical form
    const canonical = seg.toLowerCase();

    // Step 11: Deduplicate
    if (seen.has(canonical)) continue;
    seen.add(canonical);

    // Step 13: Whitelist check
    if (!isKnownIngredient(canonical)) continue;

    result.push({ raw: rawSegment.trim(), canonical });
  }

  return result;
}
