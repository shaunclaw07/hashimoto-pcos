/**
 * Unit tests for session-storage-cache.ts — LRU-bounded sessionStorage helpers
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getItem, setItem, removeItem } from "../session-storage-cache";

const CACHE_META_KEY = "search-results:__meta__";

function readMeta(): { keys: string[] } {
  const raw = sessionStorage.getItem(CACHE_META_KEY);
  return raw ? JSON.parse(raw) : { keys: [] };
}

describe("session-storage-cache", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("setItem + getItem", () => {
    it("stores and retrieves a value", () => {
      setItem("test-key", { name: "Tomate", score: 4.5 });
      const result = getItem<{ name: string; score: number }>("test-key");
      expect(result).toEqual({ name: "Tomate", score: 4.5 });
    });

    it("returns null for a key that does not exist", () => {
      const result = getItem<unknown>("nonexistent-key");
      expect(result).toBeNull();
    });

    it("overwrites an existing key with new value", () => {
      setItem("test-key", { value: 1 });
      setItem("test-key", { value: 2 });
      const result = getItem<{ value: number }>("test-key");
      expect(result).toEqual({ value: 2 });
    });
  });

  describe("LRU eviction", () => {
    it("evicts the oldest entry when adding the 11th entry (limit = 10)", () => {
      // Add 10 entries — none should be evicted
      for (let i = 0; i < 10; i++) {
        setItem(`key-${i}`, { index: i });
      }
      const meta = readMeta();
      expect(meta.keys).toHaveLength(10);
      expect(sessionStorage.getItem("key-0")).toBeDefined();

      // Add one more — key-0 should be evicted
      setItem("key-10", { index: 10 });
      const metaAfter = readMeta();
      expect(metaAfter.keys).toHaveLength(10);
      expect(sessionStorage.getItem("key-0")).toBeNull();
      expect(sessionStorage.getItem("key-10")).toBeDefined();
    });

    it("evicts only the single oldest entry on overflow", () => {
      for (let i = 0; i < 12; i++) {
        setItem(`key-${i}`, { index: i });
      }
      // After 12 inserts over a limit of 10, exactly 2 oldest should be gone
      expect(sessionStorage.getItem("key-0")).toBeNull();
      expect(sessionStorage.getItem("key-1")).toBeNull();
      expect(sessionStorage.getItem("key-2")).toBeDefined();
      expect(sessionStorage.getItem("key-11")).toBeDefined();
    });

    it("evicts the correct oldest key after LRU promotion", () => {
      // Add 3 items: A, B, C
      setItem("key-A", { a: 1 });
      setItem("key-B", { b: 2 });
      setItem("key-C", { c: 3 });

      // Access key-A (promotes it to MRU position)
      getItem<unknown>("key-A");

      // Now fill to capacity: need 7 more (3 + 7 = 10)
      for (let i = 0; i < 7; i++) {
        setItem(`filler-${i}`, { filler: i });
      }

      // Cache is full: [key-B, key-C, key-A, filler-0..filler-6]
      // key-B is the oldest (key-A was promoted to MRU)
      expect(sessionStorage.getItem("key-B")).toBeDefined();

      // Adding one more should evict key-B (the oldest)
      setItem("newest", { newest: true });

      expect(sessionStorage.getItem("key-A")).toBeDefined(); // was promoted
      expect(sessionStorage.getItem("key-B")).toBeNull(); // was evicted (oldest)
      expect(sessionStorage.getItem("key-C")).toBeDefined();
    });

    it("overwriting an existing key does not cause eviction", () => {
      for (let i = 0; i < 10; i++) {
        setItem(`key-${i}`, { index: i });
      }
      // Overwrite key-0 (does not change order besides promotion)
      setItem("key-0", { index: 0, updated: true });

      const meta = readMeta();
      expect(meta.keys).toHaveLength(10);
      expect(sessionStorage.getItem("key-0")).toBeDefined();
      expect(sessionStorage.getItem("key-9")).toBeDefined();
    });
  });

  describe("removeItem", () => {
    it("removes the key from sessionStorage", () => {
      setItem("test-key", { value: 1 });
      removeItem("test-key");
      expect(sessionStorage.getItem("test-key")).toBeNull();
      const result = getItem<unknown>("test-key");
      expect(result).toBeNull();
    });

    it("removes the key from the meta tracking list", () => {
      setItem("key-A", { a: 1 });
      setItem("key-B", { b: 2 });
      removeItem("key-A");
      const meta = readMeta();
      expect(meta.keys).not.toContain("key-A");
      expect(meta.keys).toContain("key-B");
    });

    it("does not throw when removing a non-existent key", () => {
      expect(() => removeItem("nonexistent")).not.toThrow();
    });
  });

  describe("corrupt meta resilience", () => {
    it("returns null and does not throw for malformed JSON in meta", () => {
      sessionStorage.setItem(CACHE_META_KEY, "not-valid-json{{{");
      const result = getItem<unknown>("any-key");
      expect(result).toBeNull();
    });

    it("does not throw when individual entry is corrupted", () => {
      setItem("good-key", { value: 1 });
      // Corrupt the stored value (but meta is valid)
      sessionStorage.setItem("good-key", "not-json{{{");
      const result = getItem<unknown>("good-key");
      expect(result).toBeNull();
    });
  });
});
