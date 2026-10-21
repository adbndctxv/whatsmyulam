# Recipe guide

How to add, edit, review and publish recipes.

## Statuses

| Status | Meaning | Shown to users? |
| --- | --- | --- |
| `draft` | Work in progress | No |
| `sample` | Illustrative data written for the project. **Not** kitchen-tested or reviewed | Yes, labelled as sample |
| `published` | Cooked and reviewed by a named person on a named date | Yes |

All 32 current recipes are `sample`. Validation refuses a `published` recipe without `review: { reviewedBy, reviewedAt }`.

## Adding a recipe

1. Open `src/data/recipes.ts` and copy a similar recipe.
2. Give it a unique `id` and `slug` (lowercase, hyphens). The slug becomes the URL.
3. Every ingredient must exist in `src/data/ingredients.ts`. If not, add it there first, with Filipino aliases (for example "toyo") and **all** exclusion tags it commonly contains.
4. Use real quantities and units. For seasonings with no amount, use `taste("salt")`. **Never invent a quantity.**
5. List `mealPeriods` for every period the dish suits (adobo: lunch and dinner).
6. Use `restMinutes` for marinating or soaking, so cooking time stays honest.
7. Run `npm run validate:data` and `npm test`.

## Ingredient rules

- `quantity` and `unit` are both `null` only when `toTaste` is `true`.
- `optional: true` for toppings or extras. Optional ingredients still count for dietary exclusions.
- `scaling: "taste"` for seasonings. When servings go up they grow by only 75% of the extra amount; scaling down is proportional. Every scaled amount is an estimate.
- `pantryStaple` (on the catalog item) is only for things like salt, oil and water. Never set it on a main ingredient.

## Allergens and exclusions

Tags describe the ingredient as commonly sold (soy sauce: soy and gluten; fish sauce: fish; canton noodles: gluten and egg). Be conservative: when unsure, add the tag. These tags only reflect listed ingredients and cannot account for brands or cross-contamination, so the app tells users to check labels.

## Costs

Leave `estimatedCost: null` unless you have real prices. A cost needs `amountPHP`, `forServings`, `source`, `checkedAt` (YYYY-MM-DD) and ideally `location`. The app shows it as an estimate, never a guaranteed price.

## Images and sources

`imageUrl` stays `null` unless you have a properly licensed image; then `imageCredit` is required. Do not hotlink random images. `sourceUrl` is `null` unless a real source exists. Never write an invented citation.

## Publishing

1. Cook the recipe at least once. Compare quantities, times and steps.
2. Fix anything wrong.
3. Set `publicationStatus: "published"`, and add `review: { reviewedBy: "Name", reviewedAt: "YYYY-MM-DD" }`.
4. Replace the sample `sourceAttribution` with accurate text.
5. Run `npm run validate:data` and `npm test`, then open a pull request for review.
