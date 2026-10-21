# Roadmap

Legend: [x] done and verified, [ ] not done, [~] partly done

## Milestone 1: Project foundation

- [x] Inspect repository (it contained only a README)
- [x] README, roadmap and docs
- [x] `.gitignore`, `.env.example`
- [ ] Next.js, TypeScript, Tailwind scaffold. **Blocked:** npm registry returns 403 in the build environment
- [ ] Application shell and design tokens in code
- [ ] Confirm the app runs and builds

## Milestone 3 (done early): Working recommendation engine

- [x] Recipe types and validation
- [x] 32 sample recipes (all `sample` status, no prices, no photos)
- [x] Filtering, scoring, controlled randomness
- [x] Recent-suggestion avoidance
- [x] No-match handling with relax hints
- [x] 108 automated tests passing
- [ ] Type checking with `tsc` (not installed)

## Milestone 2: Homepage and UI

- [ ] Responsive homepage, meal selector, preference controls
- [ ] Result card, recipe layout, navigation

## Milestone 4: Recipe experience

- [x] Scaling and search logic (tested)
- [ ] Recipe pages with stable URLs
- [ ] Search and category browsing UI
- [ ] Share links (native share plus copy fallback)
- [ ] Local favorites (device-specific) and recent suggestions in browser storage

## Milestone 5: Quality and deployment readiness

- [ ] Playwright browser tests (mobile viewport included)
- [ ] Production build, accessibility and SEO review (metadata, sitemap, robots)
- [ ] Netlify setup and preview deploy

## Milestone 6: Future backend

- [ ] Evaluate Supabase only after the core site works
- Accounts, meal history and community features need explicit approval first.

## Recipe quality (ongoing)

- [ ] Cook and review each recipe, then promote `sample` to `published`
- [ ] Add sourced prices (source, date, location) and licensed photos

## Known limitations

- Recipes are unreviewed sample data.
- Allergen filtering uses listed ingredients only; no label or cross-contamination checks.
- Costs are unavailable for every recipe.
