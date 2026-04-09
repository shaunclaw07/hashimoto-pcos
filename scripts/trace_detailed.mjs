import { isKnownIngredient } from './scripts/ingredient-data.mjs';

const text = "Zartbitterschokolade 83% (Kakaomasse, Vollrohrzucker, Rohrzucker, Kakaobutter, Emulgator: Sonnenblumenlecithin), Reis gepufft 17%";

const segments = text.split(/[,;:]/);

console.log("DETAILED PARSING TRACE\n");
console.log("=".repeat(100));

for (let segIdx = 0; segIdx < segments.length; segIdx++) {
  const rawSegment = segments[segIdx];
  let seg = rawSegment.trim();
  
  console.log(`\n[${segIdx}] Input: "${rawSegment}"`);
  console.log(`    Trimmed: "${seg}"`);
  
  if (!seg) {
    console.log(`    → SKIP (empty after trim)`);
    continue;
  }

  // Step 1: Strip parenthetical content
  let prev;
  let iteration = 0;
  do {
    prev = seg;
    seg = seg.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    if (iteration > 0) console.log(`    After paren strip (iter ${iteration}): "${seg}"`);
    iteration++;
  } while (seg !== prev && seg.includes('('));
  console.log(`    After paren strip: "${seg}"`);

  // Step 2: Remove trailing percentages
  seg = seg.replace(/\d+[,.]?\d*\s*%\s*/g, '').trim();
  console.log(`    After % removal: "${seg}"`);

  // Step 3: Normalize internal hyphens
  seg = seg.replace(/([a-zäöüß])\s*-\s+([a-zäöüß])/gi, '$1$2').trim();
  seg = seg.replace(/([a-zäöüß])\s+-\s+([A-ZÄÖÜ])/g, '$1$2').trim();
  console.log(`    After hyphen norm (pass 1-2): "${seg}"`);

  // Step 4: Remove encoding artifacts
  seg = seg.replace(/([a-zäöüß])\s*-\s+(?=[a-zäöüß])/gi, '$1').trim();
  console.log(`    After hyphen norm (pass 3): "${seg}"`);

  // Step 5: Collapse multiple spaces, dashes, underscores
  seg = seg.replace(/\s{2,}/g, ' ').replace(/[_—–-]{2,}/g, ' ').trim();
  console.log(`    After space/dash collapse: "${seg}"`);

  // Step 6: Clean Unicode artifacts
  seg = seg.replace(/[×•°©®™¹²³⁴⁵⁶⁷⁸⁹@#$%^&®]+/g, ' ').trim();
  console.log(`    After unicode cleanup: "${seg}"`);

  // Step 7: Normalize E-number format
  seg = seg.replace(/^e\s*(\d+[a-z]?)\s*$/i, 'e$1').trim();
  console.log(`    After E-number norm: "${seg}"`);

  // Step 8: Remove digit-starting tokens
  seg = seg.replace(/^[\d,.]+\s*/g, '').trim();
  console.log(`    After digit prefix removal: "${seg}"`);
  if (!seg || /^\d+$/.test(seg)) {
    console.log(`    → SKIP (empty or all digits)`);
    continue;
  }

  // Step 9: Remove segments that are clearly garbage
  if (seg.length < 2) {
    console.log(`    → SKIP (length < 2)`);
    continue;
  }
  if (/^[^a-zäöüß]+$/i.test(seg)) {
    console.log(`    → SKIP (no letters)`);
    continue;
  }

  // Step 10: Lowercase for canonical form
  const canonical = seg.toLowerCase();
  console.log(`    Canonical: "${canonical}"`);

  // Step 12: Whitelist check
  const known = isKnownIngredient(canonical);
  console.log(`    isKnownIngredient("${canonical}"): ${known}`);
  
  if (!known) {
    console.log(`    → SKIP (not in whitelist)`);
  } else {
    console.log(`    ✓ INCLUDED`);
  }
}
