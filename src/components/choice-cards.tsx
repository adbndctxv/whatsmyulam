"use client";

import { useId } from "react";

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  hint: string;
  count: number;
};

export function ChoiceCardGroup<T extends string>({
  step,
  title,
  description,
  options,
  selected,
  onToggle,
  onClear,
}: {
  step: number;
  title: string;
  description: string;
  options: ChoiceOption<T>[];
  selected: readonly T[];
  onToggle: (value: T) => void;
  onClear: () => void;
}) {
  const id = useId();
  return (
    <section aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
          >
            {step}
          </span>
          <div>
            <h2 id={`${id}-title`} className="font-serif text-2xl font-semibold leading-tight">
              {title}
            </h2>
            <p id={`${id}-desc`} className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-accent underline underline-offset-4"
          >
            Clear<span className="sr-only"> {title}</span>
          </button>
        )}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="list">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <li key={option.value}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggle(option.value)}
                className="group relative flex h-full min-h-20 w-full flex-col items-start justify-between gap-1 rounded-xl border-2 border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary-soft/40 aria-pressed:border-primary aria-pressed:bg-primary-soft"
              >
                <span className="pr-7">
                  <span className="block text-base font-semibold leading-tight">{option.label}</span>
                  {option.hint !== option.label && (
                    <span className="block text-sm text-muted-foreground">{option.hint}</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {option.count} dish{option.count === 1 ? "" : "es"}
                </span>
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full border-2 border-border bg-card text-primary-foreground group-aria-pressed:border-primary group-aria-pressed:bg-primary"
                >
                  <svg viewBox="0 0 16 16" className="size-3 opacity-0 group-aria-pressed:opacity-100" fill="none">
                    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
