import { describe, it, expect } from "vitest";
import { sanitizeFtsInput } from "./sqlite-product-repository";

describe("sanitizeFtsInput", () => {
  it("soll Anfuehrungszeichen entfernen", () => {
    expect(sanitizeFtsInput('test" AND invalid')).not.toContain('"');
  });

  it("soll FTS-Operatoren AND/OR/NOT entfernen", () => {
    const result = sanitizeFtsInput("test AND invalid OR something NOT other");
    expect(result.toUpperCase()).not.toContain(" AND ");
    expect(result.toUpperCase()).not.toContain(" OR ");
    expect(result.toUpperCase()).not.toContain(" NOT ");
  });

  it("soll runde Klammern entfernen", () => {
    expect(sanitizeFtsInput("test (invalid)")).not.toContain("(");
    expect(sanitizeFtsInput("test (invalid)")).not.toContain(")");
  });

  it("soll Sternchen fuer Injection-Versuche entfernen", () => {
    // Sternchen sind FTS-Metacharakter und muessen entfernt werden
    const result = sanitizeFtsInput("test*");
    expect(result).not.toContain("*");
  });

  it("soll NEAR mit Distanz-Argument entfernen", () => {
    const result = sanitizeFtsInput("coffee NEAR/3 tea");
    expect(result.toUpperCase()).not.toContain("NEAR");
  });

  it("soll leere Eingabe sicher behandeln", () => {
    expect(sanitizeFtsInput("")).toBe("");
    expect(sanitizeFtsInput("   ")).toBe("");
    expect(sanitizeFtsInput(null as any)).toBe("");
  });

  it("soll legale Suchbegriffe korrekt verarbeiten", () => {
    const result = sanitizeFtsInput("bio linsen");
    expect(result.toLowerCase()).toContain("bio");
    expect(result.toLowerCase()).toContain("linsen");
  });

  it("soll mehrere Leerzeichen korrekt behandeln", () => {
    const result = sanitizeFtsInput("bio   linsen");
    expect(result).toBeTruthy();
  });
});
