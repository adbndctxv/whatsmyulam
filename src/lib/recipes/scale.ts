// Scaling ingredient quantities for a different number of servings.
//
// Basic rule (from the product spec):
//   adjusted quantity = original quantity x requested servings / base servings
//
// Practical judgment: seasonings ("taste" scaling) do not really double when a
// recipe doubles, so when scaling UP we add only 75% of the extra amount.
// Scaling down stays proportional. Every scaled amount is an ESTIMATE, and the
// result says so via `approximate`.

import type { Recipe, RecipeIngredient, Unit } from "./types.ts";
import { MAX_BASE_SERVINGS } from "./validate.ts";

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = MAX_BASE_SERVINGS;
const TASTE_SCALING_FACTOR = 0.75;

export type ScaledIngredient = {
  ingredientId: string;
  quantity: number | null; // null for "to taste"
  unit: Unit | null;
  display: string; // e.g. "1 1/2 cup", "to taste"
  approximate: boolean; // true whenever servings differ from the base recipe
  optional: boolean;
  toTaste: boolean;
  note?: string;
};

// Accepts a number or a numeric string and returns a valid serving count, or null.
export function parseServings(raw: unknown): number | null {
  const value = typeof raw === "string" && raw.trim() !== "" ? Number(raw) : raw;
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < MIN_SERVINGS || value > MAX_SERVINGS) return null;
  return value;
}

export function scaleQuantity(
  quantity: number,
  baseServings: number,
  requestedServings: number,
  scaling: "linear" | "taste" = "linear",
): number {
  const ratio = requestedServings / baseServings;
  if (scaling === "taste" && ratio > 1) {
    return quantity * (1 + (ratio - 1) * TASTE_SCALING_FACTOR);
  }
  return quantity * ratio;
}

// Rounds to a nearest step: roundTo(1.37, 0.25) -> 1.25
function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

// 1.5 -> "1 1/2", 0.25 -> "1/4", 2 -> "2"
function toFractionString(value: number): string {
  const whole = Math.floor(value + 1e-9);
  const fraction = Math.round((value - whole) * 4);
  const glyphs = ["", "1/4", "1/2", "3/4"];
  if (fraction === 4) return String(whole + 1);
  if (fraction === 0) return String(whole);
  return whole === 0 ? glyphs[fraction] : `${whole} ${glyphs[fraction]}`;
}

function trimNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

// Rounds a quantity to something a person can actually measure.
export function roundForKitchen(quantity: number, unit: Unit): number {
  switch (unit) {
    case "tsp":
    case "tbsp":
    case "cup":
      return Math.max(0.25, roundTo(quantity, 0.25));
    case "pc":
    case "clove":
    case "bunch":
    case "can":
    case "pack":
    case "slice":
      return quantity <= 4 ? Math.max(0.5, roundTo(quantity, 0.5)) : Math.round(quantity);
    case "pinch":
      return Math.max(1, Math.round(quantity));
    case "g":
    case "ml":
      if (quantity < 10) return Math.max(1, Math.round(quantity));
      if (quantity < 100) return roundTo(quantity, 5);
      return roundTo(quantity, 10);
    case "kg":
    case "l":
      return Math.max(0.05, roundTo(quantity, 0.05));
  }
}

export function formatQuantity(quantity: number, unit: Unit): string {
  const rounded = roundForKitchen(quantity, unit);
  const fractional = unit === "tsp" || unit === "tbsp" || unit === "cup" || unit === "pc" || unit === "clove" || unit === "bunch" || unit === "can" || unit === "pack" || unit === "slice";
  const text = fractional ? toFractionString(rounded) : trimNumber(rounded);
  return `${text} ${unit}`;
}

export function scaleIngredient(
  ingredient: RecipeIngredient,
  baseServings: number,
  requestedServings: number,
): ScaledIngredient {
  const base = {
    ingredientId: ingredient.ingredientId,
    optional: ingredient.optional === true,
    note: ingredient.note,
  };
  if (ingredient.toTaste || ingredient.quantity === null || ingredient.unit === null) {
    // We never invent a quantity for "to taste" ingredients.
    return { ...base, quantity: null, unit: null, display: "to taste", approximate: false, toTaste: true };
  }
  const scaled = scaleQuantity(ingredient.quantity, baseServings, requestedServings, ingredient.scaling ?? "linear");
  const quantity = roundForKitchen(scaled, ingredient.unit);
  return {
    ...base,
    quantity,
    unit: ingredient.unit,
    display: formatQuantity(scaled, ingredient.unit),
    approximate: requestedServings !== baseServings,
    toTaste: false,
  };
}

// Scales every ingredient of a recipe. Throws on an invalid serving count so
// that bugs are loud; use parseServings first when the value comes from a user.
export function scaleRecipe(recipe: Recipe, requestedServings: number): ScaledIngredient[] {
  if (parseServings(requestedServings) === null) {
    throw new RangeError(`Servings must be a whole number from ${MIN_SERVINGS} to ${MAX_SERVINGS}.`);
  }
  return recipe.ingredients.map((ing) => scaleIngredient(ing, recipe.baseServings, requestedServings));
}
