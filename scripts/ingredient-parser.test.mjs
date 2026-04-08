import { describe, it, expect } from 'vitest';
import { isValidProductName, parseIngredients } from './ingredient-parser.mjs';

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
