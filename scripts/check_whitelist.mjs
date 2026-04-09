import { isKnownIngredient } from './scripts/ingredient-data.mjs';

const candidates = [
  'reis',
  'reispulfer',
  'reis gepufft',
  'kakaobutter',
  'kakao butter',
  'vollrohrzucker',
  'rohrzucker',
  'kakaomasse',
  'zartbitterschokolade',
  'sonnenblumenlecithin',
  'emulgator',
];

console.log("Whitelist check:");
candidates.forEach(name => {
  const result = isKnownIngredient(name);
  console.log(`  "${name}": ${result ? '✓' : '✗'}`);
});
