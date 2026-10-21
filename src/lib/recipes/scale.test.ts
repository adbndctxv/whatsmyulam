import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { makeRecipe } from "../testing/fixtures.ts";
import {
  MAX_SERVINGS,
  formatQuantity,
  parseServings,
  scaleIngredient,
  scaleQuantity,
  scaleRecipe,
} from "./scale.ts";

describe("scaleQuantity", () => {
  it("uses adjusted = original x requested / base", () => {
    assert.equal(scaleQuantity(500, 4, 8), 1000);
    assert.equal(scaleQuantity(500, 4, 2), 250);
    assert.equal(scaleQuantity(500, 4, 4), 500);
    assert.equal(scaleQuantity(300, 4, 6), 450);
  });

  it("scales seasonings more gently when going up, but not when going down", () => {
    assert.equal(scaleQuantity(4, 4, 8, "taste"), 7); // not 8
    assert.equal(scaleQuantity(4, 4, 2, "taste"), 2); // proportional
  });
});

describe("scaleIngredient", () => {
  it("returns the original amount at the base serving count", () => {
    const scaled = scaleIngredient({ ingredientId: "soy-sauce", quantity: 4, unit: "tbsp" }, 4, 4);
    assert.equal(scaled.quantity, 4);
    assert.equal(scaled.display, "4 tbsp");
    assert.equal(scaled.approximate, false);
  });

  it("marks scaled amounts as estimates", () => {
    const scaled = scaleIngredient({ ingredientId: "chicken", quantity: 1, unit: "kg" }, 4, 6);
    assert.equal(scaled.display, "1.5 kg");
    assert.equal(scaled.approximate, true);
  });

  it("never invents a quantity for 'to taste' ingredients", () => {
    const scaled = scaleIngredient({ ingredientId: "salt", quantity: null, unit: null, toTaste: true }, 4, 12);
    assert.equal(scaled.quantity, null);
    assert.equal(scaled.display, "to taste");
  });

  it("keeps optional flags and notes", () => {
    const scaled = scaleIngredient({ ingredientId: "egg", quantity: 2, unit: "pc", optional: true, note: "boiled" }, 4, 4);
    assert.equal(scaled.optional, true);
    assert.equal(scaled.note, "boiled");
  });

  it("rounds to amounts a person can measure", () => {
    assert.equal(formatQuantity(1.37, "cup"), "1 1/4 cup");
    assert.equal(formatQuantity(0.5, "tsp"), "1/2 tsp");
    assert.equal(formatQuantity(0.1, "tsp"), "1/4 tsp"); // never rounds down to zero
    assert.equal(formatQuantity(2.5, "pc"), "2 1/2 pc");
    assert.equal(formatQuantity(7, "clove"), "7 clove");
    assert.equal(formatQuantity(463, "g"), "460 g");
    assert.equal(formatQuantity(47, "g"), "45 g");
    assert.equal(formatQuantity(1.26, "l"), "1.25 l");
  });
});

describe("scaleRecipe", () => {
  const recipe = makeRecipe({
    id: "r",
    baseServings: 4,
    ingredients: [
      { ingredientId: "chicken", quantity: 1, unit: "kg" },
      { ingredientId: "garlic", quantity: 6, unit: "clove" },
      { ingredientId: "salt", quantity: null, unit: null, toTaste: true },
    ],
  });

  it("scales every ingredient", () => {
    const doubled = scaleRecipe(recipe, 8);
    assert.equal(doubled[0].display, "2 kg");
    assert.equal(doubled[1].display, "12 clove");
    assert.equal(doubled[2].display, "to taste");
  });

  it("does not change the original recipe", () => {
    scaleRecipe(recipe, 8);
    assert.equal(recipe.ingredients[0].quantity, 1);
  });

  it("throws on an invalid serving count", () => {
    for (const bad of [0, -2, 2.5, MAX_SERVINGS + 1, Number.NaN]) {
      assert.throws(() => scaleRecipe(recipe, bad), RangeError);
    }
  });
});

describe("parseServings", () => {
  it("accepts whole numbers and numeric strings in range", () => {
    assert.equal(parseServings(4), 4);
    assert.equal(parseServings("6"), 6);
    assert.equal(parseServings(MAX_SERVINGS), MAX_SERVINGS);
  });

  it("rejects everything else", () => {
    for (const bad of [0, -1, 2.5, "abc", "", "  ", null, undefined, MAX_SERVINGS + 1, Number.NaN]) {
      assert.equal(parseServings(bad), null);
    }
  });
});
