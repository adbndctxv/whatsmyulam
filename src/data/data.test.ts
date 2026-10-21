// Data-integrity checks on the real catalog. If you add or edit a recipe and
// make a mistake, this file tells you exactly what is wrong.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCatalog, recipeExclusionTags, resolveIngredient } from "../lib/recipes/ingredients.ts";
import { MEAL_PERIODS, CATEGORIES } from "../lib/recipes/types.ts";
import { validateRecipes } from "../lib/recipes/validate.ts";
import { CATALOG, INGREDIENTS, RECIPES } from "./index.ts";

describe("ingredient catalog", () => {
  it("has no duplicate ids", () => {
    assert.equal(CATALOG.size, INGREDIENTS.length);
    assert.throws(() => buildCatalog([INGREDIENTS[0], INGREDIENTS[0]]), /Duplicate ingredient id/);
  });

  it("has no alias that points at two different ingredients", () => {
    const owner = new Map<string, string>();
    for (const def of INGREDIENTS) {
      for (const alias of [def.name, ...def.aliases]) {
        const key = alias.toLowerCase();
        const existing = owner.get(key);
        assert.ok(!existing || existing === def.id, `"${alias}" belongs to both ${existing} and ${def.id}`);
        owner.set(key, def.id);
      }
    }
  });

  it("resolves English, Filipino and id spellings", () => {
    assert.equal(resolveIngredient("toyo", CATALOG), "soy-sauce");
    assert.equal(resolveIngredient("Manok", CATALOG), "chicken");
    assert.equal(resolveIngredient("soy-sauce", CATALOG), "soy-sauce");
    assert.equal(resolveIngredient("sibuyas", CATALOG), "onion");
    assert.equal(resolveIngredient("paminta", CATALOG), "black-pepper");
  });

  it("returns null for ingredients it does not know (never guesses)", () => {
    assert.equal(resolveIngredient("dragonfruit", CATALOG), null);
    assert.equal(resolveIngredient("", CATALOG), null);
  });
});

describe("recipe catalog", () => {
  it("has 30 or more recipes, all valid", () => {
    const { valid, invalid } = validateRecipes(RECIPES, CATALOG);
    assert.deepEqual(invalid, []);
    assert.ok(valid.length >= 30);
  });

  it("covers every meal period and category", () => {
    for (const period of MEAL_PERIODS) assert.ok(RECIPES.some((r) => r.mealPeriods.includes(period)), period);
    for (const category of CATEGORIES) assert.ok(RECIPES.some((r) => r.categories.includes(category)), category);
  });

  it("is honest: no recipe is published, priced, pictured or cited without real backing", () => {
    for (const recipe of RECIPES) {
      assert.notEqual(recipe.publicationStatus, "published", `${recipe.id} claims review that never happened`);
      assert.equal(recipe.estimatedCost, null, `${recipe.id} has an unsourced price`);
      assert.equal(recipe.imageUrl, null, `${recipe.id} has an unlicensed image`);
      assert.equal(recipe.sourceUrl, null, `${recipe.id} has an invented source`);
      assert.match(recipe.sourceAttribution, /not yet editorially reviewed/i);
    }
  });

  it("has an ingredient list and steps for every recipe", () => {
    for (const recipe of RECIPES) {
      assert.ok(recipe.ingredients.length >= 3, `${recipe.id} has too few ingredients`);
      assert.ok(recipe.instructions.length >= 3, `${recipe.id} has too few steps`);
    }
  });

  it("lists the allergen groups that ingredients imply", () => {
    const recipe = RECIPES.find((r) => r.id === "pancit-canton")!;
    const tags = recipeExclusionTags(recipe, CATALOG);
    for (const expected of ["pork", "shellfish", "soy", "gluten", "egg"] as const) {
      assert.ok(tags.has(expected), `pancit-canton should contain ${expected}`);
    }
  });
});
