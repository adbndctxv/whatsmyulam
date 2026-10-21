# Troubleshooting

## `npm test` says "Unknown file extension .ts" or similar

Your Node is too old. Run `node -v`; you need **22.18 or newer**. Install a newer Node from nodejs.org.

## "Module type ... is not specified" warning

`package.json` must contain `"type": "module"`. It does now; if you see this, check that line is still there.

## `npm run validate:data` lists problems

Each line names the recipe and the field. Common causes: an ingredient id missing from `src/data/ingredients.ts`, a duplicate `slug`, a `published` recipe with no `review`, or a quantity of `null` without `toTaste`.

## The suggestion is "No dish matches all your choices"

Read the "relax" hints printed under it. Dietary exclusions are never relaxed on purpose.

## "We did not recognize: ..." for an ingredient

The name is not in the ingredient catalog or its aliases. Add it (with aliases) in `src/data/ingredients.ts`. The engine never guesses.

## `npm install` fails with 403 or ENOTFOUND

The network blocks the npm registry (this happened in the build environment). Allow `registry.npmjs.org`, or use an approved mirror, then retry.

## `git push` is refused

The Claude GitHub App must be installed on the repository, or GitHub reconnected in your Claude connector settings.
