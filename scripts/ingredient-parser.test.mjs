import { describe, it, expect } from 'vitest';
import { isValidProductName, parseIngredients } from './ingredient-parser.mjs';

describe('parseIngredients — nested structures', () => {

  it('correctly parses Puffreis Zartbitter (0006040329138)', () => {
    const result = parseIngredients(
      'Zartbitterschokolade 83% (Kakaomasse, Vollrohrzucker, Rohrzucker, ' +
      'Kakaobutter, Emulgator: Sonnenblumenlecithin), Reis gepufft 17%'
    );
    const c = result.map(r => r.canonical);
    expect(c).toContain('zartbitterschokolade');
    expect(c).toContain('kakaomasse');
    expect(c).toContain('vollrohrzucker');
    expect(c).toContain('rohrzucker');
    expect(c).toContain('kakaobutter');
    expect(c).toContain('sonnenblumenlecithin');
    expect(c).toContain('reis gepufft');
    expect(c).toHaveLength(7);
  });

  it('splits top-level "Label: Ingredient" — specific only when right side known', () => {
    const result = parseIngredients('Äpfel 99,9%, Antioxidationsmittel: Ascorbinsäure');
    const c = result.map(r => r.canonical);
    expect(c).not.toContain('antioxidationsmittel');
    expect(c).toContain('ascorbinsäure');
    expect(c).toContain('äpfel'); // äpfel is a real ingredient, emitted independently
    expect(c).toHaveLength(2);
  });

  it('handles "Label: Ingredient" inside parentheses (Radler-Müsli)', () => {
    const result = parseIngredients(
      'Schokoladenflocken (Rohrzucker, Kakaomasse, Emulgator: Raps-Lecithin, Kakaobutter)'
    );
    const c = result.map(r => r.canonical);
    expect(c).toContain('schokoladenflocken');
    expect(c).toContain('rohrzucker');
    expect(c).toContain('kakaomasse');
    expect(c).toContain('raps-lecithin');
    expect(c).toContain('kakaobutter');
    expect(c).toHaveLength(5);
  });

  it('discards content in doubly-nested parens (percentage annotations)', () => {
    const result = parseIngredients('Kokosmilch (Kokosfruchtfleisch (min. 55%), Wasser)');
    const c = result.map(r => r.canonical);
    expect(c).toContain('kokosmilch');
    expect(c).toContain('kokosfruchtfleisch');
    expect(c).toContain('wasser');
    expect(c).not.toContain('min');
  });

  it('extracts E-number after "Säureregulator:" label', () => {
    const result = parseIngredients('Wasser, Mangopüree, Säureregulator: E330');
    const c = result.map(r => r.canonical);
    expect(c).not.toContain('säureregulator');
    expect(c).toContain('e330');
    expect(c).toHaveLength(3); // wasser, mangopüree, e330
  });
});

describe('isValidProductName', () => {
  it('returns false for null', () => {
    expect(isValidProductName(null)).toBe(false);
  });

  it('returns false for non-string', () => {
    expect(isValidProductName(42)).toBe(false);
    expect(isValidProductName(undefined)).toBe(false);
  });

  it('returns false for names shorter than 2 characters', () => {
    expect(isValidProductName('')).toBe(false);
    expect(isValidProductName('a')).toBe(false);
  });

  it('returns false for known placeholder names', () => {
    expect(isValidProductName('xxx')).toBe(false);
    expect(isValidProductName('unknown')).toBe(false);
    expect(isValidProductName('none')).toBe(false);
    expect(isValidProductName('n/a')).toBe(false);
    expect(isValidProductName('to be completed')).toBe(false);
    expect(isValidProductName('-')).toBe(false);
  });

  it('is case-insensitive for placeholders', () => {
    expect(isValidProductName('XXX')).toBe(false);
    expect(isValidProductName('Unknown')).toBe(false);
  });

  it('returns true for a valid product name', () => {
    expect(isValidProductName('Vollmilch 3,5%')).toBe(true);
    expect(isValidProductName('Bio Haferflocken')).toBe(true);
    expect(isValidProductName('ab')).toBe(true);
  });
});

describe('parseIngredients', () => {
  it('returns empty array for null/undefined/empty input', () => {
    expect(parseIngredients(null)).toEqual([]);
    expect(parseIngredients(undefined)).toEqual([]);
    expect(parseIngredients('')).toEqual([]);
  });

  it('splits on comma, semicolon, and colon', () => {
    const result = parseIngredients('butter,zucker;salz:mehl');
    const canonicals = result.map(r => r.canonical);
    expect(canonicals).toContain('butter');
    expect(canonicals).toContain('zucker');
    expect(canonicals).toContain('salz');
    expect(canonicals).toContain('mehl');
  });

  it('strips parenthetical content', () => {
    const result = parseIngredients('zucker (aus Rübenzucker)');
    expect(result[0].canonical).toBe('zucker');
  });

  it('removes percentage values', () => {
    const result = parseIngredients('weizenmehl 72%');
    expect(result[0].canonical).toBe('weizenmehl');
  });

  it('normalizes E-numbers', () => {
    const result = parseIngredients('e 322, e100');
    const canonicals = result.map(r => r.canonical);
    expect(canonicals).toContain('e322');
    expect(canonicals).toContain('e100');
  });

  it('deduplicates entries', () => {
    const result = parseIngredients('zucker, Zucker, ZUCKER');
    expect(result.filter(r => r.canonical === 'zucker')).toHaveLength(1);
  });

  it('filters out non-whitelisted tokens', () => {
    const result = parseIngredients('nhrwertangaben, portion, zucker');
    const canonicals = result.map(r => r.canonical);
    expect(canonicals).not.toContain('nhrwertangaben');
    expect(canonicals).not.toContain('portion');
    expect(canonicals).toContain('zucker');
  });

  it('preserves raw form alongside canonical', () => {
    const result = parseIngredients('Zucker 50%');
    expect(result[0].raw).toBeTruthy();
    expect(result[0].canonical).toBe('zucker');
  });
});
