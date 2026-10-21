import type { RecommendResult, RelaxKey } from "@/lib/recommend/engine.ts";

type EmptyResult = Extract<RecommendResult, { status: "empty" }>;

export function NoMatch({
  result,
  hasExclusions,
  onApply,
}: {
  result: EmptyResult;
  hasExclusions: boolean;
  onApply: (key: RelaxKey | "all-optional") => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-serif text-2xl font-semibold">Walang tugma — no dish matched</h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{result.message}</p>

      {result.notes.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2 rounded-xl bg-warning-soft p-4 text-sm text-warning">
          {result.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}

      {result.relaxations.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-semibold">You can choose to change one of these optional preferences:</h3>
          <ul className="mt-3 flex flex-col gap-2">
            {result.relaxations.map((relaxation) => (
              <li
                key={relaxation.key}
                className="flex flex-col gap-2 rounded-xl border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm">{relaxation.message}</span>
                <button
                  type="button"
                  onClick={() => onApply(relaxation.key)}
                  className="shrink-0 rounded-full border border-accent px-4 py-1.5 text-sm font-semibold text-accent hover:bg-accent-soft"
                >
                  Apply this change
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No single optional change would help. You can edit your preferences yourself in the panel.
        </p>
      )}

      {hasExclusions && (
        <p className="mt-4 text-sm font-medium text-accent">
          Your dietary exclusions stay on. Only you can turn them off.
        </p>
      )}
    </div>
  );
}
