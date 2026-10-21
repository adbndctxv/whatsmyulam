// Checks every recipe in src/data and prints a report.
//
// Run it with:   node scripts/validate-data.ts
// It exits with an error code if any recipe is invalid, so it can also be used
// in automated checks.

import { CATALOG, RECIPES } from "../src/data/index.ts";
import { validateRecipes } from "../src/lib/recipes/validate.ts";

const { valid, invalid } = validateRecipes(RECIPES, CATALOG);

console.log(`Recipes checked: ${RECIPES.length}`);
console.log(`Valid:           ${valid.length}`);
console.log(`Invalid:         ${invalid.length}`);

const byStatus: Record<string, number> = {};
for (const recipe of valid) {
  byStatus[recipe.publicationStatus] = (byStatus[recipe.publicationStatus] ?? 0) + 1;
}
console.log("By status:      ", JSON.stringify(byStatus));

for (const report of invalid) {
  console.log(`\nProblem in recipe #${report.index} (${report.id ?? "no id"}):`);
  for (const issue of report.issues) {
    console.log(`  - ${issue.path || "(recipe)"}: ${issue.message}`);
  }
}

if (invalid.length > 0) process.exit(1);
