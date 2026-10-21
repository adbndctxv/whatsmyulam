"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { NoMatch } from "@/components/no-match";
import { PreferencesPanel } from "@/components/preferences-panel";
import { RecipeCard } from "@/components/recipe-card";
import { CATALOG, RECIPES } from "@/data/index.ts";
import { recommend } from "@/lib/recommend/engine.ts";
import type { RecommendResult, RelaxKey } from "@/lib/recommend/engine.ts";
import { pushRecentId } from "@/lib/recommend/recent.ts";
import {
  DEFAULT_PREFERENCES,
  countOptionalPreferences,
  relaxPreference,
  toRecommendInput,
} from "@/lib/web/preferences.ts";
import type { Preferences } from "@/lib/web/preferences.ts";

const RECIPE_NAMES = new Map(RECIPES.map((r) => [r.id, r.name]));

export function Generator() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const resultRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt === 0) return;
    resultRef.current?.focus({ preventScroll: true });
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [attempt]);

  function generate(nextPrefs: Preferences = prefs) {
    setError(null);
    startTransition(() => {
      try {
        const next = recommend(toRecommendInput(nextPrefs, recentIds), RECIPES, { catalog: CATALOG });
        setResult(next);
        if (next.status === "ok") {
          const id = next.suggestion.recipe.id;
          setRecentIds((ids) => pushRecentId(ids, id));
        }
      } catch {
        setResult(null);
        setError("Something went wrong while picking a dish. Please try again.");
      }
      setAttempt((n) => n + 1);
    });
  }

  function applyRelaxation(key: RelaxKey | "all-optional") {
    const next = relaxPreference(prefs, key);
    setPrefs(next);
    generate(next);
  }

  const hasSuggestion = result?.status === "ok";
  const optionalCount = countOptionalPreferences(prefs);
  const exclusionCount = prefs.excludedTags.length;

  return (
    <>
      <section aria-labelledby="hero-heading" className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1 text-sm font-medium text-warning">
          Early preview · {RECIPES.length} sample recipes
        </p>
        <h1
          id="hero-heading"
          className="mt-4 max-w-2xl text-balance font-serif text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
        >
          Ano&apos;ng ulam natin?
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
          Stuck on what to cook today? Tap the button for an ulam idea with ingredients and steps. You can tell us
          what you have or what to avoid, but you do not have to.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => generate()}
            disabled={isPending}
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-primary px-8 text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-70"
          >
            {isPending ? "Pumipili..." : hasSuggestion ? "Try another" : "Suggest an ulam"}
          </button>
          <p className="text-sm text-muted-foreground">
            {optionalCount === 0 && exclusionCount === 0
              ? "No preferences set — any dish can come up."
              : `${exclusionCount} exclusion${exclusionCount === 1 ? "" : "s"}, ${optionalCount} optional preference${optionalCount === 1 ? "" : "s"} active.`}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start">
        <PreferencesPanel prefs={prefs} onChange={setPrefs} />

        <div ref={resultRef} tabIndex={-1} aria-busy={isPending} className="scroll-mt-4 outline-none">
          <p className="sr-only" aria-live="polite">
            {result?.status === "ok"
              ? `Suggested: ${result.suggestion.recipe.name}`
              : result?.status === "empty"
                ? result.message
                : error ?? ""}
          </p>

          {error ? (
            <div role="alert" className="rounded-2xl border border-primary/40 bg-card p-6">
              <h2 className="font-serif text-xl font-semibold">Hindi gumana</h2>
              <p className="mt-2 text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={() => generate()}
                className="mt-4 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover"
              >
                Try again
              </button>
            </div>
          ) : result === null ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
              <h2 className="font-serif text-xl font-semibold">Your ulam idea will appear here</h2>
              <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
                Press &quot;Suggest an ulam&quot; to start. Preferences are optional.
              </p>
            </div>
          ) : result.status === "invalid-input" ? (
            <div role="alert" className="rounded-2xl border border-primary/40 bg-card p-6">
              <h2 className="font-serif text-xl font-semibold">Please check your preferences</h2>
              <ul className="mt-3 list-disc pl-5 text-muted-foreground">
                {result.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : result.status === "empty" ? (
            <NoMatch result={result} hasExclusions={exclusionCount > 0} onApply={applyRelaxation} />
          ) : (
            <div className="flex flex-col gap-4">
              {result.notes.length > 0 && (
                <ul className="flex flex-col gap-2 rounded-2xl bg-warning-soft p-4 text-sm leading-relaxed text-warning">
                  {result.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
              <RecipeCard suggestion={result.suggestion} />
              <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {result.otherMatches === 0
                    ? "This is the only dish that matches right now."
                    : `${result.otherMatches} other dish${result.otherMatches === 1 ? "" : "es"} also match.`}
                </p>
                <button
                  type="button"
                  onClick={() => generate()}
                  disabled={isPending}
                  className="rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-70"
                >
                  Try another
                </button>
              </div>
            </div>
          )}

          {recentIds.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Recently suggested this visit:</span>
              {recentIds.slice(0, 5).map((id) => (
                <span key={id} className="rounded-full bg-muted px-2.5 py-0.5 text-foreground">
                  {RECIPE_NAMES.get(id) ?? id}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setRecentIds([])}
                className="font-medium text-accent underline underline-offset-4"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
