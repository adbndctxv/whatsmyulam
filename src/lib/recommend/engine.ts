// The recommendation engine: picks an ulam for the user.
//
// It is plain TypeScript with no React, no network and no database, so it can
// be tested on its own (see engine.test.ts).
//
// How it works, in order:
//   1. Validate the recipes and the user's input (bad data is skipped/reported).
//   2. HARD rules remove recipes. Dietary exclusions are the strictest: they
//      are never relaxed, not even when nothing matches.
//   3. Preferences (meal period, categories, cravings, budget, "use only what
//      I have") also filter, but if they leave nothing we explain which ones
//      the user could relax. We never quietly ignore them.
//   4. Remaining recipes get a score (cravings, ingredients on hand, recent
//      repeats and unknown costs lower or raise it).
//   5. We pick randomly, weighted by score, so results stay varied.

import { conflictingTags, resolveIngredient } from "../recipes/ingredients.ts";
import type { IngredientCatalog } from "../recipes/ingredients.ts";
import { parseServings } from "../recipes/scale.ts";
import { normalizeText, textMatches } from "../recipes/text.ts";
import { CATEGORIES, CATEGORY_LABELS, EXCLUSION_TAGS, MEAL_PERIODS } from "../recipes/types.ts";
import type {
  Category,
  ExclusionTag,
  MealPeriod,
  PublicationStatus,
  Recipe,
} from "../recipes/types.ts";
import { validateRecipes } from "../recipes/validate.ts";
import { estimateCost } from "./cost.ts";
import type { CostEstimate } from "./cost.ts";

export type IngredientMode = "use-what-i-have" | "use-only-what-i-have";

export type RecommendInput = {
  mealPeriod?: MealPeriod | null;
  cravings?: string[]; // e.g. ["maasim", "sabaw"]
  categories?: Category[];
  householdSize?: number | null;
  maxBudgetPHP?: number | null;
  ingredients?: string[]; // ingredient ids or names, e.g. "toyo"
  ingredientMode?: IngredientMode; // default: "use-what-i-have"
  assumePantryStaples?: boolean; // default: true
  recentRecipeIds?: string[]; // newest first
  excludedTags?: ExclusionTag[];
};

export type RecommendOptions = {
  catalog: IngredientCatalog;
  random?: () => number; // defaults to Math.random; tests pass a seeded one
  allowedStatuses?: readonly PublicationStatus[]; // default: published + sample
};

export type RelaxKey = "mealPeriod" | "categories" | "cravings" | "budget" | "ingredients";

export type Relaxation = {
  key: RelaxKey | "all-optional";
  matches: number; // how many dishes would qualify if this were relaxed
  message: string;
};

export type Suggestion = {
  recipe: Recipe;
  score: number;
  servings: number; // household size, or the recipe's base servings
  matchedCravings: string[];
  missingIngredients: string[]; // essential ingredient ids the user did not list
  cost: CostEstimate;
  budgetStatus: "not-requested" | "within-budget" | "over-budget" | "unknown-cost";
};

export type RecommendResult =
  | {
      status: "ok";
      suggestion: Suggestion;
      otherMatches: number; // how many other dishes also qualified
      notes: string[];
      unknownIngredients: string[];
      skippedInvalidRecipes: number;
    }
  | {
      status: "empty";
      reason: "no-recipes-available" | "no-match";
      message: string;
      relaxations: Relaxation[];
      notes: string[];
      unknownIngredients: string[];
      skippedInvalidRecipes: number;
    }
  | { status: "invalid-input"; issues: string[] };

type NormalizedInput = {
  mealPeriod: MealPeriod | null;
  cravings: string[];
  categories: Category[];
  householdSize: number | null;
  maxBudgetPHP: number | null;
  ingredientIds: Set<string>;
  unknownIngredients: string[];
  ingredientMode: IngredientMode;
  assumePantryStaples: boolean;
  recentRecipeIds: string[];
  excludedTags: ExclusionTag[];
};

type Candidate = Suggestion;

// ---------------------------------------------------------------------------
// Step 1: check and clean the user's input
// ---------------------------------------------------------------------------

export function normalizeInput(
  input: RecommendInput,
  catalog: IngredientCatalog,
): { ok: true; value: NormalizedInput } | { ok: false; issues: string[] } {
  const issues: string[] = [];

  const mealPeriod = input.mealPeriod ?? null;
  if (mealPeriod !== null && !MEAL_PERIODS.includes(mealPeriod)) {
    issues.push(`Unknown meal period: "${String(mealPeriod)}".`);
  }

  const categories = input.categories ?? [];
  for (const c of categories) {
    if (!CATEGORIES.includes(c)) issues.push(`Unknown category: "${String(c)}".`);
  }

  const excludedTags = input.excludedTags ?? [];
  for (const t of excludedTags) {
    if (!EXCLUSION_TAGS.includes(t)) issues.push(`Unknown dietary exclusion: "${String(t)}".`);
  }

  let householdSize: number | null = null;
  if (input.householdSize !== undefined && input.householdSize !== null) {
    householdSize = parseServings(input.householdSize);
    if (householdSize === null) issues.push("Household size must be a whole number from 1 to 50.");
  }

  let maxBudgetPHP: number | null = null;
  if (input.maxBudgetPHP !== undefined && input.maxBudgetPHP !== null) {
    if (typeof input.maxBudgetPHP === "number" && Number.isFinite(input.maxBudgetPHP) && input.maxBudgetPHP > 0) {
      maxBudgetPHP = input.maxBudgetPHP;
    } else {
      issues.push("Budget must be a number greater than 0.");
    }
  }

  const ingredientMode = input.ingredientMode ?? "use-what-i-have";
  if (ingredientMode !== "use-what-i-have" && ingredientMode !== "use-only-what-i-have") {
    issues.push(`Unknown ingredient mode: "${String(ingredientMode)}".`);
  }

  const ingredientIds = new Set<string>();
  const unknownIngredients: string[] = [];
  for (const text of input.ingredients ?? []) {
    const id = resolveIngredient(text, catalog);
    if (id) ingredientIds.add(id);
    else if (text.trim()) unknownIngredients.push(text.trim());
  }
  if (ingredientMode === "use-only-what-i-have" && ingredientIds.size === 0) {
    issues.push("To use only what you have, list at least one ingredient we recognize.");
  }

  const cravings = (input.cravings ?? []).map((c) => normalizeText(c)).filter((c) => c.length >= 2);

  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    value: {
      mealPeriod,
      cravings,
      categories: [...categories],
      householdSize,
      maxBudgetPHP,
      ingredientIds,
      unknownIngredients,
      ingredientMode,
      assumePantryStaples: input.assumePantryStaples ?? true,
      recentRecipeIds: [...(input.recentRecipeIds ?? [])],
      excludedTags: [...new Set(excludedTags)],
    },
  };
}

// ---------------------------------------------------------------------------
// Step 2-4: filter and score
// ---------------------------------------------------------------------------

function matchesCraving(recipe: Recipe, craving: string, catalog: IngredientCatalog): boolean {
  const labels = recipe.categories.flatMap((c) => [CATEGORY_LABELS[c].en, CATEGORY_LABELS[c].fil]);
  const ingredientNames = recipe.ingredients.flatMap((i) => {
    const def = catalog.get(i.ingredientId);
    return def ? [def.name, ...def.aliases] : [];
  });
  return textMatches(
    [recipe.name, ...(recipe.aliases ?? []), ...recipe.tags, ...labels, ...ingredientNames],
    craving,
  );
}

function evaluate(
  pool: readonly Recipe[],
  input: NormalizedInput,
  catalog: IngredientCatalog,
  relaxed: ReadonlySet<RelaxKey>,
): Candidate[] {
  const candidates: Candidate[] = [];

  for (const recipe of pool) {
    // HARD: dietary exclusions are never relaxed.
    if (conflictingTags(recipe, input.excludedTags, catalog).length > 0) continue;

    if (!relaxed.has("mealPeriod") && input.mealPeriod && !recipe.mealPeriods.includes(input.mealPeriod)) {
      continue;
    }
    if (
      !relaxed.has("categories") &&
      input.categories.length > 0 &&
      !input.categories.some((c) => recipe.categories.includes(c))
    ) {
      continue;
    }

    const matchedCravings = input.cravings.filter((c) => matchesCraving(recipe, c, catalog));
    if (!relaxed.has("cravings") && input.cravings.length > 0 && matchedCravings.length === 0) continue;

    const servings = input.householdSize ?? recipe.baseServings;
    const cost = estimateCost(recipe, servings);
    let budgetStatus: Suggestion["budgetStatus"] = "not-requested";
    if (input.maxBudgetPHP !== null) {
      if (cost.status === "known") {
        // Known cost over budget is a real violation. Unknown cost cannot be
        // checked, so it stays in (flagged and ranked lower), never guessed.
        if (cost.totalPHP > input.maxBudgetPHP) {
          if (!relaxed.has("budget")) continue;
          budgetStatus = "over-budget";
        } else {
          budgetStatus = "within-budget";
        }
      } else {
        budgetStatus = "unknown-cost";
      }
    }

    // Essential = not optional, and not an explicitly identified pantry staple
    // (when the user says they have staples). A missing essential is never
    // treated as optional.
    const essentials = recipe.ingredients.filter((ing) => {
      if (ing.optional) return false;
      const def = catalog.get(ing.ingredientId);
      return !(input.assumePantryStaples && def?.pantryStaple);
    });
    const missing = essentials.filter((ing) => !input.ingredientIds.has(ing.ingredientId)).map((ing) => ing.ingredientId);
    if (!relaxed.has("ingredients") && input.ingredientMode === "use-only-what-i-have" && missing.length > 0) {
      continue;
    }

    let score = 1;
    score += 0.5 * matchedCravings.length;
    if (input.ingredientIds.size > 0 && essentials.length > 0) {
      score += 2 * ((essentials.length - missing.length) / essentials.length);
    }
    if (budgetStatus === "unknown-cost") score -= 0.5;
    const recentIndex = input.recentRecipeIds.indexOf(recipe.id);
    if (recentIndex >= 0) score -= 2 * Math.pow(0.7, recentIndex); // more recent = bigger penalty

    candidates.push({
      recipe,
      score: Math.max(score, 0.05),
      servings,
      matchedCravings,
      missingIngredients: missing,
      cost,
      budgetStatus,
    });
  }
  return candidates;
}

function pickWeighted(candidates: readonly Candidate[], random: () => number): Candidate {
  const weights = candidates.map((c) => c.score * c.score);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = random();
  if (!(r >= 0 && r < 1)) r = 0; // protect against a broken random function
  let target = r * total;
  for (let i = 0; i < candidates.length; i++) {
    target -= weights[i];
    if (target < 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

function activeRelaxKeys(input: NormalizedInput): RelaxKey[] {
  const keys: RelaxKey[] = [];
  if (input.mealPeriod) keys.push("mealPeriod");
  if (input.categories.length > 0) keys.push("categories");
  if (input.cravings.length > 0) keys.push("cravings");
  if (input.maxBudgetPHP !== null) keys.push("budget");
  if (input.ingredientMode === "use-only-what-i-have") keys.push("ingredients");
  return keys;
}

const RELAX_MESSAGES: Record<RelaxKey, string> = {
  mealPeriod: "Try a different meal period, or any meal.",
  categories: "Remove the dish-type filter.",
  cravings: "Skip the craving words.",
  budget: "Raise or remove the budget.",
  ingredients: "Allow dishes that need ingredients you did not list.",
};

// ---------------------------------------------------------------------------
// The public function
// ---------------------------------------------------------------------------

export function recommend(
  rawInput: RecommendInput,
  rawRecipes: readonly unknown[],
  options: RecommendOptions,
): RecommendResult {
  const { catalog } = options;
  const random = options.random ?? Math.random;
  const allowed = options.allowedStatuses ?? (["published", "sample"] as const);

  const normalized = normalizeInput(rawInput, catalog);
  if (!normalized.ok) return { status: "invalid-input", issues: normalized.issues };
  const input = normalized.value;

  // Recipes that fail validation are skipped, never shown, and counted.
  const { valid, invalid } = validateRecipes(rawRecipes, catalog);
  const pool = valid.filter((r) => allowed.includes(r.publicationStatus));

  const notes: string[] = [];
  if (input.excludedTags.length > 0) {
    notes.push(
      "Dietary exclusions only consider the ingredients listed in each recipe. " +
        "We cannot verify product labels or cross-contamination, so please check labels if you have an allergy.",
    );
  }
  if (input.unknownIngredients.length > 0) {
    notes.push(`We did not recognize: ${input.unknownIngredients.join(", ")}.`);
  }

  const shared = {
    notes,
    unknownIngredients: input.unknownIngredients,
    skippedInvalidRecipes: invalid.length,
  };

  let candidates = evaluate(pool, input, catalog, new Set());

  if (candidates.length === 0) {
    if (pool.length === 0) {
      return {
        status: "empty",
        reason: "no-recipes-available",
        message: "There are no recipes available right now.",
        relaxations: [],
        ...shared,
      };
    }

    // Work out which optional preferences, if relaxed, would produce results.
    // Dietary exclusions are NOT in this list: they always stay on.
    const keys = activeRelaxKeys(input);
    const relaxations: Relaxation[] = [];
    for (const key of keys) {
      const matches = evaluate(pool, input, catalog, new Set([key])).length;
      if (matches > 0) relaxations.push({ key, matches, message: `${RELAX_MESSAGES[key]} (${matches} dish${matches === 1 ? "" : "es"} would match)` });
    }
    if (relaxations.length === 0 && keys.length > 1) {
      const matches = evaluate(pool, input, catalog, new Set(keys)).length;
      if (matches > 0) {
        relaxations.push({
          key: "all-optional",
          matches,
          message: `Relax several preferences together (${matches} dish${matches === 1 ? "" : "es"} would match).`,
        });
      }
    }

    let message = "No dish matches all your choices.";
    if (relaxations.length > 0) {
      message += " Try relaxing an optional preference.";
    } else if (input.excludedTags.length > 0) {
      message += " Your dietary exclusions rule out every available dish, and we keep those on to be safe.";
    }
    if (input.excludedTags.length > 0 && relaxations.length > 0) {
      message += " Dietary exclusions stay on.";
    }
    return { status: "empty", reason: "no-match", message, relaxations, ...shared };
  }

  // Avoid showing the same dish twice in a row when there are alternatives.
  const last = input.recentRecipeIds[0];
  if (last !== undefined && candidates.length > 1) {
    candidates = candidates.filter((c) => c.recipe.id !== last);
  }

  const chosen = pickWeighted(candidates, random);

  if (chosen.budgetStatus === "unknown-cost" && input.maxBudgetPHP !== null) {
    notes.push("Cost estimate unavailable for this dish, so we could not check it against your budget.");
  }

  return {
    status: "ok",
    suggestion: chosen,
    otherMatches: candidates.length - 1,
    ...shared,
  };
}
