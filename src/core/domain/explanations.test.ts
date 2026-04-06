import { describe, it, expect } from "vitest";
import { getExplanation, EXPLANATIONS, EXPLAINED_REASONS } from "./explanations";

describe("getExplanation", () => {
  it("returns null for unknown reason", () => {
    expect(getExplanation("Unbekannter Faktor")).toBeNull();
    expect(getExplanation("")).toBeNull();
  });

  it("returns generic explanation when no condition is given", () => {
    const result = getExplanation("Ballaststoffe > 6g/100g");
    expect(result).not.toBeNull();
    expect(result!.title).toContain("Ballaststoffe");
    expect(result!.text).toBeTruthy();
  });

  it("returns generic text when condition has no override", () => {
    const generic = getExplanation("Omega-3 vorhanden");
    const withPcos = getExplanation("Omega-3 vorhanden", "pcos");
    expect(withPcos).not.toBeNull();
    expect(withPcos!.text).toBe(generic!.text);
  });

  it("returns condition-specific text when override exists", () => {
    const generic = getExplanation("Zucker > 20g/100g");
    const pcos = getExplanation("Zucker > 20g/100g", "pcos");
    expect(pcos!.text).not.toBe(generic!.text);
    expect(pcos!.text).toContain("Insulinresistenz");
  });

  it("returns condition-specific text for hashimoto override", () => {
    const generic = getExplanation("Gluten in Zutaten");
    const hashimoto = getExplanation("Gluten in Zutaten", "hashimoto");
    expect(hashimoto!.text).not.toBe(generic!.text);
    expect(hashimoto!.text).toContain("molekulare Mimikry");
  });

  it("returns condition-specific text for 'both' override", () => {
    const generic = getExplanation("Zucker > 20g/100g");
    const both = getExplanation("Zucker > 20g/100g", "both");
    expect(both!.text).not.toBe(generic!.text);
    expect(both!.text).toContain("PCOS");
    expect(both!.text).toContain("Hashimoto");
  });

  it("preserves the original title when returning condition override", () => {
    const generic = getExplanation("Zucker > 10g/100g");
    const pcos = getExplanation("Zucker > 10g/100g", "pcos");
    expect(pcos!.title).toBe(generic!.title);
  });

  it("does not mutate the original EXPLANATIONS entry", () => {
    const original = EXPLANATIONS["Zucker > 20g/100g"].text;
    getExplanation("Zucker > 20g/100g", "pcos");
    expect(EXPLANATIONS["Zucker > 20g/100g"].text).toBe(original);
  });

  describe("all 15 scoring factors are covered", () => {
    const expectedReasons = [
      "Ballaststoffe > 6g/100g",
      "Ballaststoffe > 3g/100g",
      "Protein > 20g/100g",
      "Omega-3 vorhanden",
      "Glutenfrei-Label",
      "Bio-Label",
      "Zucker > 20g/100g",
      "Zucker > 10g/100g",
      "Zucker > 5g/100g",
      "Gesättigte Fette > 10g/100g",
      "Salz > 2.5g/100g",
      "Salz > 1.5g/100g",
      "Gluten in Zutaten",
      "Laktose in Zutaten",
      ">5 Zusatzstoffe",
    ];

    it("covers all expected reasons", () => {
      for (const reason of expectedReasons) {
        expect(getExplanation(reason), `Missing explanation for: ${reason}`).not.toBeNull();
      }
    });

    it("EXPLAINED_REASONS contains all expected reasons", () => {
      for (const reason of expectedReasons) {
        expect(EXPLAINED_REASONS).toContain(reason);
      }
    });

    it("each explanation has a non-empty title and text", () => {
      for (const [reason, explanation] of Object.entries(EXPLANATIONS)) {
        expect(explanation.title, `Empty title for: ${reason}`).toBeTruthy();
        expect(explanation.text, `Empty text for: ${reason}`).toBeTruthy();
      }
    });

    it("each explanation has at least one source", () => {
      for (const [reason, explanation] of Object.entries(EXPLANATIONS)) {
        expect(explanation.sources, `No sources for: ${reason}`).toBeDefined();
        expect(explanation.sources!.length, `Empty sources for: ${reason}`).toBeGreaterThan(0);
      }
    });

    it("each source has a non-empty label and url", () => {
      for (const [reason, explanation] of Object.entries(EXPLANATIONS)) {
        for (const source of explanation.sources ?? []) {
          expect(source.label, `Empty source label for: ${reason}`).toBeTruthy();
          expect(source.url, `Empty source url for: ${reason}`).toBeTruthy();
          expect(source.url, `Source URL must start with https for: ${reason}`).toMatch(/^https:\/\//);
        }
      }
    });
  });

  describe("condition-specific overrides", () => {
    it("Ballaststoffe > 6g/100g has pcos and both overrides", () => {
      expect(getExplanation("Ballaststoffe > 6g/100g", "pcos")!.text).not.toBe(
        getExplanation("Ballaststoffe > 6g/100g")!.text
      );
      expect(getExplanation("Ballaststoffe > 6g/100g", "both")!.text).not.toBe(
        getExplanation("Ballaststoffe > 6g/100g")!.text
      );
    });

    it("Glutenfrei-Label has hashimoto and both overrides", () => {
      expect(getExplanation("Glutenfrei-Label", "hashimoto")!.text).not.toBe(
        getExplanation("Glutenfrei-Label")!.text
      );
    });

    it("Zucker > 5g/100g has all three condition overrides", () => {
      const generic = getExplanation("Zucker > 5g/100g")!;
      expect(getExplanation("Zucker > 5g/100g", "pcos")!.text).not.toBe(generic.text);
      expect(getExplanation("Zucker > 5g/100g", "hashimoto")!.text).not.toBe(generic.text);
      expect(getExplanation("Zucker > 5g/100g", "both")!.text).not.toBe(generic.text);
    });
  });
});
