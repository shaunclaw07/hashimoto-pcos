import { isKnownIngredient } from './ingredient-data.mjs';

const PLACEHOLDER_NAMES = new Set(['xxx', 'unknown', 'none', 'n/a', 'to be completed', '-']);

/**
 * Functional category labels that describe a specific ingredient.
 * These should NEVER be emitted as standalone ingredients — only alongside
 * their specific counterpart (e.g. "Emulgator: Sonnenblumenlecithin" → emit only "Sonnenblumenlecithin").
 * Unlike real ingredients (e.g. "salz"), functional labels have no standalone meaning.
 */
const FUNCTIONAL_LABELS = new Set([
  'emulgator','emulgatoren',
  'antioxidationsmittel','antioxidant',
  'säureregulator',
  'säuerungsmittel',
  'verdickungsmittel',
  'feuchthaltemittel',
  'festigungsmittel',
  'konservierungsstoff','konservierungsmittel',
]);

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
 * Walks the raw ingredient string and returns a flat list of token strings.
 *
 * Rules:
 *   depth 0 → top-level ingredient text
 *   depth 1 → direct sub-ingredient text (inside first-level parens)
 *   depth > 1 → discard (percentage info inside nested parens like "(min. 55%)")
 *
 * Commas and semicolons at depth 0 and 1 split tokens.
 * Opening paren at depth 0 flushes the current top-level token, then increments depth.
 * Closing paren at depth 1→0 flushes any sub-ingredient token in progress.
 * Colons are kept as-is (handled per-token in Phase 2 below).
 */
function flattenIngredients(text) {
  const tokens = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') {
      if (depth === 0 && current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      depth++;
    } else if (ch === ')') {
      if (depth === 1 && current.trim()) {
        tokens.push(current.trim());
        current = '';
      }
      if (depth > 0) depth--;
    } else if (ch === ',') {
      if (depth <= 1) {
        let token = current.trim();
        // If the text after the comma starts with a split percentage (e.g. "99,9%")
        // that was broken by the comma, strip the trailing digits from current token
        // (e.g. current="Äpfel 99", rest="9,9%,Foo" → token becomes "Äpfel")
        const rest = text.slice(i + 1);
        const pctMatch = rest.match(/^\d+[,.]?\d*\s*%/);
        if (pctMatch) {
          token = token.replace(/\d+$/, '').trim();
        }
        if (token) tokens.push(token);
        current = '';
      }
    } else if (ch === ';') {
      if (depth <= 1) {
        if (current.trim()) tokens.push(current.trim());
        current = '';
      }
    } else {
      if (depth <= 1) current += ch;
    }
  }
  if (current.trim()) tokens.push(current.trim());
  return tokens;
}

/**
 * Parses a raw ingredients text string into an array of normalized ingredient objects.
 */
export function parseIngredients(text) {
  if (!text || typeof text !== 'string') return [];

  // Phase 1: flatten nested parenthetical structure
  const flatTokens = flattenIngredients(text);

  // Phase 2: handle "Label: Ingredient" colon pattern within each token
  const segments = [];
  for (const token of flatTokens) {
    if (token.includes(':')) {
      const parts = token.split(':');
      if (parts.length === 2) {
        const label = parts[0].trim();
        const specific = parts[1].trim();
        const labelLower = label.toLowerCase();
        const specificLower = specific.toLowerCase();

        if (isKnownIngredient(specificLower)) {
          if (FUNCTIONAL_LABELS.has(labelLower)) {
            // "Emulgator: Sonnenblumenlecithin" → emit only the specific ingredient
            segments.push(specific);
          } else {
            // "Salz: Mehl" → both are real ingredients, emit both
            segments.push(label, specific);
          }
        } else {
          // Right side not known → emit both (fallback)
          segments.push(label, specific);
        }
      } else {
        // Multiple colons — fall back to naive split, but skip functional labels
        const parts = token.split(':').filter(p => !FUNCTIONAL_LABELS.has(p.trim().toLowerCase()));
        segments.push(...parts);
      }
    } else {
      segments.push(token);
    }
  }

  const seen = new Set();
  const result = [];

  for (const rawSegment of segments) {
    let seg = rawSegment.trim();
    if (!seg) continue;

    // Step 1: Strip any remaining parenthetical content (paren content already
    // handled by flattener — this catches edge cases where parens appear after
    // a colon split)
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

    // Step 12: Whitelist check
    if (!isKnownIngredient(canonical)) continue;

    // Step 12b: Skip standalone functional labels (they only have meaning
    // alongside a specific ingredient after a colon, not as bare ingredients)
    if (FUNCTIONAL_LABELS.has(canonical)) continue;

    result.push({ raw: rawSegment.trim(), canonical });
  }

  return result;
}
