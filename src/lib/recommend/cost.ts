// Cost estimates.
//
// We NEVER invent prices. A recipe either carries a cost record (with its
// source and the date it was checked) or it has none, and then the honest
// answer is "Cost estimate unavailable".

import type { EstimatedCost, Recipe } from "../recipes/types.ts";

export type CostEstimate =
  | {
      status: "known";
      totalPHP: number; // estimated total for the requested servings
      perServingPHP: number;
      basis: EstimatedCost; // where the number came from
    }
  | { status: "unavailable" };

function twoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function estimateCost(recipe: Recipe, servings: number): CostEstimate {
  const cost = recipe.estimatedCost;
  if (!cost) return { status: "unavailable" };
  const perServing = cost.amountPHP / cost.forServings;
  return {
    status: "known",
    totalPHP: twoDecimals(perServing * servings),
    perServingPHP: twoDecimals(perServing),
    basis: cost,
  };
}

// Text for the UI. Always labelled as an estimate, never a guaranteed price.
export function describeCost(cost: CostEstimate): string {
  if (cost.status === "unavailable") return "Cost estimate unavailable";
  return `Estimated cost: about PHP ${cost.totalPHP.toFixed(2)} (checked ${cost.basis.checkedAt})`;
}
