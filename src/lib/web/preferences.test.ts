// Integration tests for the website flow: form preferences -> engine -> result.
// They use the REAL sample catalog, the same way the page does.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CATALOG, RECIPES } from "../../data/index.ts";
import { mulberry32 } from "../random.ts";
import { conflictingTags } from "../recipes/ingredients.ts";
import { describeCost } from "../recommend/cost.ts";
import { recommend } from "../recommend/engine.ts";
import type { RelaxKey } from "../recommend/engine.ts";
import { pushRecentId } from "../recommend/recent.ts";
import {
  DEFAULT_PREFERENCES,
  countOptionalPreferences,
  relaxPreference,
  resetOptionalPreferences,
  toRecommendInput,
} from "./preferences.ts";
import type { Preferences } from "./preferences.ts";

const run = (prefs: Preferences, recent: string[] = [], seed = 1) =>
  recommend(toRecommendInput(prefs, recent), RECIPES, { catalog: CATALOG, random: mulberry32(seed) });

const strict: Preferences = {
  ...DEFAULT_PREFERENCES,
  mealPeriod: "breakfast",
  cravings: ["maasim"],
  categories: ["sabaw"],
  maxBudgetPHP: 50,
  ingredients: ["itlog"],
  ingredientMode: "use-only-what-i-have",
  excludedTags: ["pork", "egg"],
};

describe("website preferences", () => {
  it("generates a suggestion with default preferences", () => {
    const result = run(DEFAULT_PREFERENCES);
    assert.equal(result.status, "ok");
  });

  it("Try Another avoids the dish that was just shown", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const first = run(DEFAULT_PREFERENCES, [], seed);
      assert.equal(first.status, "ok");
      if (first.status !== "ok") return;
      const recent = pushRecentId([], first.suggestion.recipe.id);
      const second = run(DEFAULT_PREFERENCES, recent, seed + 1000);
      assert.equal(second.status, "ok");
      if (second.status !== "ok") return;
      assert.notEqual(second.suggestion.recipe.id, first.suggestion.recipe.id);
    }
  });

  it("never suggests a dish containing an excluded group", () => {
    const prefs: Preferences = { ...DEFAULT_PREFERENCES, excludedTags: ["pork", "shellfish", "egg"] };
    for (let seed = 1; seed <= 60; seed++) {
      const result = run(prefs, [], seed);
      if (result.status !== "ok") continue;
      assert.deepEqual(conflictingTags(result.suggestion.recipe, prefs.excludedTags, CATALOG), []);
    }
  });

  it("relaxing any optional preference keeps dietary exclusions", () => {
    const keys: (RelaxKey | "all-optional")[] = [
      "mealPeriod",
      "categories",
      "cravings",
      "budget",
      "ingredients",
      "all-optional",
    ];
    for (const key of keys) {
      assert.deepEqual(relaxPreference(strict, key).excludedTags, ["pork", "egg"]);
    }
    assert.deepEqual(resetOptionalPreferences(strict).excludedTags, ["pork", "egg"]);
    assert.equal(countOptionalPreferences(resetOptionalPreferences(strict)), 0);
  });

  it("explains a no-match and the user-chosen fix still honors exclusions", () => {
    const result = run(strict);
    assert.equal(result.status, "empty");
    if (result.status !== "empty") return;
    assert.ok(result.message.length > 0);

    let prefs = strict;
    for (const relaxation of result.relaxations) prefs = relaxPreference(prefs, relaxation.key);
    prefs = relaxPreference(prefs, "all-optional");
    const after = run(prefs);
    if (after.status === "ok") {
      assert.deepEqual(conflictingTags(after.suggestion.recipe, ["pork", "egg"], CATALOG), []);
    }
    assert.deepEqual(prefs.excludedTags, ["pork", "egg"]);
  });

  it("'use only what I have' returns only cookable dishes", () => {
    const prefs: Preferences = {
      ...DEFAULT_PREFERENCES,
      ingredients: ["itlog", "kamatis", "sibuyas"],
      ingredientMode: "use-only-what-i-have",
    };
    const result = run(prefs);
    if (result.status === "ok") assert.deepEqual(result.suggestion.missingIngredients, []);
  });

  it("shows 'Cost estimate unavailable' for every sample recipe", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const result = run(DEFAULT_PREFERENCES, [], seed);
      if (result.status !== "ok") continue;
      assert.equal(result.suggestion.recipe.publicationStatus, "sample");
      assert.equal(describeCost(result.suggestion.cost), "Cost estimate unavailable");
    }
  });
});
