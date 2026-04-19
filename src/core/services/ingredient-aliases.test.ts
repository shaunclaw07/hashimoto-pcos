import { describe, expect, it } from "vitest";
import { resolveIngredientAlias } from "./ingredient-aliases";

describe("resolveIngredientAlias", () => {
  it("maps German, English and French sugar aliases to sugar", () => {
    expect(resolveIngredientAlias("Zucker")?.canonicalKey).toBe("sugar");
    expect(resolveIngredientAlias("sugar")?.canonicalKey).toBe("sugar");
    expect(resolveIngredientAlias("sucre")?.canonicalKey).toBe("sugar");
  });

  it("maps dairy aliases to milk", () => {
    expect(resolveIngredientAlias("Milch")?.canonicalKey).toBe("milk");
    expect(resolveIngredientAlias("milk")?.canonicalKey).toBe("milk");
    expect(resolveIngredientAlias("lait")?.canonicalKey).toBe("milk");
  });

  it("maps accented French wheat flour aliases", () => {
    expect(resolveIngredientAlias("farine de bl\u00e9")?.canonicalKey).toBe("wheat-flour");
    expect(resolveIngredientAlias("weizenmehl")?.canonicalKey).toBe("wheat-flour");
    expect(resolveIngredientAlias("wheat flour")?.canonicalKey).toBe("wheat-flour");
  });

  it("returns null for unknown ingredients", () => {
    expect(resolveIngredientAlias("fantasiezutat")).toBeNull();
  });
});