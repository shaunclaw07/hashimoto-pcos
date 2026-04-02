/**
 * Validates EAN-13 barcode format (exactly 13 digits).
 */
export function isValidEan13(barcode: string): boolean {
  return /^\d{13}$/.test(barcode);
}
