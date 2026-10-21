// Validation for recipe data.
//
// Recipe data comes from files today and from a database later. Either way we
// do not trust it blindly: every recipe is checked before the app uses it.
// A recipe that fails is skipped (and reported) instead of crashing the site.

import type { IngredientCatalog } from "./ingredients.ts";
import {
  CATEGORIES,
  MEAL_PERIODS,
  PUBLICATION_STATUSES,
  RECIPE_TAGS,
  UNITS,
} from "./types.ts";
import type { EstimatedCost, Recipe } from "./types.ts";

export type ValidationIssue = { path: string; message: string };

export type RecipeValidation =
  | { ok: true; recipe: Recipe }
  | { ok: false; issues: ValidationIssue[] };

export type InvalidRecipeReport = { index: number; id: string | null; issues: ValidationIssue[] };

export const MAX_BASE_SERVINGS = 50;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isWholeNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

function isDateString(value: unknown): value is string {
  return typeof value === "string" && DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

function isSafeUrl(value: unknown): value is string {
  return typeof value === "string" && /^https:\/\/\S+$/.test(value);
}

function checkList<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  issues: ValidationIssue[],
  options: { required: boolean },
): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: "must be a list" });
    return;
  }
  if (options.required && value.length === 0) {
    issues.push({ path, message: "must have at least one item" });
  }
  const seen = new Set<unknown>();
  value.forEach((item, i) => {
    if (typeof item !== "string" || !allowed.includes(item as T)) {
      issues.push({ path: `${path}[${i}]`, message: `"${String(item)}" is not an allowed value` });
    } else if (seen.has(item)) {
      issues.push({ path: `${path}[${i}]`, message: `"${item}" is listed twice` });
    }
    seen.add(item);
  });
}

function checkCost(value: unknown, issues: ValidationIssue[]): void {
  if (value === null) return; // "Cost estimate unavailable" is a valid, honest state
  if (!isRecord(value)) {
    issues.push({ path: "estimatedCost", message: "must be null or an object" });
    return;
  }
  const cost = value as Partial<Record<keyof EstimatedCost, unknown>>;
  if (typeof cost.amountPHP !== "number" || !Number.isFinite(cost.amountPHP) || cost.amountPHP <= 0) {
    issues.push({ path: "estimatedCost.amountPHP", message: "must be a number greater than 0" });
  }
  if (!isWholeNumber(cost.forServings, 1, MAX_BASE_SERVINGS)) {
    issues.push({ path: "estimatedCost.forServings", message: "must be a whole number of servings" });
  }
  if (!isNonEmptyString(cost.source)) {
    issues.push({ path: "estimatedCost.source", message: "a price needs a source" });
  }
  if (!isDateString(cost.checkedAt)) {
    issues.push({ path: "estimatedCost.checkedAt", message: "a price needs a YYYY-MM-DD date" });
  }
  if (cost.location !== undefined && !isNonEmptyString(cost.location)) {
    issues.push({ path: "estimatedCost.location", message: "must be text when provided" });
  }
}

function checkIngredients(value: unknown, catalog: IngredientCatalog, issues: ValidationIssue[]): void {
  if (!Array.isArray(value) || value.length === 0) {
    issues.push({ path: "ingredients", message: "must be a list with at least one ingredient" });
    return;
  }
  const seen = new Set<string>();
  value.forEach((raw, i) => {
    const path = `ingredients[${i}]`;
    if (!isRecord(raw)) {
      issues.push({ path, message: "must be an object" });
      return;
    }
    const id = raw.ingredientId;
    if (!isNonEmptyString(id)) {
      issues.push({ path: `${path}.ingredientId`, message: "is required" });
    } else {
      if (!catalog.has(id)) {
        issues.push({ path: `${path}.ingredientId`, message: `"${id}" is not in the ingredient catalog` });
      }
      if (seen.has(id)) {
        issues.push({ path: `${path}.ingredientId`, message: `"${id}" is listed twice` });
      }
      seen.add(id);
    }

    if (raw.toTaste === true) {
      if (raw.quantity !== null || raw.unit !== null) {
        issues.push({ path, message: "a 'to taste' ingredient must have quantity null and unit null" });
      }
    } else {
      // We never invent missing quantities, so a missing one is an error.
      if (typeof raw.quantity !== "number" || !Number.isFinite(raw.quantity) || raw.quantity <= 0) {
        issues.push({ path: `${path}.quantity`, message: "must be a number greater than 0 (or mark the ingredient toTaste)" });
      }
      if (typeof raw.unit !== "string" || !UNITS.includes(raw.unit as (typeof UNITS)[number])) {
        issues.push({ path: `${path}.unit`, message: `must be one of: ${UNITS.join(", ")}` });
      }
    }

    if (raw.optional !== undefined && typeof raw.optional !== "boolean") {
      issues.push({ path: `${path}.optional`, message: "must be true or false" });
    }
    if (raw.scaling !== undefined && raw.scaling !== "linear" && raw.scaling !== "taste") {
      issues.push({ path: `${path}.scaling`, message: "must be 'linear' or 'taste'" });
    }
    if (raw.note !== undefined && !isNonEmptyString(raw.note)) {
      issues.push({ path: `${path}.note`, message: "must be text when provided" });
    }
  });
}

export function validateRecipe(value: unknown, catalog: IngredientCatalog): RecipeValidation {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return { ok: false, issues: [{ path: "", message: "recipe must be an object" }] };
  }
  const r = value;

  if (!isNonEmptyString(r.id)) issues.push({ path: "id", message: "is required" });
  if (!isNonEmptyString(r.name)) issues.push({ path: "name", message: "is required" });
  if (!isNonEmptyString(r.slug) || !SLUG_PATTERN.test(r.slug)) {
    issues.push({ path: "slug", message: "must be lowercase words joined by hyphens, e.g. adobong-manok" });
  }
  if (!isNonEmptyString(r.description)) issues.push({ path: "description", message: "is required" });
  if (r.aliases !== undefined) {
    if (!Array.isArray(r.aliases) || !r.aliases.every(isNonEmptyString)) {
      issues.push({ path: "aliases", message: "must be a list of text" });
    }
  }

  if (!isWholeNumber(r.baseServings, 1, MAX_BASE_SERVINGS)) {
    issues.push({ path: "baseServings", message: `must be a whole number from 1 to ${MAX_BASE_SERVINGS}` });
  }
  if (!isWholeNumber(r.prepMinutes, 0, 1440)) {
    issues.push({ path: "prepMinutes", message: "must be a whole number of minutes (0 or more)" });
  }
  if (!isWholeNumber(r.cookMinutes, 0, 1440)) {
    issues.push({ path: "cookMinutes", message: "must be a whole number of minutes (0 or more)" });
  }
  if (r.restMinutes !== undefined && !isWholeNumber(r.restMinutes, 0, 4320)) {
    issues.push({ path: "restMinutes", message: "must be a whole number of minutes when provided" });
  }

  checkList(r.mealPeriods, MEAL_PERIODS, "mealPeriods", issues, { required: true });
  checkList(r.categories, CATEGORIES, "categories", issues, { required: true });
  checkList(r.tags, RECIPE_TAGS, "tags", issues, { required: false });
  checkIngredients(r.ingredients, catalog, issues);

  if (
    !Array.isArray(r.instructions) ||
    r.instructions.length === 0 ||
    !r.instructions.every(isNonEmptyString)
  ) {
    issues.push({ path: "instructions", message: "must be a list of at least one non-empty step" });
  }

  // Images: never accept an image without saying where it came from.
  if (r.imageUrl !== null) {
    const okUrl = typeof r.imageUrl === "string" && (r.imageUrl.startsWith("/") || isSafeUrl(r.imageUrl));
    if (!okUrl) issues.push({ path: "imageUrl", message: "must be null, a /local/path, or an https URL" });
    if (!isNonEmptyString(r.imageCredit)) {
      issues.push({ path: "imageCredit", message: "an image needs a credit / license note" });
    }
  }

  if (r.sourceUrl !== null && !isSafeUrl(r.sourceUrl)) {
    issues.push({ path: "sourceUrl", message: "must be null or an https URL" });
  }
  if (!isNonEmptyString(r.sourceAttribution)) {
    issues.push({ path: "sourceAttribution", message: "is required (say honestly where the recipe came from)" });
  }

  checkCost(r.estimatedCost, issues);

  if (typeof r.publicationStatus !== "string" || !PUBLICATION_STATUSES.includes(r.publicationStatus as never)) {
    issues.push({ path: "publicationStatus", message: `must be one of: ${PUBLICATION_STATUSES.join(", ")}` });
  } else if (r.publicationStatus === "published") {
    const review = r.review;
    if (!isRecord(review) || !isNonEmptyString(review.reviewedBy) || !isDateString(review.reviewedAt)) {
      issues.push({ path: "review", message: "a published recipe needs reviewedBy and a reviewedAt date" });
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, recipe: value as unknown as Recipe };
}

// Validates a whole list. Bad recipes are reported, good ones are returned.
// A recipe whose id or slug was already used earlier in the list is rejected.
export function validateRecipes(
  values: readonly unknown[],
  catalog: IngredientCatalog,
): { valid: Recipe[]; invalid: InvalidRecipeReport[] } {
  const valid: Recipe[] = [];
  const invalid: InvalidRecipeReport[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  values.forEach((value, index) => {
    const result = validateRecipe(value, catalog);
    const rawId = isRecord(value) && typeof value.id === "string" ? value.id : null;
    if (!result.ok) {
      invalid.push({ index, id: rawId, issues: result.issues });
      return;
    }
    const issues: ValidationIssue[] = [];
    if (ids.has(result.recipe.id)) issues.push({ path: "id", message: `"${result.recipe.id}" is already used by another recipe` });
    if (slugs.has(result.recipe.slug)) issues.push({ path: "slug", message: `"${result.recipe.slug}" is already used by another recipe` });
    if (issues.length > 0) {
      invalid.push({ index, id: rawId, issues });
      return;
    }
    ids.add(result.recipe.id);
    slugs.add(result.recipe.slug);
    valid.push(result.recipe);
  });

  return { valid, invalid };
}
