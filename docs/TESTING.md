# Testing

## Run everything

```bash
npm test                 # all unit tests (Node's built-in test runner)
npm run validate:data    # validates every recipe against the catalog
```

Requires Node 22.18 or newer. No packages are installed; Node runs `.ts` files directly.

## Current results

Last run: **108 tests, 108 passing, 0 failing.** `validate:data`: 32 of 32 recipes valid.

| File | Tests | Covers |
| --- | --- | --- |
| `src/lib/recommend/engine.test.ts` | 55 | Meal-period filtering, categories and cravings, budget (given and omitted), cost estimates, ingredient matching (both modes), dietary exclusions, recent-suggestion avoidance, controlled randomness, empty results, invalid input and recipes, the real catalog |
| `src/lib/recipes/validate.test.ts` | 16 | Valid, missing and malformed recipe data, review rules |
| `src/lib/recipes/scale.test.ts` | 12 | Serving scaling, seasoning scaling, rounding, "to taste", bad serving counts |
| `src/lib/recipes/search.test.ts` | 12 | Search relevance, categories, filters, empty results |
| `src/data/data.test.ts` | 9 | Catalog integrity, unique ids and slugs, coverage of all five meal periods |

## What is NOT verified yet

- **TypeScript type checking.** Node strips types without checking them, and `tsc` is not installed. Run `tsc --noEmit` once dependencies can be installed.
- **Linting, the Next.js build and all React UI.** They do not exist yet.
- **Browser tests (Playwright):** homepage, generate, open recipe, change servings, search, empty states, mobile viewport. Planned for after the UI.
- **Recipe quality.** Tests prove the data is valid and complete, not that a recipe tastes right. That needs a person cooking it.

## Writing a test

Add `something.test.ts` next to the code. Use `node:test` and `node:assert/strict`. Fixtures live in `src/lib/testing/fixtures.ts`. For random behavior, pass a fixed `random` function, as the existing tests do.
