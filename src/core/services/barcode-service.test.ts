import { describe, it, expect } from "vitest";
import { isValidEan13 } from "./barcode-service";

describe("isValidEan13", () => {
  it("returns true for valid 13-digit barcodes", () => {
    expect(isValidEan13("5000159484695")).toBe(true);
    expect(isValidEan13("3017620422003")).toBe(true);
    expect(isValidEan13("0000000000000")).toBe(true);
  });

  it("returns false for barcodes with wrong length", () => {
    expect(isValidEan13("123")).toBe(false);
    expect(isValidEan13("123456789012")).toBe(false);   // 12 digits
    expect(isValidEan13("12345678901234")).toBe(false); // 14 digits
  });

  it("returns false for barcodes with non-digit characters", () => {
    expect(isValidEan13("123456789012a")).toBe(false);
    expect(isValidEan13("abcdefghijklm")).toBe(false);
    expect(isValidEan13("")).toBe(false);
  });
});
