import { CATALOG } from "@/data/index.ts";
import { describeCost } from "@/lib/recommend/cost.ts";
import type { Suggestion } from "@/lib/recommend/engine.ts";
import { scaleRecipe } from "@/lib/recipes/scale.ts";
import { CATEGORY_LABELS, MEAL_PERIOD_LABELS } from "@/lib/recipes/types.ts";
import { TAG_LABELS } from "@/lib/web/labels.ts";

const ingredientName = (id: string) => CATALOG.get(id)?.name ?? id;

export function RecipeCard({ suggestion }: { suggestion: Suggestion }) {
  const { recipe, servings, cost, missingIngredients, matchedCravings } = suggestion;
  const ingredients = scaleRecipe(recipe, servings);
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  return (
    <article aria-labelledby="recipe-name" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border p-6">
        <div className="flex flex-wrap items-center gap-2">
          {recipe.publicationStatus === "sample" && (
            <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-warning">
              Sample recipe
            </span>
          )}
          {recipe.categories.map((c) => (
            <span key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
              {CATEGORY_LABELS[c].fil}
            </span>
          ))}
        </div>
        <h2 id="recipe-name" className="mt-3 text-balance font-serif text-3xl font-semibold sm:text-4xl">
          {recipe.name}
        </h2>
        {recipe.aliases && recipe.aliases.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">Also called: {recipe.aliases.join(", ")}</p>
        )}
        <p className="mt-3 leading-relaxed text-muted-foreground">{recipe.description}</p>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Meta label="Prep" value={`${recipe.prepMinutes} min`} />
          <Meta label="Cook" value={`${recipe.cookMinutes} min`} />
          <Meta label="Total" value={`${totalMinutes} min${recipe.restMinutes ? ` + ${recipe.restMinutes} rest` : ""}`} />
          <Meta label="Serves" value={String(servings)} />
        </dl>

        <p className="mt-4 text-sm">
          <span className="font-medium">Cost: </span>
          <span className="text-muted-foreground">{describeCost(cost)}</span>
        </p>
        <p className="mt-1 text-sm">
          <span className="font-medium">Good for: </span>
          <span className="text-muted-foreground">
            {recipe.mealPeriods.map((m) => MEAL_PERIOD_LABELS[m].fil).join(", ")}
          </span>
        </p>
        {recipe.tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Flavor tags">
            {recipe.tags.map((t) => (
              <li
                key={t}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${
                  matchedCravings.includes(t) ? "border-accent bg-accent-soft text-accent" : "border-border"
                }`}
              >
                {TAG_LABELS[t].fil}
              </li>
            ))}
          </ul>
        )}
      </div>

      {missingIngredients.length > 0 && (
        <p className="border-b border-border bg-muted/60 px-6 py-3 text-sm">
          <span className="font-medium">You may still need: </span>
          {missingIngredients.map(ingredientName).join(", ")}
        </p>
      )}

      <div className="grid gap-8 p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="ingredients-heading">
          <h3 id="ingredients-heading" className="font-serif text-xl font-semibold">
            Mga sangkap
          </h3>
          <p className="text-xs text-muted-foreground">Ingredients for {servings} servings (estimates)</p>
          <ul className="mt-3 flex flex-col divide-y divide-border">
            {ingredients.map((ing, i) => (
              <li key={`${ing.ingredientId}-${i}`} className="flex flex-col py-2">
                <span>
                  <span className="font-medium">{ing.display}</span> {ingredientName(ing.ingredientId)}
                  {ing.optional && <span className="text-muted-foreground"> (optional)</span>}
                </span>
                {ing.note && <span className="text-sm text-muted-foreground">{ing.note}</span>}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="steps-heading">
          <h3 id="steps-heading" className="font-serif text-xl font-semibold">
            Paraan ng pagluto
          </h3>
          <p className="text-xs text-muted-foreground">Cooking steps</p>
          <ol className="mt-3 flex flex-col gap-4">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <footer className="border-t border-border bg-muted/40 px-6 py-4 text-xs leading-relaxed text-muted-foreground">
        {recipe.sourceAttribution}
      </footer>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
