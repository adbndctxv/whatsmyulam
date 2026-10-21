# What'sMyUlam.ph

> "Kapitbahay, ano'ng ulam natin?"

A Filipino-focused meal discovery website that helps households decide what to cook for breakfast, lunch, dinner, merienda and midnight snacks. No account is needed to use the generator.

## Current status

**Milestone 1 (foundation) is partly done: the core logic is built and tested, but there is no website yet.**

| Done and verified | Not done yet |
| --- | --- |
| Recipe types and validation | Next.js / React / Tailwind app (needs npm access) |
| Recommendation engine | Homepage and recipe pages |
| 32 sample recipes (all valid) | Browser (Playwright) tests |
| Serving scaling, search, recent-history helpers | Netlify deployment |
| 108 automated unit tests, all passing | Real photos, real cost data |

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full checklist.

## Try it now (no installs needed)

You only need Node.js 22.18 or newer (`node -v` to check).

```bash
npm test                 # run all 108 tests
npm run validate:data    # check every recipe is valid
npm run suggest          # get a random suggestion in the terminal
npm run suggest -- --meal=dinner --craving=maasim
npm run suggest -- --have=itlog,sibuyas,kamatis --only
npm run suggest -- --exclude=pork,shellfish --recent=adobong-manok
```

Node runs the TypeScript files directly, so there is nothing to install or build for the core logic.

## Important honesty notes

- **All 32 recipes are illustrative sample data.** They follow common home-cooking methods but were not cooked in a kitchen or reviewed by an editor, and they have no cited source. Each is marked `sample`.
- **No prices are included.** Cost is shown as "Cost estimate unavailable" until real, sourced prices are added.
- **No photos are included.** The website will show a fallback until licensed images are added.
- **Dietary exclusions use only the ingredients listed.** We cannot verify product labels or cross-contamination, so people with allergies must still check labels.

## Project layout

```
src/lib/recipes/     types, validation, scaling, search, ingredient lookup
src/lib/recommend/   the recommendation engine, cost helper, recent history
src/data/            ingredient catalog and sample recipes
scripts/             terminal tools (suggest, validate-data)
docs/                architecture, recipe guide, testing, deployment, roadmap
```

## Documentation

- [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md): what the MVP does
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the code fits together
- [docs/RECIPE_GUIDE.md](docs/RECIPE_GUIDE.md): add, edit, review and publish recipes
- [docs/TESTING.md](docs/TESTING.md): what is tested and how to run it
- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md): colors, type and layout rules
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md): planned Netlify setup
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md): common problems
- [docs/ROADMAP.md](docs/ROADMAP.md): milestones and status
