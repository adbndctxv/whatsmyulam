// Helpers for working with the ingredient catalog.

import { normalizeText } from "./text.ts";
import type { ExclusionTag, IngredientDef, Recipe } from "./types.ts";

export type IngredientCatalog = ReadonlyMap<string, IngredientDef>;

// Turns the list into a lookup table. Throws if two ingredients share an id,
// because that would silently hide one of them.
export function buildCatalog(list: readonly IngredientDef[]): IngredientCatalog {
  const map = new Map<string, IngredientDef>();
  for (const item of list) {
    if (map.has(item.id)) {
      throw new Error(`Duplicate ingredient id in catalog: "${item.id}"`);
    }
    map.set(item.id, item);
  }
  return map;
}

// Turns text a user typed ("toyo", "Manok", "soy-sauce") into an ingredient id.
// Returns null if we do not recognize it. We never guess.
export function resolveIngredient(text: string, catalog: IngredientCatalog): string | null {
  const wanted = normalizeText(text);
  if (!wanted) return null;
  for (const def of catalog.values()) {
    if (normalizeText(def.id) === wanted || normalizeText(def.name) === wanted) return def.id;
  }
  for (const def of catalog.values()) {
    if (def.aliases.some((alias) => normalizeText(alias) === wanted)) return def.id;
  }
  return null;
}

// Every exclusion group that appears in the recipe's ingredient list,
// INCLUDING optional ingredients (we are conservative on purpose).
export function recipeExclusionTags(recipe: Recipe, catalog: IngredientCatalog): Set<ExclusionTag> {
  const found = new Set<ExclusionTag>();
  for (const ing of recipe.ingredients) {
    const def = catalog.get(ing.ingredientId);
    if (!def) continue; // unknown ingredients are rejected by validation before we get here
    for (const tag of def.tags) found.add(tag);
  }
  return found;
}

// Which of the user's excluded groups does this recipe contain?
// An empty array means "nothing listed conflicts", NOT "guaranteed safe".
export function conflictingTags(
  recipe: Recipe,
  excluded: readonly ExclusionTag[],
  catalog: IngredientCatalog,
): ExclusionTag[] {
  if (excluded.length === 0) return [];
  const present = recipeExclusionTags(recipe, catalog);
  return excluded.filter((tag) => present.has(tag));
}
