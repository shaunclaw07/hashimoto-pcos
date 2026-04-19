import { describe, expect, it } from "vitest";
import { resolveIngredientAlias } from "./ingredient-aliases";

describe("resolveIngredientAlias", () => {
  it("maps German, English and French sugar aliases to sugar", () => {
    expect(resolveIngredientAlias("Zucker")?.canonicalKey).toBe("sugar");
    expect(resolveIngredientAlias("sugar")?.canonicalKey).toBe("sugar");
    expect(resolveIngredientAlias("sucre")?.canonicalKey).toBe("sugar");
  });

  it("maps multi-word glucose syrup aliases across languages", () => {
    expect(resolveIngredientAlias("Glukosesirup")?.canonicalKey).toBe("glucose-syrup");
    expect(resolveIngredientAlias("glucose syrup")?.canonicalKey).toBe("glucose-syrup");
    expect(resolveIngredientAlias("sirop de glucose")?.canonicalKey).toBe("glucose-syrup");
  });

  it("maps dairy aliases to milk", () => {
    expect(resolveIngredientAlias("Milch")?.canonicalKey).toBe("milk");
    expect(resolveIngredientAlias("milk")?.canonicalKey).toBe("milk");
    expect(resolveIngredientAlias("lait")?.canonicalKey).toBe("milk");
  });

  it("maps yogurt aliases", () => {
    expect(resolveIngredientAlias("Joghurt")?.canonicalKey).toBe("yogurt");
    expect(resolveIngredientAlias("yogurt")?.canonicalKey).toBe("yogurt");
    expect(resolveIngredientAlias("yaourt")?.canonicalKey).toBe("yogurt");
  });

  it("maps accented French wheat flour aliases", () => {
    expect(resolveIngredientAlias("farine de bl\u00e9")?.canonicalKey).toBe("wheat-flour");
    expect(resolveIngredientAlias("weizenmehl")?.canonicalKey).toBe("wheat-flour");
    expect(resolveIngredientAlias("wheat flour")?.canonicalKey).toBe("wheat-flour");
  });

  it("maps salmon aliases across languages", () => {
    expect(resolveIngredientAlias("Lachs")?.canonicalKey).toBe("salmon");
    expect(resolveIngredientAlias("salmon")?.canonicalKey).toBe("salmon");
    expect(resolveIngredientAlias("saumon")?.canonicalKey).toBe("salmon");
  });

  it("maps flaxseed aliases across languages", () => {
    expect(resolveIngredientAlias("Leinsamen")?.canonicalKey).toBe("flaxseed");
    expect(resolveIngredientAlias("flaxseed")?.canonicalKey).toBe("flaxseed");
    expect(resolveIngredientAlias("linseed")?.canonicalKey).toBe("flaxseed");
    expect(resolveIngredientAlias("graine de lin")?.canonicalKey).toBe("flaxseed");
  });

  it("returns null for unknown ingredients", () => {
    expect(resolveIngredientAlias("fantasiezutat")).toBeNull();
  });

  it("includes normalized input in match result", () => {
    const result = resolveIngredientAlias("sucre");
    expect(result?.normalizedInput).toBe("sucre");
    expect(result?.input).toBe("sucre");
  });
});