import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CATALOG } from "../../data/index.ts";
import { makeCost, makeRecipe } from "../testing/fixtures.ts";
import { validateRecipe, validateRecipes } from "./validate.ts";

function issuePaths(value: unknown): string[] {
  const result = validateRecipe(value, CATALOG);
  return result.ok ? [] : result.issues.map((i) => i.path);
}

describe("validateRecipe", () => {
  it("accepts a complete recipe", () => {
    assert.equal(validateRecipe(makeRecipe({ id: "ok" }), CATALOG).ok, true);
  });

  it("rejects things that are not recipe objects", () => {
    for (const bad of [null, undefined, 42, "adobo", [], true]) {
      assert.equal(validateRecipe(bad, CATALOG).ok, false);
    }
  });

  it("reports every missing required field", () => {
    const paths = issuePaths({});
    for (const field of ["id", "name", "slug", "description", "baseServings", "mealPeriods", "categories", "ingredients", "instructions", "sourceAttribution", "publicationStatus"]) {
      assert.ok(paths.includes(field), `expected a problem reported for ${field}`);
    }
  });

  it("rejects bad slugs, servings and times", () => {
    assert.ok(issuePaths(makeRecipe({ id: "a", slug: "Adobong Manok" })).includes("slug"));
    assert.ok(issuePaths(makeRecipe({ id: "a", baseServings: 0 })).includes("baseServings"));
    assert.ok(issuePaths(makeRecipe({ id: "a", baseServings: 2.5 })).includes("baseServings"));
    assert.ok(issuePaths(makeRecipe({ id: "a", prepMinutes: -1 })).includes("prepMinutes"));
    assert.ok(issuePaths(makeRecipe({ id: "a", cookMinutes: Number.NaN })).includes("cookMinutes"));
  });

  it("rejects unknown or repeated meal periods, categories and tags", () => {
    assert.ok(issuePaths({ ...makeRecipe({ id: "a" }), mealPeriods: ["brunch"] }).includes("mealPeriods[0]"));
    assert.ok(issuePaths({ ...makeRecipe({ id: "a" }), mealPeriods: ["lunch", "lunch"] }).includes("mealPeriods[1]"));
    assert.ok(issuePaths({ ...makeRecipe({ id: "a" }), categories: [] }).includes("categories"));
    assert.ok(issuePaths({ ...makeRecipe({ id: "a" }), tags: ["spicy"] }).includes("tags[0]"));
  });

  it("requires every ingredient to exist in the catalog", () => {
    const recipe = makeRecipe({ id: "a", ingredients: [{ ingredientId: "unobtanium", quantity: 1, unit: "g" }] });
    assert.ok(issuePaths(recipe).includes("ingredients[0].ingredientId"));
  });

  it("never accepts an invented or missing quantity", () => {
    const missing = { ...makeRecipe({ id: "a" }), ingredients: [{ ingredientId: "egg", quantity: null, unit: null }] };
    assert.ok(issuePaths(missing).includes("ingredients[0].quantity"));
    const zero = makeRecipe({ id: "a", ingredients: [{ ingredientId: "egg", quantity: 0, unit: "pc" }] });
    assert.ok(issuePaths(zero).includes("ingredients[0].quantity"));
    const badUnit = { ...makeRecipe({ id: "a" }), ingredients: [{ ingredientId: "egg", quantity: 1, unit: "handful" }] };
    assert.ok(issuePaths(badUnit).includes("ingredients[0].unit"));
  });

  it("allows 'to taste' only with no quantity and no unit", () => {
    const good = makeRecipe({ id: "a", ingredients: [{ ingredientId: "salt", quantity: null, unit: null, toTaste: true }] });
    assert.equal(validateRecipe(good, CATALOG).ok, true);
    const bad = makeRecipe({ id: "a", ingredients: [{ ingredientId: "salt", quantity: 1, unit: "tsp", toTaste: true }] });
    assert.equal(validateRecipe(bad, CATALOG).ok, false);
  });

  it("rejects the same ingredient listed twice", () => {
    const recipe = makeRecipe({
      id: "a",
      ingredients: [
        { ingredientId: "egg", quantity: 1, unit: "pc" },
        { ingredientId: "egg", quantity: 2, unit: "pc" },
      ],
    });
    assert.ok(issuePaths(recipe).includes("ingredients[1].ingredientId"));
  });

  it("requires non-empty instructions", () => {
    assert.ok(issuePaths(makeRecipe({ id: "a", instructions: [] })).includes("instructions"));
    assert.ok(issuePaths(makeRecipe({ id: "a", instructions: ["  "] })).includes("instructions"));
  });

  it("requires a credit for any image and rejects unsafe image URLs", () => {
    assert.ok(issuePaths(makeRecipe({ id: "a", imageUrl: "/images/a.jpg" })).includes("imageCredit"));
    assert.equal(validateRecipe(makeRecipe({ id: "a", imageUrl: "/images/a.jpg", imageCredit: "Photo by Juan, CC BY 4.0" }), CATALOG).ok, true);
    assert.ok(issuePaths(makeRecipe({ id: "a", imageUrl: "javascript:alert(1)", imageCredit: "x" })).includes("imageUrl"));
    assert.ok(issuePaths(makeRecipe({ id: "a", imageUrl: "http://example.com/a.jpg", imageCredit: "x" })).includes("imageUrl"));
  });

  it("requires a price to carry its source and date", () => {
    assert.equal(validateRecipe(makeRecipe({ id: "a", estimatedCost: makeCost(300) }), CATALOG).ok, true);
    const noSource = { ...makeRecipe({ id: "a" }), estimatedCost: { amountPHP: 300, forServings: 4, checkedAt: "2026-01-01" } };
    assert.ok(issuePaths(noSource).includes("estimatedCost.source"));
    const badDate = { ...makeRecipe({ id: "a" }), estimatedCost: { ...makeCost(300), checkedAt: "last week" } };
    assert.ok(issuePaths(badDate).includes("estimatedCost.checkedAt"));
    const free = { ...makeRecipe({ id: "a" }), estimatedCost: { ...makeCost(300), amountPHP: 0 } };
    assert.ok(issuePaths(free).includes("estimatedCost.amountPHP"));
  });

  it("accepts a missing cost (it means 'Cost estimate unavailable')", () => {
    assert.equal(validateRecipe(makeRecipe({ id: "a", estimatedCost: null }), CATALOG).ok, true);
  });

  it("requires a named review before a recipe can be published", () => {
    assert.ok(issuePaths(makeRecipe({ id: "a", publicationStatus: "published" })).includes("review"));
    const reviewed = makeRecipe({
      id: "a",
      publicationStatus: "published",
      review: { reviewedBy: "Alvin", reviewedAt: "2026-10-20" },
    });
    assert.equal(validateRecipe(reviewed, CATALOG).ok, true);
  });
});

describe("validateRecipes", () => {
  it("separates valid from invalid and keeps going", () => {
    const { valid, invalid } = validateRecipes(
      [makeRecipe({ id: "a" }), { nonsense: true }, makeRecipe({ id: "b" })],
      CATALOG,
    );
    assert.deepEqual(valid.map((r) => r.id), ["a", "b"]);
    assert.equal(invalid.length, 1);
    assert.equal(invalid[0].index, 1);
  });

  it("rejects a later recipe that reuses an id or slug", () => {
    const { valid, invalid } = validateRecipes(
      [makeRecipe({ id: "a", slug: "one" }), makeRecipe({ id: "a", slug: "two" }), makeRecipe({ id: "c", slug: "one" })],
      CATALOG,
    );
    assert.deepEqual(valid.map((r) => r.id), ["a"]);
    assert.equal(invalid.length, 2);
  });
});
