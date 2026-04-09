/**
 * Haptic feedback service for mobile interactions
 * Wraps navigator.vibrate API with proper TypeScript types and fallback handling
 */

export type HapticPattern = number | number[] | readonly number[];

export interface HapticFeedbackOptions {
  pattern?: HapticPattern;
  fallback?: () => void;
}

// Predefined haptic patterns (in milliseconds)
export const HAPTIC_PATTERNS = {
  /** Short tap - for button presses */
  TAP: 50,
  /** Double pulse - for successful save */
  SAVE: [30, 50, 30],
  /** Long press - for important actions */
  LONG_PRESS: 100,
  /** Error buzz - for errors/warnings */
  ERROR: [50, 100, 50],
  /** Success pattern - for successful operations */
  SUCCESS: [20, 30, 20],
} as const;

/**
 * Check if haptic feedback is supported on this device
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== "undefined" && "vibrate" in navigator;
}

/**
 * Trigger haptic feedback with the specified pattern
 * @param pattern - Vibration pattern (single number in ms, or array of on/off intervals)
 * @returns true if vibration was triggered, false if not supported or failed
 */
export function triggerHaptic(pattern: HapticPattern = HAPTIC_PATTERNS.TAP): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  try {
    // navigator.vibrate returns boolean in spec but some browsers return void
    // Type assertion needed because VibratePattern expects mutable number[]
    const result = navigator.vibrate(pattern as number | number[]);
    return result !== false;
  } catch {
    // Some browsers may throw on invalid patterns
    return false;
  }
}

/**
 * Trigger haptic feedback with fallback callback if not supported
 */
export function triggerHapticWithFallback(
  pattern: HapticPattern = HAPTIC_PATTERNS.TAP,
  fallback?: () => void
): boolean {
  const triggered = triggerHaptic(pattern);

  if (!triggered && fallback) {
    fallback();
  }

  return triggered;
}
