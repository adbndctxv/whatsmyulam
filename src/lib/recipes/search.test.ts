import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CATALOG, RECIPES } from "../../data/index.ts";
import { paginate, searchRecipes } from "./search.ts";

const ids = (list: readonly { id: string }[]) => list.map((r) => r.id);

describe("searchRecipes", () => {
  it("returns everything, sorted by name, with no filters", () => {
    const all = searchRecipes(RECIPES, {}, CATALOG);
    assert.equal(all.length, RECIPES.length);
    const names = all.map((r) => r.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));
  });

  it("finds dishes by name, alias and ingredient", () => {
    assert.deepEqual(ids(searchRecipes(RECIPES, { query: "adobo" }, CATALOG)).sort(), ["adobong-baboy", "adobong-manok"]);
    assert.ok(ids(searchRecipes(RECIPES, { query: "bagoong" }, CATALOG)).includes("pinakbet"));
    assert.ok(ids(searchRecipes(RECIPES, { query: "tinola" }, CATALOG)).includes("tinolang-manok"));
  });

  it("ranks name matches above ingredient matches", () => {
    const results = ids(searchRecipes(RECIPES, { query: "manok" }, CATALOG));
    assert.equal(results[0], "adobong-manok"); // "manok" is in the name; many others only list chicken
    assert.ok(results.length > 3);
  });

  it("ignores case, punctuation and accents", () => {
    assert.deepEqual(ids(searchRecipes(RECIPES, { query: "  SINIGÁNG!! " }, CATALOG)).sort(), ["sinigang-na-baboy", "sinigang-na-isda"]);
  });

  it("requires every word to match", () => {
    assert.deepEqual(ids(searchRecipes(RECIPES, { query: "sinigang isda" }, CATALOG)), ["sinigang-na-isda"]);
    assert.deepEqual(searchRecipes(RECIPES, { query: "adobo pancit" }, CATALOG), []);
  });

  it("returns an empty list (not an error) when nothing matches", () => {
    assert.deepEqual(searchRecipes(RECIPES, { query: "pizza" }, CATALOG), []);
  });

  it("filters by category and meal period", () => {
    for (const r of searchRecipes(RECIPES, { category: "pansit" }, CATALOG)) assert.ok(r.categories.includes("pansit"));
    for (const r of searchRecipes(RECIPES, { mealPeriod: "midnight-snack" }, CATALOG)) assert.ok(r.mealPeriods.includes("midnight-snack"));
  });

  it("applies dietary exclusions", () => {
    for (const r of searchRecipes(RECIPES, { excludedTags: ["pork"] }, CATALOG)) {
      assert.ok(!r.ingredients.some((i) => CATALOG.get(i.ingredientId)?.tags.includes("pork")));
    }
    assert.deepEqual(searchRecipes(RECIPES, { query: "adobong baboy", excludedTags: ["pork"] }, CATALOG), []);
  });

  it("does not match the middle of words", () => {
    // "nigang" sits inside "sinigang" but starts no word, so it must not match.
    assert.deepEqual(searchRecipes(RECIPES, { query: "nigang" }, CATALOG), []);
    // ...while the start of a word does match.
    assert.ok(searchRecipes(RECIPES, { query: "sinig" }, CATALOG).length >= 2);
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("returns the requested page", () => {
    const page = paginate(items, 2, 10);
    assert.deepEqual(page.items, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    assert.equal(page.totalPages, 3);
    assert.equal(page.totalItems, 25);
  });

  it("keeps the page number in range", () => {
    assert.equal(paginate(items, 99, 10).page, 3);
    assert.equal(paginate(items, 0, 10).page, 1);
    assert.equal(paginate(items, Number.NaN, 10).page, 1);
  });

  it("handles an empty list", () => {
    const page = paginate([], 1, 10);
    assert.deepEqual(page.items, []);
    assert.equal(page.totalPages, 1);
  });
});
