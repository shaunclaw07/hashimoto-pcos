import { describe, it, expect, beforeEach } from "vitest";
import { createElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { useUserProfile } from "./use-user-profile";

const PROFILE_KEY = "hashimoto-pcos-user-profile";
const SKIPPED_KEY = "hashimoto-pcos-onboarding-skipped";

const mockProfile = {
  condition: "hashimoto" as const,
  glutenSensitive: false,
  lactoseIntolerant: false,
};

// Minimal renderHook implementation using react-dom/client + act
function renderHook<T>(hook: () => T): { result: { current: T } } {
  const result: { current: T } = { current: null as unknown as T };

  function Wrapper() {
    result.current = hook();
    // Re-render on state changes via useState trick
    const [, forceUpdate] = useState(0);
    void forceUpdate; // suppress unused warning
    return null;
  }

  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(Wrapper));
  });

  // Cleanup helper attached to result for convenience
  (result as { current: T; _cleanup?: () => void })._cleanup = () => {
    act(() => { root.unmount(); });
    document.body.removeChild(container);
  };

  return { result };
}

beforeEach(() => {
  localStorage.clear();
});

describe("useUserProfile", () => {
  it("starts with profile=null and isLoaded=false", () => {
    const { result } = renderHook(() => useUserProfile());
    // jsdom effects run synchronously within act, so settled state is checked
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.profile).toBeNull();
  });

  it("loads null profile when localStorage is empty", () => {
    const { result } = renderHook(() => useUserProfile());
    expect(result.current.profile).toBeNull();
    expect(result.current.isLoaded).toBe(true);
  });

  it("loads stored profile from localStorage", () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(mockProfile));
    const { result } = renderHook(() => useUserProfile());
    expect(result.current.profile).toEqual(mockProfile);
    expect(result.current.isLoaded).toBe(true);
  });

  it("setProfile stores profile in localStorage and updates state", () => {
    const { result } = renderHook(() => useUserProfile());
    act(() => { result.current.setProfile(mockProfile); });
    expect(result.current.profile).toEqual(mockProfile);
    expect(localStorage.getItem(PROFILE_KEY)).toBe(JSON.stringify(mockProfile));
  });

  it("setProfile(null) removes profile from localStorage", () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(mockProfile));
    const { result } = renderHook(() => useUserProfile());
    act(() => { result.current.setProfile(null); });
    expect(result.current.profile).toBeNull();
    expect(localStorage.getItem(PROFILE_KEY)).toBeNull();
  });

  it("skipOnboarding sets hasSkipped=true", () => {
    const { result } = renderHook(() => useUserProfile());
    expect(result.current.hasSkipped).toBe(false);
    act(() => { result.current.skipOnboarding(); });
    expect(result.current.hasSkipped).toBe(true);
    expect(localStorage.getItem(SKIPPED_KEY)).toBe("true");
  });

  it("hasSkipped is true when SKIPPED_KEY is set in localStorage", () => {
    localStorage.setItem(SKIPPED_KEY, "true");
    const { result } = renderHook(() => useUserProfile());
    expect(result.current.hasSkipped).toBe(true);
  });

  it("returns null profile and no crash on corrupt localStorage data", () => {
    localStorage.setItem(PROFILE_KEY, "not-valid-json{{{");
    const { result } = renderHook(() => useUserProfile());
    expect(result.current.profile).toBeNull();
    expect(result.current.isLoaded).toBe(true);
  });
});
