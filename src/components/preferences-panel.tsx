"use client";

import { useId, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { CATALOG, INGREDIENTS } from "@/data/index.ts";
import { resolveIngredient } from "@/lib/recipes/ingredients.ts";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  EXCLUSION_TAGS,
  MEAL_PERIODS,
  MEAL_PERIOD_LABELS,
  RECIPE_TAGS,
  VEGETARIAN_EXCLUSIONS,
} from "@/lib/recipes/types.ts";
import type { MealPeriod } from "@/lib/recipes/types.ts";
import { EXCLUSION_LABELS, INGREDIENT_MODE_LABELS, TAG_LABELS } from "@/lib/web/labels.ts";
import { resetOptionalPreferences, toggleItem } from "@/lib/web/preferences.ts";
import type { Preferences } from "@/lib/web/preferences.ts";

const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

export function PreferencesPanel({
  prefs,
  onChange,
}: {
  prefs: Preferences;
  onChange: (prefs: Preferences) => void;
}) {
  const ids = useId();
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

  return (
    <aside aria-labelledby={`${ids}-heading`} className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`${ids}-heading`} className="font-serif text-xl font-semibold">
          Preferences
        </h2>
        <button
          type="button"
          onClick={() => onChange(resetOptionalPreferences(prefs))}
          className="text-sm font-medium text-accent underline underline-offset-4"
        >
          Reset optional
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">All optional. Changes apply the next time you press the button.</p>

      <div className="mt-5 flex flex-col gap-6">
        <fieldset className="rounded-xl border border-accent/40 bg-accent-soft/50 p-4">
          <legend className="px-1 font-semibold">
            Avoid these <span className="ml-1 rounded bg-accent px-1.5 py-0.5 text-xs text-white">Hard rule</span>
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
            className="mt-3 rounded-full border border-accent px-3 py-1 text-sm font-medium text-accent aria-pressed:bg-accent aria-pressed:text-white"
          >
            Vegetarian (no meat or seafood)
          </button>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
            {EXCLUSION_TAGS.map((tag) => (
              <label key={tag} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={prefs.excludedTags.includes(tag)}
                  onChange={() => update({ excludedTags: toggleItem(prefs.excludedTags, tag) })}
                  className="size-4 accent-accent"
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
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={addIngredient}
              className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background"
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
                      className={`rounded-full border px-2.5 py-0.5 text-sm ${id ? "border-border bg-muted" : "border-dashed border-primary/60 text-primary"}`}
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
              <label key={mode} className="flex gap-2 text-sm">
                <input
                  type="radio"
                  name={`${ids}-mode`}
                  checked={prefs.ingredientMode === mode}
                  onChange={() => update({ ingredientMode: mode })}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span>
                  <span className="font-medium">{INGREDIENT_MODE_LABELS[mode].title}</span>
                  <span className="block text-muted-foreground">{INGREDIENT_MODE_LABELS[mode].description}</span>
                </span>
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={prefs.assumePantryStaples}
              onChange={(e) => update({ assumePantryStaples: e.target.checked })}
              className="size-4 accent-primary"
            />
            I have basic pantry staples (salt, oil, water...)
          </label>
        </Group>

        <Group title="Craving">
          <ToggleList
            items={RECIPE_TAGS.map((t) => ({ value: t, label: TAG_LABELS[t].fil, hint: TAG_LABELS[t].en }))}
            selected={prefs.cravings}
            onToggle={(t) => update({ cravings: toggleItem(prefs.cravings, t) })}
            label="Cravings"
          />
        </Group>

        <Group title="Dish type">
          <ToggleList
            items={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c].fil, hint: CATEGORY_LABELS[c].en }))}
            selected={prefs.categories}
            onToggle={(c) => update({ categories: toggleItem(prefs.categories, c) })}
            label="Dish types"
          />
        </Group>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium">
            Meal
            <select
              value={prefs.mealPeriod ?? ""}
              onChange={(e) => update({ mealPeriod: (e.target.value || null) as MealPeriod | null })}
              className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
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
              className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Budget in PHP (optional)
          <input
            type="number"
            inputMode="decimal"
            min={1}
            value={prefs.maxBudgetPHP ?? ""}
            onChange={(e) => update({ maxBudgetPHP: numberOrNull(e.target.value) })}
            placeholder="No budget"
            className="rounded-lg border border-border bg-background px-3 py-2 font-normal"
          />
          <span className="text-xs font-normal text-muted-foreground">
            The sample recipes have no verified prices yet, so a budget cannot be checked for now.
          </span>
        </label>
      </div>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function ToggleList<T extends string>({
  items,
  selected,
  onToggle,
  label,
}: {
  items: { value: T; label: string; hint: string }[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  label: string;
}) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={label}>
      {items.map((item) => (
        <li key={item.value}>
          <button
            type="button"
            aria-pressed={selected.includes(item.value)}
            onClick={() => onToggle(item.value)}
            title={item.hint}
            className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
          >
            {item.label}
            {item.hint !== item.label && <span className="sr-only"> ({item.hint})</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}
