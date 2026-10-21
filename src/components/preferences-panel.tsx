"use client";

import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { CATALOG, INGREDIENTS } from "@/data/index.ts";
import { resolveIngredient } from "@/lib/recipes/ingredients.ts";
import {
  CATEGORY_LABELS,
  EXCLUSION_TAGS,
  MEAL_PERIODS,
  MEAL_PERIOD_LABELS,
  VEGETARIAN_EXCLUSIONS,
} from "@/lib/recipes/types.ts";
import type { Category, MealPeriod } from "@/lib/recipes/types.ts";
import { EXCLUSION_LABELS, INGREDIENT_MODE_LABELS } from "@/lib/web/labels.ts";
import { toggleItem } from "@/lib/web/preferences.ts";
import type { Preferences } from "@/lib/web/preferences.ts";

const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));
const shortExclusion = (label: string) => label.replace(/\s*\(.*\)$/, "");

export function CustomizePanel({
  prefs,
  onChange,
  dishTypes,
}: {
  prefs: Preferences;
  onChange: (prefs: Preferences) => void;
  dishTypes: { value: Category; count: number }[];
}) {
  const ids = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const update = (patch: Partial<Preferences>) => onChange({ ...prefs, ...patch });

  function addIngredient() {
    const text = draft.trim();
    if (!text) return;
    const exists = prefs.ingredients.some((x) => x.toLowerCase() === text.toLowerCase());
    if (!exists) update({ ingredients: [...prefs.ingredients, text] });
    setDraft("");
  }

  function onIngredientKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || e.nativeEvent.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    addIngredient();
  }

  const vegetarianOn = VEGETARIAN_EXCLUSIONS.every((t) => prefs.excludedTags.includes(t));
  const extrasCount =
    (prefs.ingredients.length > 0 ? 1 : 0) +
    (dishTypes.some((d) => prefs.categories.includes(d.value)) ? 1 : 0) +
    (prefs.mealPeriod ? 1 : 0) +
    (prefs.householdSize !== null ? 1 : 0) +
    (prefs.maxBudgetPHP !== null ? 1 : 0);

  return (
    <section aria-labelledby={`${ids}-heading`} className="rounded-2xl border border-border bg-card">
      <h2 id={`${ids}-heading`}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${ids}-body`}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
        >
          <span className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
            >
              3
            </span>
            <span>
              <span className="block font-serif text-xl font-semibold leading-tight">Customize your choices</span>
              <span className="block text-sm font-normal text-muted-foreground">
                Optional · ingredients to avoid, what you have, dish type, budget
                {extrasCount > 0 && ` · ${extrasCount} set`}
              </span>
            </span>
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
          >
            <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h2>

      {prefs.excludedTags.length > 0 && (
        <p className="mx-4 mb-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
          <span className="font-semibold">Always avoiding:</span>{" "}
          {prefs.excludedTags.map((t) => shortExclusion(EXCLUSION_LABELS[t])).join(", ")}
        </p>
      )}

      <div id={`${ids}-body`} hidden={!open} className="flex flex-col gap-6 border-t border-border p-4">
        <fieldset className="rounded-xl border border-accent/40 bg-accent-soft/50 p-4">
          <legend className="px-1 font-semibold">
            Ingredients to avoid{" "}
            <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-xs text-white">Always applied</span>
          </legend>
          <p className="text-sm text-muted-foreground">
            We will never suggest a dish that lists these, even if nothing else matches.
          </p>
          <button
            type="button"
            aria-pressed={vegetarianOn}
            onClick={() =>
              update({
                excludedTags: vegetarianOn
                  ? prefs.excludedTags.filter((t) => !VEGETARIAN_EXCLUSIONS.includes(t))
                  : [...new Set([...prefs.excludedTags, ...VEGETARIAN_EXCLUSIONS])],
              })
            }
            className="mt-3 min-h-10 rounded-full border border-accent px-4 text-sm font-medium text-accent aria-pressed:bg-accent aria-pressed:text-white"
          >
            {vegetarianOn && <span aria-hidden="true">✓ </span>}
            Vegetarian (no meat or seafood)
          </button>
          <div className="mt-3 grid grid-cols-1 gap-x-3 sm:grid-cols-2">
            {EXCLUSION_TAGS.map((tag) => (
              <label key={tag} className="flex min-h-10 items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.excludedTags.includes(tag)}
                  onChange={() => update({ excludedTags: toggleItem(prefs.excludedTags, tag) })}
                  className="size-5 accent-accent"
                />
                {EXCLUSION_LABELS[tag]}
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            This only checks the ingredients written in each recipe. It cannot guarantee a dish is free from
            allergens or cross-contamination. Please check product labels.
          </p>
        </fieldset>

        <Group title="Ingredients I have">
          <div className="flex gap-2">
            <label htmlFor={`${ids}-ing`} className="sr-only">
              Add an ingredient
            </label>
            <input
              id={`${ids}-ing`}
              list={`${ids}-ing-list`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onIngredientKeyDown}
              placeholder="e.g. itlog, kamatis"
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-base"
            />
            <button
              type="button"
              onClick={addIngredient}
              className="min-h-11 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
            >
              Add
            </button>
            <datalist id={`${ids}-ing-list`}>
              {INGREDIENTS.map((i) => (
                <option key={i.id} value={i.name} />
              ))}
            </datalist>
          </div>
          {prefs.ingredients.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Ingredients you added">
              {prefs.ingredients.map((text) => {
                const id = resolveIngredient(text, CATALOG);
                return (
                  <li key={text}>
                    <button
                      type="button"
                      onClick={() => update({ ingredients: prefs.ingredients.filter((x) => x !== text) })}
                      className={`min-h-9 rounded-full border px-3 text-sm ${id ? "border-border bg-muted" : "border-dashed border-primary/60 text-primary"}`}
                    >
                      {id ? CATALOG.get(id)?.name : `${text} (not recognized)`}
                      <span aria-hidden="true"> ×</span>
                      <span className="sr-only">, remove</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label="How to use my ingredients">
            {(Object.keys(INGREDIENT_MODE_LABELS) as (keyof typeof INGREDIENT_MODE_LABELS)[]).map((mode) => (
              <label key={mode} className="flex gap-2.5 text-sm">
                <input
                  type="radio"
                  name={`${ids}-mode`}
                  checked={prefs.ingredientMode === mode}
                  onChange={() => update({ ingredientMode: mode })}
                  className="mt-0.5 size-5 accent-primary"
                />
                <span>
                  <span className="font-medium">{INGREDIENT_MODE_LABELS[mode].title}</span>
                  <span className="block text-muted-foreground">{INGREDIENT_MODE_LABELS[mode].description}</span>
                </span>
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              checked={prefs.assumePantryStaples}
              onChange={(e) => update({ assumePantryStaples: e.target.checked })}
              className="size-5 accent-primary"
            />
            I have basic pantry staples (salt, oil, water...)
          </label>
        </Group>

        <Group title="Dish type" hint="Combined with step 2: dishes matching any selected type are shown.">
          <ul className="flex flex-wrap gap-2" aria-label="Dish types">
            {dishTypes.map(({ value, count }) => (
              <li key={value}>
                <button
                  type="button"
                  aria-pressed={prefs.categories.includes(value)}
                  onClick={() => update({ categories: toggleItem(prefs.categories, value) })}
                  className="min-h-10 rounded-full border border-border px-3.5 text-sm transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
                >
                  {prefs.categories.includes(value) && <span aria-hidden="true">✓ </span>}
                  {CATEGORY_LABELS[value].fil}
                  <span className="opacity-75"> · {CATEGORY_LABELS[value].en}</span>
                  <span className="sr-only">, {count} dishes</span>
                </button>
              </li>
            ))}
          </ul>
        </Group>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Meal
            <select
              value={prefs.mealPeriod ?? ""}
              onChange={(e) => update({ mealPeriod: (e.target.value || null) as MealPeriod | null })}
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-base font-normal"
            >
              <option value="">Any meal</option>
              {MEAL_PERIODS.map((m) => (
                <option key={m} value={m}>
                  {MEAL_PERIOD_LABELS[m].fil}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            People eating
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              value={prefs.householdSize ?? ""}
              onChange={(e) => update({ householdSize: numberOrNull(e.target.value) })}
              placeholder="Recipe default"
              className="min-h-11 rounded-lg border border-border bg-background px-3 text-base font-normal"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Budget in PHP
          <input
            type="number"
            inputMode="decimal"
            min={1}
            value={prefs.maxBudgetPHP ?? ""}
            onChange={(e) => update({ maxBudgetPHP: numberOrNull(e.target.value) })}
            placeholder="No budget"
            className="min-h-11 rounded-lg border border-border bg-background px-3 text-base font-normal"
          />
          <span className="text-xs font-normal text-muted-foreground">
            The sample recipes have no verified prices yet, so a budget cannot be checked for now.
          </span>
        </label>
      </div>
    </section>
  );
}

function Group({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}
