# Product requirements (MVP)

**Product:** What'sMyUlam.ph, "Kapitbahay, ano'ng ulam natin?"
**Audience:** Filipino households that cook at home and struggle to decide what to prepare.
**Principle:** Decide, Discover, Cook, Remember, Share, Join the movement. Build the smallest useful product first.

## Core flow

1. Pick breakfast, lunch, dinner, merienda or midnight snack.
2. Optionally add cravings, dish categories, household size, budget, ingredients on hand, recent dishes and dietary exclusions.
3. Press **ANO ULAM NATIN?**
4. Get a suggestion with a **View Recipe** and a **Try Another** action.

No account is needed. No AI or network call is used to pick a dish.

## Behavior rules (implemented in the engine)

| Rule | Behavior |
| --- | --- |
| Meal period | A dish can suit several periods. A selected period filters the list. |
| Dietary exclusions | Hard rule, never relaxed, even when nothing matches. Counts optional ingredients too. |
| Categories, cravings | Filters. If they leave nothing, the result says which one to relax. |
| Budget | Optional. With no budget, nothing is limited. Dishes with a known cost over budget are removed. Dishes with no cost data stay in, ranked lower and labelled "Cost estimate unavailable". |
| Ingredients | "Use what I have" ranks dishes by how many essentials you have. "Use only what I have" removes any dish with a missing essential. Only explicitly flagged pantry staples (salt, oil, water...) are assumed. |
| Recent suggestions | Recently shown dishes are ranked lower. The newest one is never repeated while alternatives exist. |
| Randomness | Weighted random pick among eligible dishes (injectable for tests). |
| Empty result | A helpful message plus which optional preferences to relax and how many dishes would then match. |

## Recipe pages and browsing (not built yet)

Stable URL per recipe, ingredients with quantities, steps, times, serving scaling (marked as an estimate), search, category browsing, share link with copy fallback, and local favorites (device-specific; documented as such).

## Out of scope for the MVP

User accounts, saved meal history, public posts, uploads, community events ("Fiesta sa Barangay"), payments, paid APIs, and any language-model call. These are future phases and need explicit approval.

## Never fabricated

Prices, photos, recipe sources, reviews, analytics, event attendance, or deployment status.
