export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="/" className="font-serif text-xl font-semibold tracking-tight">
          What&apos;sMyUlam<span className="text-primary">.ph</span>
        </a>
        <a href="#about" className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
          About the recipes
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:px-6">
        <p>What&apos;sMyUlam.ph — an early preview with sample recipes.</p>
        <p>No account needed. Nothing you choose on this page is saved or sent anywhere.</p>
      </div>
    </footer>
  );
}
