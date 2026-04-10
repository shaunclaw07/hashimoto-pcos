/**
 * Unit tests for use-online-status.ts
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { useOnlineStatus } from "./use-online-status";

const containers: HTMLDivElement[] = [];

// Minimal renderHook implementation using react-dom/client + act
function renderHook<T>(hook: () => T): { result: { current: T } } {
  const result: { current: T } = { current: null as unknown as T };

  function Wrapper() {
    result.current = hook();
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  containers.push(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(Wrapper));
  });

  return { result };
}

afterEach(() => {
  containers.forEach((container) => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });
  containers.length = 0;
});

describe("use-online-status", () => {
  beforeEach(() => {
    // Reset navigator.onLine to true by default
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  it("returns true as initial state when navigator.onLine is true", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false as initial state when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("updates to true when online event fires", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(result.current).toBe(true);
  });

  it("updates to false when offline event fires", () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    expect(result.current).toBe(false);
  });
});
