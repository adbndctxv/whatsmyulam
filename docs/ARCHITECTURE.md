# Architecture

## Principle

All decision-making logic is plain TypeScript with **no React, no network and no database**. The website will be a thin layer on top. That makes the logic testable alone, and lets the data move to Supabase later without rewriting the engine.

## Modules

```
src/lib/recipes/
  types.ts        Shapes and constants (meal periods, categories, exclusions, units)
  validate.ts     Checks recipe data; returns readable problems instead of crashing
  ingredients.ts  Ingredient catalog lookup, name matching ("toyo" -> soy-sauce), exclusion check
  scale.ts        Serving scaling, kitchen-friendly rounding, "to taste" handling
  search.ts       Search and category browsing (no randomness)
  text.ts         Text normalization helpers
src/lib/recommend/
  engine.ts       recommend(): filter, score, weighted-random pick, empty-state hints
  cost.ts         Cost estimates; "unavailable" when no sourced price exists
  recent.ts       Recent-suggestion list helpers (separate from "cooked" history)
src/lib/random.ts Seedable random generator for deterministic tests
src/data/
  ingredients.ts  Ingredient catalog with allergen/exclusion tags
  recipes.ts      The 32 sample recipes
  index.ts        Exports CATALOG and RECIPES
scripts/          Terminal tools: suggest.ts, validate-data.ts
```

## How `recommend()` works

1. Validate the user's input. Bad input returns `status: "invalid-input"` with reasons.
2. Validate every recipe. Invalid recipes are skipped and counted in `skippedInvalidRecipes`.
3. Only `published` and `sample` recipes are eligible (`draft` never is).
4. Remove recipes that violate dietary exclusions (always) and the user's filters.
5. Score what remains (cravings, ingredients on hand, recency, unknown cost).
6. Drop the most recent suggestion if alternatives exist, then pick randomly, weighted by score.
7. If nothing remains, return `status: "empty"` with a message and `relaxations`. Dietary exclusions are never listed as relaxable.

## Data model

A recipe references ingredients by id; the ingredient catalog holds names, Filipino aliases, exclusion tags and the pantry-staple flag. Costs are `null` unless a record with `amountPHP`, `forServings`, `source` and `checkedAt` exists. See [RECIPE_GUIDE.md](RECIPE_GUIDE.md).

## Planned layers (not built)

- **Next.js App Router + Tailwind:** pages call `recommend()` and the helpers directly. Route handlers are only added if server logic is needed.
- **Browser storage:** favorites and recent suggestions, device-specific, with validated reads (`pushRecentId` and types already exist).
- **Supabase (Milestone 6, only if worthwhile):** migrate recipes to Postgres with Row Level Security. Service-role keys stay server-side. Accounts, uploads and community features stay out of scope until approved.
