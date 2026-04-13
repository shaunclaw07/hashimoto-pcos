import { describe, expect, it } from "vitest";

import { clamp } from "./math";

describe("clamp", () => {
  it("returns min when value is below min", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("returns min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("returns max when value is above max", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("returns max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("returns value when inside range", () => {
    expect(clamp(7, 0, 10)).toBe(7);
  });

  it("throws when min is greater than max", () => {
    expect(() => clamp(5, 10, 0)).toThrowError("clamp requires min <= max");
  });
});
