// Recent suggestions vs. meals people actually cooked.
//
// These are two DIFFERENT things and are kept in two different lists:
//
//   SuggestionHistory - dishes the app showed. Used to avoid repeats.
//                       A suggestion is NOT a confirmed meal.
//   CookedHistory     - dishes the user said they really cooked.
//                       Only the user can add to this list.
//
// This file only holds pure helpers. Where the lists are stored (browser
// storage now, a database later) is decided elsewhere.

export type SuggestionHistoryEntry = { recipeId: string; suggestedAt: string }; // ISO date-time
export type CookedHistoryEntry = { recipeId: string; cookedAt: string }; // ISO date-time

// Newest first, no duplicates, capped at `max` items.
export function pushRecentId(recentIds: readonly string[], recipeId: string, max = 10): string[] {
  const without = recentIds.filter((id) => id !== recipeId);
  return [recipeId, ...without].slice(0, Math.max(1, max));
}
