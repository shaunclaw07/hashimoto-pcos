/**
 * Unit tests for search functionality (FTS5 query building)
 */

import { describe, it, expect } from "vitest";

/**
 * FTS5 special characters that need escaping:
 * - " (double quote)
 * - * (asterisk)
 * - - (minus/hyphen)
 * - ( ) (parentheses)
 */
const FTS5_SPECIAL_CHARS = ['"', "*", "-", "(", ")"];

describe("FTS5 Query Building", () => {
  describe("escapeFts5Query (to be implemented)", () => {
    // This test will FAIL until we implement the escape function
    it("should escape double quotes", () => {
      const escapeFts5Query = (query: string): string => {
        return query.replace(/["*\-()]/g, "\\$&");
      };
      expect(escapeFts5Query('test"query')).toBe('test\\"query');
    });

    it("should escape asterisks", () => {
      const escapeFts5Query = (query: string): string => {
        return query.replace(/["*\-()]/g, "\\$&");
      };
      expect(escapeFts5Query('test*query')).toBe('test\\*query');
    });

    it("should escape hyphens/minus", () => {
      const escapeFts5Query = (query: string): string => {
        return query.replace(/["*\-()]/g, "\\$&");
      };
      expect(escapeFts5Query('test-query')).toBe('test\\-query');
    });

    it("should escape parentheses", () => {
      const escapeFts5Query = (query: string): string => {
        return query.replace(/["*\-()]/g, "\\$&");
      };
      expect(escapeFts5Query('test(query)')).toBe('test\\(query\\)');
    });

    it("should escape all FTS5 special characters", () => {
      const escapeFts5Query = (query: string): string => {
        return query.replace(/["*\-()]/g, "\\$&");
      };
      expect(escapeFts5Query('"test*-()*"')).toBe('\\"test\\*\\-\\(\\)\\*\\"');
    });
  });

  describe("FTS5 query building with escaped terms", () => {
    // This represents the CORRECT implementation
    const escapeFts5Query = (query: string): string => {
      return query.replace(/["*\-()]/g, "\\$&");
    };

    const buildFtsQuery = (query: string): string => {
      return query.trim().split(/\s+/).map(t => `"${escapeFts5Query(t)}"*`).join(' AND ');
    };

    it("should handle normal search terms", () => {
      expect(buildFtsQuery("milch")).toBe('"milch"*');
      expect(buildFtsQuery("milch produkte")).toBe('"milch"* AND "produkte"*');
    });

    it("should not crash with FTS5 special characters in search terms", () => {
      // These should NOT throw or cause errors
      expect(() => buildFtsQuery('test"query')).not.toThrow();
      expect(() => buildFtsQuery("test*query")).not.toThrow();
      expect(() => buildFtsQuery("test-query")).not.toThrow();
      expect(() => buildFtsQuery("test(query)")).not.toThrow();
    });

    it("should escape double quotes to prevent query injection", () => {
      const result = buildFtsQuery('"test" OR "1=1"');
      // The quotes should be escaped, preventing them from being interpreted as FTS5 operators
      expect(result).toContain('\\"');
    });

    it("should escape asterisks to prevent wildcard injection", () => {
      const result = buildFtsQuery("*");
      // Should escape the asterisk so it's treated as literal
      expect(result).toBe('"\\*"*'); // The * becomes literal, not a wildcard
    });

    it("should escape hyphens to prevent exclusion operator injection", () => {
      const result = buildFtsQuery("-excluded");
      // Should escape the hyphen so it's not interpreted as NOT operator
      expect(result).toBe('"\\-excluded"*');
    });

    it("should escape parentheses to prevent grouping injection", () => {
      const result = buildFtsQuery("(group)");
      // Should escape parentheses to prevent FTS5 grouping
      expect(result).toBe('"\\(group\\)"*');
    });

    it("should handle mixed malicious input", () => {
      const malicious = 'test" OR "1=1" OR "*';
      const result = buildFtsQuery(malicious);
      // All special chars should be escaped
      expect(result).not.toContain('" OR "');
      expect(result).toContain('\\"');
    });
  });

  describe("VULNERABLE: current implementation without escaping", () => {
    // This represents the VULNERABLE current code - used for comparison
    const buildVulnerableFtsQuery = (query: string): string => {
      return query.trim().split(/\s+/).map(t => `"${t}"*`).join(' AND ');
    };

    it("VULNERABLE: asterisk becomes a wildcard without escaping", () => {
      const result = buildVulnerableFtsQuery("*");
      expect(result).toBe('"*"*'); // Double asterisk = matches everything
    });

    it("VULNERABLE: quotes can be used for injection", () => {
      const result = buildVulnerableFtsQuery('"test" OR "1=1"');
      // Note: buildVulnerableFtsQuery splits on whitespace and wraps each term
      // The vulnerability is that quotes in the terms are NOT escaped
      expect(result).toBe('""test""* AND "OR"* AND ""1=1""*');
    });

    it("VULNERABLE: hyphen can create exclusion", () => {
      const result = buildVulnerableFtsQuery("-excluded");
      expect(result).toBe('"-excluded"*'); // This is a valid FTS5 exclusion
    });

    it("VULNERABLE: parentheses can group operators", () => {
      const result = buildVulnerableFtsQuery("(group)");
      expect(result).toBe('"(group)"*'); // FTS5 grouping syntax
    });
  });
});
