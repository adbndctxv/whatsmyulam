// Which visual choice cards to show, derived from the real recipe data so the
// page never offers an option that cannot affect the result.

import type { Category, RecipeTag } from "../recipes/types.ts";

type Classified = { categories: readonly Category[]; tags: readonly RecipeTag[] };

// Shown as "main ingredient" cards. The data groups chicken, pork and beef
// under "karne", so they are one card rather than three.
export const MAIN_INGREDIENT_CATEGORIES = ["karne", "isda", "itlog", "gulay"] as const satisfies readonly Category[];

export const MAIN_INGREDIENT_HINTS: Record<(typeof MAIN_INGREDIENT_CATEGORIES)[number], string> = {
  karne: "Chicken, pork, beef",
  isda: "Fish",
  itlog: "Egg",
  gulay: "Vegetables",
};

export function countMatches<T extends string>(
  recipes: readonly Classified[],
  values: readonly T[],
  field: "categories" | "tags",
): Map<T, number> {
  const counts = new Map<T, number>(values.map((v) => [v, 0]));
  for (const recipe of recipes) {
    for (const value of recipe[field] as readonly string[]) {
      if (counts.has(value as T)) counts.set(value as T, (counts.get(value as T) ?? 0) + 1);
    }
  }
  return counts;
}

export function availableValues<T extends string>(values: readonly T[], counts: Map<T, number>): T[] {
  return values.filter((v) => (counts.get(v) ?? 0) > 0);
}
