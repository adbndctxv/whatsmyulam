// Try the recommendation engine from your terminal.
//
// Examples:
//   node scripts/suggest.ts
//   node scripts/suggest.ts --meal=dinner
//   node scripts/suggest.ts --meal=lunch --craving=maasim --servings=6
//   node scripts/suggest.ts --have=itlog,sibuyas,kamatis --only
//   node scripts/suggest.ts --exclude=pork,shellfish --recent=adobong-manok
//
// Options:
//   --meal=breakfast|lunch|dinner|merienda|midnight-snack
//   --craving=word1,word2      --category=sabaw,gulay
//   --servings=N               --budget=PHP
//   --have=ing1,ing2           --only  (use ONLY what I have)
//   --exclude=pork,egg,...     --recent=id1,id2 (newest first)

import { CATALOG, RECIPES } from "../src/data/index.ts";
import { recommend } from "../src/lib/recommend/engine.ts";
import type { RecommendInput } from "../src/lib/recommend/engine.ts";
import { describeCost } from "../src/lib/recommend/cost.ts";
import { scaleRecipe } from "../src/lib/recipes/scale.ts";
import type { Category, ExclusionTag, MealPeriod } from "../src/lib/recipes/types.ts";

function readArgs(argv: string[]): Map<string, string> {
  const args = new Map<string, string>();
  for (const arg of argv) {
    const match = /^--([a-z-]+)(?:=(.*))?$/.exec(arg);
    if (match) args.set(match[1], match[2] ?? "true");
  }
  return args;
}

const list = (value: string | undefined): string[] =>
  value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];

const args = readArgs(process.argv.slice(2));
const input: RecommendInput = {
  mealPeriod: (args.get("meal") as MealPeriod | undefined) ?? null,
  cravings: list(args.get("craving")),
  categories: list(args.get("category")) as Category[],
  householdSize: args.has("servings") ? Number(args.get("servings")) : null,
  maxBudgetPHP: args.has("budget") ? Number(args.get("budget")) : null,
  ingredients: list(args.get("have")),
  ingredientMode: args.has("only") ? "use-only-what-i-have" : "use-what-i-have",
  excludedTags: list(args.get("exclude")) as ExclusionTag[],
  recentRecipeIds: list(args.get("recent")),
};

const result = recommend(input, RECIPES, { catalog: CATALOG });

if (result.status === "invalid-input") {
  console.log("Please fix your input:");
  for (const issue of result.issues) console.log(`  - ${issue}`);
  process.exit(1);
}

for (const note of result.notes) console.log(`Note: ${note}`);

if (result.status === "empty") {
  console.log(`\n${result.message}`);
  for (const relaxation of result.relaxations) console.log(`  - ${relaxation.message}`);
  process.exit(0);
}

const { recipe, servings, cost, missingIngredients } = result.suggestion;
console.log(`\n=== ${recipe.name} ===`);
console.log(recipe.description);
console.log(`Prep ${recipe.prepMinutes} min, cook ${recipe.cookMinutes} min. Serves ${servings}.`);
console.log(describeCost(cost));
console.log(`Status: ${recipe.publicationStatus} (${recipe.sourceAttribution})`);
if (missingIngredients.length > 0) {
  console.log(`You would still need: ${missingIngredients.join(", ")}`);
}
console.log(`\nIngredients (estimates for ${servings} servings):`);
for (const ing of scaleRecipe(recipe, servings)) {
  const name = CATALOG.get(ing.ingredientId)?.name ?? ing.ingredientId;
  const flags = [ing.optional ? "optional" : "", ing.note ?? ""].filter(Boolean).join("; ");
  console.log(`  - ${ing.display} ${name}${flags ? ` (${flags})` : ""}`);
}
console.log("\nSteps:");
recipe.instructions.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
console.log(`\n(${result.otherMatches} other dish${result.otherMatches === 1 ? "" : "es"} also matched. Run again for a different one.)`);
