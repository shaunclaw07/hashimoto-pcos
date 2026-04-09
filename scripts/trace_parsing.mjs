import { parseIngredients } from './scripts/ingredient-parser.mjs';

const text = "Zartbitterschokolade 83% (Kakaomasse, Vollrohrzucker, Rohrzucker, Kakaobutter, Emulgator: Sonnenblumenlecithin), Reis gepufft 17%";

console.log("Input text:");
console.log(text);
console.log("\n=== PARSING TRACE ===\n");

// Manually trace through the split step
const segments = text.split(/[,;:]/);
console.log("Step 0: After split on [,;:]");
segments.forEach((seg, i) => console.log(`  [${i}] "${seg}"`));

console.log("\n\nFull parseIngredients() result:");
const result = parseIngredients(text);
console.log(`Found ${result.length} ingredients:`);
result.forEach((ing, i) => {
  console.log(`  [${i}] raw="${ing.raw}" -> canonical="${ing.canonical}"`);
});

if (result.length === 0) {
  console.log("\nNo ingredients parsed! Something went wrong.");
}
