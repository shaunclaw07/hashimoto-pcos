import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isHapticSupported,
  triggerHaptic,
  triggerHapticWithFallback,
  HAPTIC_PATTERNS,
  type HapticPattern,
} from "./haptic-service";

describe("haptic-service", () => {
  let vibrateMock: ReturnType<typeof vi.fn>;
  let originalNavigator: typeof navigator;

  beforeEach(() => {
    originalNavigator = globalThis.navigator;
    vibrateMock = vi.fn();

    // Mock navigator.vibrate
    Object.defineProperty(globalThis, "navigator", {
      value: {
        ...originalNavigator,
        vibrate: vibrateMock,
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe("isHapticSupported", () => {
    it("returns true when navigator.vibrate is available", () => {
      expect(isHapticSupported()).toBe(true);
    });

    it("returns false when navigator.vibrate is undefined", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { ...originalNavigator },
        writable: true,
        configurable: true,
      });
      expect(isHapticSupported()).toBe(false);
    });

    it("returns false when navigator is undefined (SSR)", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      expect(isHapticSupported()).toBe(false);
    });
  });

  describe("triggerHaptic", () => {
    it("calls navigator.vibrate with single number pattern", () => {
      vibrateMock.mockReturnValue(true);

      triggerHaptic(50);

      expect(vibrateMock).toHaveBeenCalledWith(50);
      expect(vibrateMock).toHaveBeenCalledTimes(1);
    });

    it("calls navigator.vibrate with array pattern", () => {
      vibrateMock.mockReturnValue(true);
      const pattern: HapticPattern = [30, 50, 30];

      triggerHaptic(pattern);

      expect(vibrateMock).toHaveBeenCalledWith([30, 50, 30]);
    });

    it("returns true when vibration is triggered successfully", () => {
      vibrateMock.mockReturnValue(true);

      const result = triggerHaptic(50);

      expect(result).toBe(true);
    });

    it("returns false when navigator.vibrate returns false", () => {
      vibrateMock.mockReturnValue(false);

      const result = triggerHaptic(50);

      expect(result).toBe(false);
    });

    it("returns false when navigator.vibrate is not available", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { ...originalNavigator },
        writable: true,
        configurable: true,
      });

      const result = triggerHaptic(50);

      expect(result).toBe(false);
    });

    it("returns false when navigator is undefined (SSR)", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const result = triggerHaptic(50);

      expect(result).toBe(false);
    });

    it("returns false when navigator.vibrate throws an error", () => {
      vibrateMock.mockImplementation(() => {
        throw new Error("Invalid pattern");
      });

      const result = triggerHaptic([999999]);

      expect(result).toBe(false);
    });

    it("uses default TAP pattern when no pattern provided", () => {
      vibrateMock.mockReturnValue(true);

      triggerHaptic();

      expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.TAP);
    });

    it("works with all predefined HAPTIC_PATTERNS", () => {
      vibrateMock.mockReturnValue(true);

      Object.values(HAPTIC_PATTERNS).forEach((pattern) => {
        triggerHaptic(pattern);
      });

      expect(vibrateMock).toHaveBeenCalledTimes(Object.keys(HAPTIC_PATTERNS).length);
    });
  });

  describe("triggerHapticWithFallback", () => {
    it("returns true and does not call fallback when haptic works", () => {
      vibrateMock.mockReturnValue(true);
      const fallback = vi.fn();

      const result = triggerHapticWithFallback(50, fallback);

      expect(result).toBe(true);
      expect(fallback).not.toHaveBeenCalled();
    });

    it("calls fallback when haptic is not supported", () => {
      Object.defineProperty(globalThis, "navigator", {
        value: { ...originalNavigator },
        writable: true,
        configurable: true,
      });
      const fallback = vi.fn();

      const result = triggerHapticWithFallback(50, fallback);

      expect(result).toBe(false);
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it("calls fallback when vibration fails", () => {
      vibrateMock.mockReturnValue(false);
      const fallback = vi.fn();

      const result = triggerHapticWithFallback(50, fallback);

      expect(result).toBe(false);
      expect(fallback).toHaveBeenCalledTimes(1);
    });

    it("does not throw when fallback is undefined and haptic fails", () => {
      vibrateMock.mockReturnValue(false);

      expect(() => triggerHapticWithFallback(50)).not.toThrow();
    });
  });

  describe("HAPTIC_PATTERNS", () => {
    it("has expected predefined patterns", () => {
      expect(HAPTIC_PATTERNS.TAP).toBe(50);
      expect(HAPTIC_PATTERNS.LONG_PRESS).toBe(100);
      expect(HAPTIC_PATTERNS.SAVE).toEqual([30, 50, 30]);
      expect(HAPTIC_PATTERNS.ERROR).toEqual([50, 100, 50]);
      expect(HAPTIC_PATTERNS.SUCCESS).toEqual([20, 30, 20]);
    });

    it("has correct pattern types", () => {
      // TAP and LONG_PRESS are numbers (single vibration)
      expect(typeof HAPTIC_PATTERNS.TAP).toBe("number");
      expect(typeof HAPTIC_PATTERNS.LONG_PRESS).toBe("number");

      // SAVE, ERROR, SUCCESS are arrays (pattern vibrations)
      expect(Array.isArray(HAPTIC_PATTERNS.SAVE)).toBe(true);
      expect(Array.isArray(HAPTIC_PATTERNS.ERROR)).toBe(true);
      expect(Array.isArray(HAPTIC_PATTERNS.SUCCESS)).toBe(true);
    });
  });
});
