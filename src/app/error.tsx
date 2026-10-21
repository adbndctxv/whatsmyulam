"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-serif text-3xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">
        The page could not load properly. Your choices were not saved anywhere, so nothing is lost.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        Try again
      </button>
    </main>
  );
}
