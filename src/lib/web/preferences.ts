// Website preferences: the bridge between the form on the page and the
// recommendation engine. Pure functions only, so they can be unit-tested
// with `node --test` (see preferences.test.ts).
//
// SAFETY RULE: nothing in this file ever removes a dietary exclusion on the
// user's behalf. Only the user can untick an exclusion.

import type { IngredientMode, RecommendInput, RelaxKey } from "../recommend/engine.ts";
import type { Category, ExclusionTag, MealPeriod, RecipeTag } from "../recipes/types.ts";

export type Preferences = {
  mealPeriod: MealPeriod | null;
  cravings: RecipeTag[];
  categories: Category[];
  householdSize: number | null;
  maxBudgetPHP: number | null;
  ingredients: string[]; // what the user typed, e.g. "itlog"
  ingredientMode: IngredientMode;
  assumePantryStaples: boolean;
  excludedTags: ExclusionTag[]; // HARD rule
};

export const DEFAULT_PREFERENCES: Preferences = {
  mealPeriod: null,
  cravings: [],
  categories: [],
  householdSize: null,
  maxBudgetPHP: null,
  ingredients: [],
  ingredientMode: "use-what-i-have",
  assumePantryStaples: true,
  excludedTags: [],
};

export function toRecommendInput(prefs: Preferences, recentRecipeIds: readonly string[]): RecommendInput {
  return {
    mealPeriod: prefs.mealPeriod,
    cravings: [...prefs.cravings],
    categories: [...prefs.categories],
    householdSize: prefs.householdSize,
    maxBudgetPHP: prefs.maxBudgetPHP,
    ingredients: [...prefs.ingredients],
    ingredientMode: prefs.ingredientMode,
    assumePantryStaples: prefs.assumePantryStaples,
    recentRecipeIds: [...recentRecipeIds],
    excludedTags: [...prefs.excludedTags],
  };
}

// Applies ONE optional change the engine suggested after a no-match result.
// Called only when the user clicks the suggestion. Exclusions are copied as-is.
export function relaxPreference(prefs: Preferences, key: RelaxKey | "all-optional"): Preferences {
  const next: Preferences = { ...prefs, excludedTags: [...prefs.excludedTags] };
  const relaxAll = key === "all-optional";
  if (relaxAll || key === "mealPeriod") next.mealPeriod = null;
  if (relaxAll || key === "categories") next.categories = [];
  if (relaxAll || key === "cravings") next.cravings = [];
  if (relaxAll || key === "budget") next.maxBudgetPHP = null;
  if (relaxAll || key === "ingredients") next.ingredientMode = "use-what-i-have";
  return next;
}

// Clears every optional preference but KEEPS dietary exclusions.
export function resetOptionalPreferences(prefs: Preferences): Preferences {
  return { ...DEFAULT_PREFERENCES, excludedTags: [...prefs.excludedTags] };
}

export function countOptionalPreferences(prefs: Preferences): number {
  let count = 0;
  if (prefs.mealPeriod) count++;
  if (prefs.cravings.length > 0) count++;
  if (prefs.categories.length > 0) count++;
  if (prefs.householdSize !== null) count++;
  if (prefs.maxBudgetPHP !== null) count++;
  if (prefs.ingredients.length > 0) count++;
  return count;
}

export function toggleItem<T>(list: readonly T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}
