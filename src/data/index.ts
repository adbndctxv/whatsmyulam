// One place to get the catalog and the recipes, ready to use.

import { buildCatalog } from "../lib/recipes/ingredients.ts";
import { INGREDIENTS } from "./ingredients.ts";
import { RECIPES } from "./recipes.ts";

export const CATALOG = buildCatalog(INGREDIENTS);
export { INGREDIENTS, RECIPES };
