import { describe, it, expect } from "vitest";
import { isValidEan13, isValidBarcode } from "./barcode-service";

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

describe("isValidBarcode", () => {
  it("returns true for EAN-8 barcodes (8 digits)", () => {
    expect(isValidBarcode("12345678")).toBe(true);
    expect(isValidBarcode("76222104")).toBe(true);
  });

  it("returns true for UPC-A barcodes (12 digits)", () => {
    expect(isValidBarcode("012345678901")).toBe(true);
    expect(isValidBarcode("762221044928")).toBe(true);
  });

  it("returns true for EAN-13 barcodes (13 digits)", () => {
    expect(isValidBarcode("5000159484695")).toBe(true);
    expect(isValidBarcode("3017620422003")).toBe(true);
  });

  it("returns false for barcodes with wrong length", () => {
    expect(isValidBarcode("123")).toBe(false);           // 3 digits
    expect(isValidBarcode("1234567")).toBe(false);       // 7 digits
    expect(isValidBarcode("12345678901234")).toBe(false); // 14 digits
  });

  it("returns false for barcodes with non-digit characters", () => {
    expect(isValidBarcode("12345678a")).toBe(false);
    expect(isValidBarcode("abcdefghijklm")).toBe(false);
    expect(isValidBarcode("")).toBe(false);
  });
});
