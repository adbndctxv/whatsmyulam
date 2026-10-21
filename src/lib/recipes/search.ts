// Searching and browsing recipes without using the random generator.

import { conflictingTags } from "./ingredients.ts";
import type { IngredientCatalog } from "./ingredients.ts";
import { normalizeText, textMatches } from "./text.ts";
import { CATEGORY_LABELS } from "./types.ts";
import type { Category, ExclusionTag, MealPeriod, Recipe } from "./types.ts";

export type BrowseFilters = {
  query?: string; // free text, e.g. "adobo", "manok sabaw"
  category?: Category;
  mealPeriod?: MealPeriod;
  excludedTags?: readonly ExclusionTag[];
};

// Every word typed must match somewhere in the recipe (name, aliases, tags,
// category names, or ingredient names). Name matches rank highest.
function relevance(recipe: Recipe, tokens: readonly string[], catalog: IngredientCatalog): number {
  const names = [recipe.name];
  const aliases = recipe.aliases ?? [];
  const labels = recipe.categories.flatMap((c) => [CATEGORY_LABELS[c].en, CATEGORY_LABELS[c].fil]);
  const ingredientNames = recipe.ingredients.flatMap((i) => {
    const def = catalog.get(i.ingredientId);
    return def ? [def.name, ...def.aliases] : [];
  });

  let score = 0;
  for (const token of tokens) {
    if (textMatches(names, token)) score += 3;
    else if (textMatches(aliases, token)) score += 2;
    else if (textMatches([...recipe.tags, ...labels], token)) score += 1;
    else if (textMatches(ingredientNames, token)) score += 0.5;
    else return 0; // a word that matches nothing rules the recipe out
  }
  return score;
}

export function searchRecipes(
  recipes: readonly Recipe[],
  filters: BrowseFilters,
  catalog: IngredientCatalog,
): Recipe[] {
  const tokens = normalizeText(filters.query ?? "").split(" ").filter((t) => t.length > 0);
  const excluded = filters.excludedTags ?? [];

  const scored: { recipe: Recipe; score: number }[] = [];
  for (const recipe of recipes) {
    if (filters.category && !recipe.categories.includes(filters.category)) continue;
    if (filters.mealPeriod && !recipe.mealPeriods.includes(filters.mealPeriod)) continue;
    if (conflictingTags(recipe, excluded, catalog).length > 0) continue;
    if (tokens.length === 0) {
      scored.push({ recipe, score: 0 });
      continue;
    }
    const score = relevance(recipe, tokens, catalog);
    if (score > 0) scored.push({ recipe, score });
  }

  scored.sort((a, b) => b.score - a.score || a.recipe.name.localeCompare(b.recipe.name));
  return scored.map((entry) => entry.recipe);
}

// Simple "load more" / paging helper.
export function paginate<T>(items: readonly T[], page: number, pageSize: number) {
  const size = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (current - 1) * size;
  return { items: items.slice(start, start + size), page: current, totalPages, totalItems: items.length };
}
