export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new RangeError("clamp requires min <= max");
  }

  return Math.min(Math.max(value, min), max);
}
