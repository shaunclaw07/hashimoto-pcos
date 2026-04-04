/**
 * Validates EAN-13 barcode format (exactly 13 digits).
 */
export function isValidEan13(barcode: string): boolean {
  return /^\d{13}$/.test(barcode);
}

/**
 * Validates generic barcode format (8-13 digits).
 * Accepts: EAN-8 (8), UPC-A (12), UPC-E (8), EAN-13 (13)
 */
export function isValidBarcode(barcode: string): boolean {
  return /^\d{8,13}$/.test(barcode);
}
