import assert from "node:assert/strict";
import { test } from "node:test";

import { RECIPES } from "../../data/index.ts";
import { CATEGORIES, RECIPE_TAGS } from "../recipes/types.ts";
import { MAIN_INGREDIENT_CATEGORIES, availableValues, countMatches } from "./choices.ts";

test("countMatches counts each recipe once per matching value", () => {
  const recipes = [
    { categories: ["karne", "itlog"] as const, tags: ["maalat"] as const },
    { categories: ["itlog"] as const, tags: [] as const },
  ];
  const counts = countMatches(recipes, ["karne", "itlog", "isda"], "categories");
  assert.equal(counts.get("karne"), 1);
  assert.equal(counts.get("itlog"), 2);
  assert.equal(counts.get("isda"), 0);
});

test("availableValues hides options with no recipes and keeps order", () => {
  const counts = new Map([
    ["a", 2],
    ["b", 0],
    ["c", 1],
  ]);
  assert.deepEqual(availableValues(["a", "b", "c"], counts), ["a", "c"]);
});

test("every shown craving and main-ingredient card matches at least one real recipe", () => {
  const tagCounts = countMatches(RECIPES, RECIPE_TAGS, "tags");
  for (const tag of availableValues(RECIPE_TAGS, tagCounts)) {
    assert.ok(RECIPES.some((r) => r.tags.includes(tag)), tag);
  }
  const catCounts = countMatches(RECIPES, CATEGORIES, "categories");
  for (const cat of MAIN_INGREDIENT_CATEGORIES) {
    assert.ok((catCounts.get(cat) ?? 0) > 0, `${cat} should have recipes`);
  }
});
