import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CATALOG, RECIPES } from "../../data/index.ts";
import { MEAL_PERIODS } from "../recipes/types.ts";
import { mulberry32 } from "../random.ts";
import { countSuggested, makeCost, makeRecipe, runMany } from "../testing/fixtures.ts";
import { describeCost, estimateCost } from "./cost.ts";
import { recommend } from "./engine.ts";
import type { RecommendResult } from "./engine.ts";
import { pushRecentId } from "./recent.ts";

function okRecipe(result: RecommendResult) {
  assert.equal(result.status, "ok", `expected ok but got ${JSON.stringify(result)}`);
  if (result.status !== "ok") throw new Error("unreachable");
  return result.suggestion.recipe;
}

describe("meal period filtering", () => {
  for (const period of MEAL_PERIODS) {
    it(`only suggests dishes suitable for ${period}`, () => {
      for (const result of runMany({ mealPeriod: period }, RECIPES, 60)) {
        assert.ok(okRecipe(result).mealPeriods.includes(period));
      }
    });
  }

  it("works with no meal period chosen", () => {
    assert.equal(recommend({}, RECIPES, { catalog: CATALOG }).status, "ok");
  });

  it("lets one dish serve several meal periods", () => {
    const recipe = makeRecipe({ id: "multi", mealPeriods: ["lunch", "dinner"] });
    for (const period of ["lunch", "dinner"] as const) {
      assert.equal(okRecipe(runMany({ mealPeriod: period }, [recipe], 1)[0]).id, "multi");
    }
    assert.equal(runMany({ mealPeriod: "breakfast" }, [recipe], 1)[0].status, "empty");
  });
});

describe("categories and cravings", () => {
  it("only suggests the chosen category", () => {
    for (const result of runMany({ categories: ["pansit"] }, RECIPES, 60)) {
      assert.ok(okRecipe(result).categories.includes("pansit"));
    }
  });

  it("accepts several categories (any of them)", () => {
    const seen = new Set<string>();
    for (const result of runMany({ categories: ["pansit", "lugaw"] }, RECIPES, 150)) {
      for (const c of okRecipe(result).categories) seen.add(c);
    }
    assert.ok(seen.has("pansit") && seen.has("lugaw"));
  });

  it("matches cravings by flavor tag", () => {
    for (const result of runMany({ cravings: ["maasim"] }, RECIPES, 60)) {
      assert.ok(okRecipe(result).tags.includes("maasim"));
    }
  });

  it("matches cravings by dish name or alias", () => {
    for (const result of runMany({ cravings: ["adobo"] }, RECIPES, 40)) {
      assert.match(okRecipe(result).id, /^adobong-/);
    }
  });

  it("cravings are matched case-insensitively and in Filipino or English", () => {
    for (const craving of ["SABAW", "soup"]) {
      for (const result of runMany({ cravings: [craving] }, RECIPES, 20)) {
        assert.ok(okRecipe(result).categories.includes("sabaw"));
      }
    }
  });

  it("reports which cravings matched", () => {
    const result = recommend({ cravings: ["maasim", "sabaw"] }, RECIPES, { catalog: CATALOG });
    assert.equal(result.status, "ok");
    if (result.status === "ok") assert.ok(result.suggestion.matchedCravings.length >= 1);
  });
});

describe("budget", () => {
  const cheap = makeRecipe({ id: "cheap", estimatedCost: makeCost(200) });
  const pricey = makeRecipe({ id: "pricey", estimatedCost: makeCost(2000) });
  const unknown = makeRecipe({ id: "unknown" });

  it("does not restrict suggestions when no budget is given", () => {
    const counts = countSuggested(runMany({}, [cheap, pricey, unknown], 300));
    assert.ok((counts.get("pricey") ?? 0) > 0, "expensive dish should be allowed");
    assert.ok((counts.get("cheap") ?? 0) > 0);
    assert.ok((counts.get("unknown") ?? 0) > 0);
  });

  it("excludes dishes with a known cost above the budget", () => {
    const counts = countSuggested(runMany({ maxBudgetPHP: 500 }, [cheap, pricey], 100));
    assert.equal(counts.get("pricey"), undefined);
    assert.equal(counts.get("cheap"), 100);
  });

  it("keeps dishes with unknown cost, flags them, and says it could not check", () => {
    const result = recommend({ maxBudgetPHP: 500 }, [unknown], { catalog: CATALOG });
    assert.equal(result.status, "ok");
    if (result.status === "ok") {
      assert.equal(result.suggestion.budgetStatus, "unknown-cost");
      assert.equal(result.suggestion.cost.status, "unavailable");
      assert.ok(result.notes.some((n) => n.includes("Cost estimate unavailable")));
    }
  });

  it("marks a dish with known, affordable cost as within budget", () => {
    const result = recommend({ maxBudgetPHP: 500 }, [cheap], { catalog: CATALOG });
    assert.equal(result.status === "ok" && result.suggestion.budgetStatus, "within-budget");
  });

  it("scales the cost check by household size", () => {
    // 400 PHP for 4 servings = 100 per serving.
    const dish = makeRecipe({ id: "dish", estimatedCost: makeCost(400, 4) });
    assert.equal(runMany({ maxBudgetPHP: 250, householdSize: 2 }, [dish], 1)[0].status, "ok");
    assert.equal(runMany({ maxBudgetPHP: 250, householdSize: 8 }, [dish], 1)[0].status, "empty");
  });

  it("offers to raise the budget when it is the only blocker", () => {
    const result = runMany({ maxBudgetPHP: 50 }, [pricey], 1)[0];
    assert.equal(result.status, "empty");
    if (result.status === "empty") assert.ok(result.relaxations.some((r) => r.key === "budget"));
  });

  it("rejects an invalid budget", () => {
    for (const bad of [0, -10, Number.NaN]) {
      assert.equal(recommend({ maxBudgetPHP: bad }, [cheap], { catalog: CATALOG }).status, "invalid-input");
    }
  });
});

describe("cost estimates", () => {
  it("says 'Cost estimate unavailable' when there is no cost data (never invents one)", () => {
    for (const recipe of RECIPES) {
      assert.equal(estimateCost(recipe, 4).status, "unavailable");
    }
    assert.equal(describeCost({ status: "unavailable" }), "Cost estimate unavailable");
  });

  it("computes and labels an estimate when data exists", () => {
    const cost = estimateCost(makeRecipe({ id: "x", estimatedCost: makeCost(400, 4) }), 2);
    assert.equal(cost.status, "known");
    if (cost.status === "known") {
      assert.equal(cost.totalPHP, 200);
      assert.equal(cost.perServingPHP, 100);
      assert.match(describeCost(cost), /^Estimated cost: about PHP 200\.00/);
    }
  });
});

describe("ingredient matching", () => {
  const egg = makeRecipe({ id: "egg-dish", ingredients: [{ ingredientId: "egg", quantity: 2, unit: "pc" }] });
  const chicken = makeRecipe({ id: "chicken-dish", ingredients: [{ ingredientId: "chicken", quantity: 500, unit: "g" }] });

  it("'use what I have' favors matching dishes but does not require them", () => {
    const counts = countSuggested(runMany({ ingredients: ["egg"] }, [egg, chicken], 400));
    assert.ok((counts.get("egg-dish") ?? 0) > (counts.get("chicken-dish") ?? 0) * 2);
    assert.ok((counts.get("chicken-dish") ?? 0) > 0, "non-matching dishes can still appear");
  });

  it("understands Filipino ingredient names", () => {
    const result = recommend({ ingredients: ["itlog"], ingredientMode: "use-only-what-i-have" }, [egg, chicken], { catalog: CATALOG });
    assert.equal(okRecipe(result).id, "egg-dish");
  });

  it("'use only what I have' never suggests a dish with a missing essential ingredient", () => {
    const input = { ingredients: ["egg", "onion", "tomato"], ingredientMode: "use-only-what-i-have" as const };
    for (const result of runMany(input, RECIPES, 80)) {
      assert.equal(result.status, "ok");
      if (result.status === "ok") assert.deepEqual(result.suggestion.missingIngredients, []);
    }
  });

  it("does not treat a missing essential ingredient as optional", () => {
    const needsGarlic = makeRecipe({
      id: "needs-garlic",
      ingredients: [
        { ingredientId: "egg", quantity: 2, unit: "pc" },
        { ingredientId: "garlic", quantity: 3, unit: "clove" },
      ],
    });
    const result = runMany({ ingredients: ["egg"], ingredientMode: "use-only-what-i-have" }, [needsGarlic], 1)[0];
    assert.equal(result.status, "empty");
  });

  it("allows explicitly optional ingredients to be missing", () => {
    const withOptional = makeRecipe({
      id: "with-optional",
      ingredients: [
        { ingredientId: "egg", quantity: 2, unit: "pc" },
        { ingredientId: "garlic", quantity: 3, unit: "clove", optional: true },
      ],
    });
    const result = runMany({ ingredients: ["egg"], ingredientMode: "use-only-what-i-have" }, [withOptional], 1)[0];
    assert.equal(okRecipe(result).id, "with-optional");
  });

  it("assumes pantry staples by default, and can be told not to", () => {
    const withStaple = makeRecipe({
      id: "with-staple",
      ingredients: [
        { ingredientId: "egg", quantity: 2, unit: "pc" },
        { ingredientId: "cooking-oil", quantity: 2, unit: "tbsp" },
      ],
    });
    const base = { ingredients: ["egg"], ingredientMode: "use-only-what-i-have" as const };
    assert.equal(runMany(base, [withStaple], 1)[0].status, "ok");
    assert.equal(runMany({ ...base, assumePantryStaples: false }, [withStaple], 1)[0].status, "empty");
  });

  it("requires at least one recognized ingredient for 'use only what I have'", () => {
    const result = recommend({ ingredientMode: "use-only-what-i-have", ingredients: ["xyz"] }, [egg], { catalog: CATALOG });
    assert.equal(result.status, "invalid-input");
  });

  it("tells the user about ingredients it did not recognize", () => {
    const result = recommend({ ingredients: ["egg", "dragonfruit"] }, [egg], { catalog: CATALOG });
    assert.equal(result.status, "ok");
    if (result.status === "ok") {
      assert.deepEqual(result.unknownIngredients, ["dragonfruit"]);
      assert.ok(result.notes.some((n) => n.includes("dragonfruit")));
    }
  });

  it("offers to relax the ingredient rule when that is the only blocker", () => {
    const result = runMany({ ingredients: ["egg"], ingredientMode: "use-only-what-i-have" }, [chicken], 1)[0];
    assert.equal(result.status, "empty");
    if (result.status === "empty") assert.ok(result.relaxations.some((r) => r.key === "ingredients"));
  });
});

describe("dietary exclusions", () => {
  it("never suggests a dish containing an excluded ingredient group", () => {
    for (const tag of ["pork", "beef", "chicken", "fish", "shellfish", "egg", "dairy", "soy", "gluten", "sesame"] as const) {
      for (const result of runMany({ excludedTags: [tag] }, RECIPES, 40)) {
        const recipe = okRecipe(result);
        for (const ing of recipe.ingredients) {
          assert.ok(!CATALOG.get(ing.ingredientId)?.tags.includes(tag), `${recipe.id} contains ${tag} via ${ing.ingredientId}`);
        }
      }
    }
  });

  it("is conservative: soy sauce counts as soy and gluten, fish sauce as fish", () => {
    const adobo = RECIPES.find((r) => r.id === "adobong-manok")!;
    const sinigang = RECIPES.find((r) => r.id === "sinigang-na-isda")!;
    for (const tag of ["soy", "gluten"] as const) {
      assert.equal(recommend({ excludedTags: [tag] }, [adobo], { catalog: CATALOG }).status, "empty");
    }
    assert.equal(recommend({ excludedTags: ["fish"] }, [sinigang], { catalog: CATALOG }).status, "empty");
  });

  it("counts optional ingredients too (we cannot assume the user skips them)", () => {
    const lugaw = RECIPES.find((r) => r.id === "lugaw")!; // egg is an optional topping
    assert.equal(recommend({ excludedTags: ["egg"] }, [lugaw], { catalog: CATALOG }).status, "empty");
  });

  it("never relaxes an exclusion: empty results explain this and offer no exclusion relaxation", () => {
    const porkOnly = [makeRecipe({ id: "p", ingredients: [{ ingredientId: "pork-belly", quantity: 500, unit: "g" }] })];
    const result = recommend({ excludedTags: ["pork"], mealPeriod: "lunch" }, porkOnly, { catalog: CATALOG });
    assert.equal(result.status, "empty");
    if (result.status === "empty") {
      assert.match(result.message, /dietary exclusions/i);
      // Relaxing optional preferences cannot help, because the exclusion stays on.
      assert.deepEqual(result.relaxations, []);
    }
  });

  it("keeps exclusions on while relaxing other preferences", () => {
    const porkLunch = makeRecipe({ id: "pork-lunch", ingredients: [{ ingredientId: "pork-belly", quantity: 500, unit: "g" }] });
    const eggDinner = makeRecipe({ id: "egg-dinner", mealPeriods: ["dinner"] });
    const result = recommend({ excludedTags: ["pork"], mealPeriod: "lunch" }, [porkLunch, eggDinner], { catalog: CATALOG });
    assert.equal(result.status, "empty");
    if (result.status === "empty") {
      const relax = result.relaxations.find((r) => r.key === "mealPeriod");
      assert.ok(relax);
      assert.equal(relax.matches, 1); // only the egg dinner, never the pork dish
    }
  });

  it("warns that exclusions only reflect listed ingredients", () => {
    const result = recommend({ excludedTags: ["peanut"] }, RECIPES, { catalog: CATALOG });
    assert.equal(result.status, "ok");
    if (result.status === "ok") assert.ok(result.notes.some((n) => /cross-contamination/i.test(n)));
  });

  it("rejects unknown exclusion names instead of ignoring them", () => {
    const result = recommend({ excludedTags: ["nuts" as never] }, RECIPES, { catalog: CATALOG });
    assert.equal(result.status, "invalid-input");
  });
});

describe("recent suggestions", () => {
  const a = makeRecipe({ id: "a" });
  const b = makeRecipe({ id: "b" });
  const c = makeRecipe({ id: "c" });

  it("avoids repeating the last suggestion when there are alternatives", () => {
    for (const result of runMany({ recentRecipeIds: ["a"] }, [a, b, c], 150)) {
      assert.notEqual(okRecipe(result).id, "a");
    }
  });

  it("guarantees no immediate repeat even when the random pick would land on it", () => {
    // random() = 0 always selects the FIRST candidate, which is "a" - the dish
    // we just suggested. The rule must still keep it out.
    const result = recommend({ recentRecipeIds: ["a"] }, [a, b, c], { catalog: CATALOG, random: () => 0 });
    assert.notEqual(okRecipe(result).id, "a");
  });

  it("still returns the last suggestion when it is the only option", () => {
    assert.equal(okRecipe(runMany({ recentRecipeIds: ["a"] }, [a], 1)[0]).id, "a");
  });

  it("downranks older recent dishes so fresh ones win", () => {
    const counts = countSuggested(runMany({ recentRecipeIds: ["x", "b"] }, [a, b, c], 600));
    assert.ok((counts.get("a") ?? 0) > (counts.get("b") ?? 0) * 5);
    assert.ok((counts.get("c") ?? 0) > (counts.get("b") ?? 0) * 5);
  });

  it("'Try Another' flow: pushing each suggestion into recents never repeats back-to-back", () => {
    let recent: string[] = [];
    let previous: string | null = null;
    const random = mulberry32(99);
    for (let i = 0; i < 40; i++) {
      const result = recommend({ recentRecipeIds: recent }, RECIPES, { catalog: CATALOG, random });
      const id = okRecipe(result).id;
      assert.notEqual(id, previous);
      previous = id;
      recent = pushRecentId(recent, id, 10);
    }
  });

  it("pushRecentId keeps newest first, without duplicates, capped", () => {
    assert.deepEqual(pushRecentId(["b", "a"], "a"), ["a", "b"]);
    assert.deepEqual(pushRecentId(["c", "b", "a"], "d", 3), ["d", "c", "b"]);
  });
});

describe("controlled randomness", () => {
  const pool = ["a", "b", "c", "d"].map((id) => makeRecipe({ id }));

  it("gives variety across eligible candidates", () => {
    const counts = countSuggested(runMany({}, pool, 300));
    assert.equal(counts.size, 4);
  });

  it("is repeatable for the same random source", () => {
    const first = recommend({}, RECIPES, { catalog: CATALOG, random: mulberry32(7) });
    const second = recommend({}, RECIPES, { catalog: CATALOG, random: mulberry32(7) });
    assert.equal(okRecipe(first).id, okRecipe(second).id);
  });

  it("uses the injected random function to choose among candidates", () => {
    assert.equal(okRecipe(recommend({}, pool, { catalog: CATALOG, random: () => 0 })).id, "a");
    assert.equal(okRecipe(recommend({}, pool, { catalog: CATALOG, random: () => 0.999999 })).id, "d");
  });

  it("survives a broken random function", () => {
    assert.equal(recommend({}, pool, { catalog: CATALOG, random: () => Number.NaN }).status, "ok");
  });

  it("only ever picks eligible candidates", () => {
    const mixed = [makeRecipe({ id: "ok-1" }), makeRecipe({ id: "dinner-only", mealPeriods: ["dinner"] })];
    for (const result of runMany({ mealPeriod: "lunch" }, mixed, 80)) {
      assert.equal(okRecipe(result).id, "ok-1");
    }
  });
});

describe("empty results", () => {
  it("explains which optional preferences could be relaxed", () => {
    // Pansit is never a midnight snack in the sample data.
    const result = runMany({ mealPeriod: "midnight-snack", categories: ["pansit"] }, RECIPES, 1)[0];
    assert.equal(result.status, "empty");
    if (result.status === "empty") {
      assert.equal(result.reason, "no-match");
      const keys = result.relaxations.map((r) => r.key);
      assert.ok(keys.includes("mealPeriod"));
      assert.ok(keys.includes("categories"));
      assert.ok(result.relaxations.every((r) => r.matches > 0));
    }
  });

  it("says when no craving matches", () => {
    const result = runMany({ cravings: ["maanghang"] }, RECIPES, 1)[0];
    assert.equal(result.status, "empty");
    if (result.status === "empty") assert.ok(result.relaxations.some((r) => r.key === "cravings"));
  });

  it("suggests relaxing several preferences together when no single one is enough", () => {
    const a = makeRecipe({ id: "a", mealPeriods: ["dinner"], categories: ["sabaw"] });
    const result = recommend({ mealPeriod: "lunch", categories: ["karne"] }, [a], { catalog: CATALOG });
    assert.equal(result.status, "empty");
    if (result.status === "empty") assert.deepEqual(result.relaxations.map((r) => r.key), ["all-optional"]);
  });

  it("handles an empty recipe list", () => {
    const result = recommend({}, [], { catalog: CATALOG });
    assert.equal(result.status, "empty");
    if (result.status === "empty") assert.equal(result.reason, "no-recipes-available");
  });

  it("never suggests draft recipes by default", () => {
    const draft = makeRecipe({ id: "draft", publicationStatus: "draft" });
    const result = recommend({}, [draft], { catalog: CATALOG });
    assert.equal(result.status, "empty");
    const allowed = recommend({}, [draft], { catalog: CATALOG, allowedStatuses: ["draft"] });
    assert.equal(allowed.status, "ok");
  });
});

describe("invalid or incomplete data", () => {
  it("skips invalid recipes, reports how many, and never suggests them", () => {
    const good = makeRecipe({ id: "good" });
    const broken = { ...makeRecipe({ id: "broken" }), ingredients: [] };
    const missingFields = { id: "missing" };
    for (const result of runMany({}, [broken, good, missingFields, null], 30)) {
      assert.equal(okRecipe(result).id, "good");
      if (result.status === "ok") assert.equal(result.skippedInvalidRecipes, 3);
    }
  });

  it("rejects bad input values with a clear list of problems", () => {
    const result = recommend(
      { mealPeriod: "brunch" as never, householdSize: 0, categories: ["dessert" as never] },
      RECIPES,
      { catalog: CATALOG },
    );
    assert.equal(result.status, "invalid-input");
    if (result.status === "invalid-input") assert.equal(result.issues.length, 3);
  });

  it("rejects fractional or oversized household sizes", () => {
    for (const bad of [2.5, 51, Number.NaN]) {
      assert.equal(recommend({ householdSize: bad }, RECIPES, { catalog: CATALOG }).status, "invalid-input");
    }
  });
});

describe("the real sample catalog", () => {
  it("produces a suggestion for every meal period with no other choices", () => {
    for (const period of MEAL_PERIODS) {
      assert.equal(recommend({ mealPeriod: period }, RECIPES, { catalog: CATALOG }).status, "ok");
    }
  });

  it("reports the household size as the serving count", () => {
    const result = recommend({ householdSize: 6 }, RECIPES, { catalog: CATALOG });
    assert.equal(result.status === "ok" && result.suggestion.servings, 6);
  });
});
