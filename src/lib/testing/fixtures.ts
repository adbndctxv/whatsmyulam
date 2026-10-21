// Helpers shared by the tests. Not used by the app itself.

import { mulberry32 } from "../random.ts";
import type { RecommendInput, RecommendResult } from "../recommend/engine.ts";
import { recommend } from "../recommend/engine.ts";
import type { EstimatedCost, Recipe } from "../recipes/types.ts";
import { CATALOG } from "../../data/index.ts";

// A small valid recipe. Override only what a test cares about.
export function makeRecipe(overrides: Partial<Recipe> & { id: string }): Recipe {
  return {
    name: overrides.id,
    slug: overrides.id,
    description: "A test dish.",
    baseServings: 4,
    prepMinutes: 5,
    cookMinutes: 5,
    mealPeriods: ["lunch"],
    categories: ["karne"],
    tags: [],
    ingredients: [{ ingredientId: "egg", quantity: 2, unit: "pc" }],
    instructions: ["Cook it."],
    imageUrl: null,
    imageCredit: null,
    sourceUrl: null,
    sourceAttribution: "Test fixture",
    estimatedCost: null,
    publicationStatus: "sample",
    review: null,
    ...overrides,
  };
}

export function makeCost(amountPHP: number, forServings = 4): EstimatedCost {
  return { amountPHP, forServings, source: "test fixture", checkedAt: "2026-01-01" };
}

// Runs the engine many times with different (but repeatable) random seeds.
export function runMany(
  input: RecommendInput,
  recipes: readonly unknown[],
  times = 200,
  seedStart = 1,
): RecommendResult[] {
  const results: RecommendResult[] = [];
  for (let i = 0; i < times; i++) {
    results.push(recommend(input, recipes, { catalog: CATALOG, random: mulberry32(seedStart + i) }));
  }
  return results;
}

// Counts how often each recipe id was suggested.
export function countSuggested(results: readonly RecommendResult[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const r of results) {
    if (r.status === "ok") {
      counts.set(r.suggestion.recipe.id, (counts.get(r.suggestion.recipe.id) ?? 0) + 1);
    }
  }
  return counts;
}
