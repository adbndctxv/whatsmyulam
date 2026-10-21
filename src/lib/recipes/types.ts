// Shared types and constants for recipes.
//
// Beginner note: this file only describes the *shape* of our data.
// It contains no logic, so it is safe to import from anywhere
// (React components, tests, scripts).

export const MEAL_PERIODS = [
  "breakfast",
  "lunch",
  "dinner",
  "merienda",
  "midnight-snack",
] as const;
export type MealPeriod = (typeof MEAL_PERIODS)[number];

export const MEAL_PERIOD_LABELS: Record<MealPeriod, { en: string; fil: string }> = {
  breakfast: { en: "Breakfast", fil: "Almusal" },
  lunch: { en: "Lunch", fil: "Tanghalian" },
  dinner: { en: "Dinner", fil: "Hapunan" },
  merienda: { en: "Merienda", fil: "Merienda" },
  "midnight-snack": { en: "Midnight snack", fil: "Midnight snack" },
};

export const CATEGORIES = [
  "sabaw", // soups and stews
  "gulay", // vegetable dishes
  "karne", // meat dishes
  "isda", // fish and seafood
  "itlog", // egg dishes
  "pansit", // noodles
  "silog", // rice + egg breakfast plates
  "lugaw", // rice porridge
  "matamis", // sweet snacks and desserts
  "prito", // fried dishes
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, { en: string; fil: string }> = {
  sabaw: { en: "Soup / stew", fil: "Sabaw" },
  gulay: { en: "Vegetables", fil: "Gulay" },
  karne: { en: "Meat", fil: "Karne" },
  isda: { en: "Fish / seafood", fil: "Isda" },
  itlog: { en: "Egg", fil: "Itlog" },
  pansit: { en: "Noodles", fil: "Pansit" },
  silog: { en: "Silog plate", fil: "Silog" },
  lugaw: { en: "Rice porridge", fil: "Lugaw" },
  matamis: { en: "Sweet", fil: "Matamis" },
  prito: { en: "Fried", fil: "Prito" },
};

// Flavor / texture words people use when they "crave" something.
export const RECIPE_TAGS = [
  "maasim", // sour
  "maalat", // salty
  "matamis", // sweet
  "maanghang", // spicy
  "malinamnam", // savory / umami
  "malutong", // crispy
  "may-sabaw", // has broth
  "gata", // coconut milk
  "creamy",
  "pang-ulan", // comfort food for rainy days
] as const;
export type RecipeTag = (typeof RECIPE_TAGS)[number];

// Things a user can exclude. Each ingredient in the catalog lists which of
// these it contains. We only know what is LISTED; cross-contamination cannot
// be verified (see docs/RECIPE_GUIDE.md).
export const EXCLUSION_TAGS = [
  "pork",
  "beef",
  "chicken",
  "fish",
  "shellfish",
  "egg",
  "dairy",
  "peanut",
  "soy",
  "gluten",
  "sesame",
] as const;
export type ExclusionTag = (typeof EXCLUSION_TAGS)[number];

// Convenience preset: no meat, fish or shellfish (eggs and dairy allowed).
export const VEGETARIAN_EXCLUSIONS: readonly ExclusionTag[] = [
  "pork",
  "beef",
  "chicken",
  "fish",
  "shellfish",
];

export const UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "pc",
  "clove",
  "bunch",
  "can",
  "pack",
  "slice",
  "pinch",
] as const;
export type Unit = (typeof UNITS)[number];

// draft     = work in progress, never shown to users
// sample    = illustrative data written for this project, NOT editorially reviewed
// published = reviewed by a named person on a named date
export const PUBLICATION_STATUSES = ["draft", "sample", "published"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export type IngredientDef = {
  id: string; // e.g. "soy-sauce"
  name: string; // display name
  aliases: string[]; // other names people type, e.g. "toyo"
  tags: ExclusionTag[]; // what it contains (conservative)
  pantryStaple?: boolean; // explicitly identified staple (salt, oil, water...)
};

export type RecipeIngredient = {
  ingredientId: string; // must exist in the ingredient catalog
  quantity: number | null; // null only when toTaste is true
  unit: Unit | null; // null only when toTaste is true
  toTaste?: boolean; // "asin at paminta ayon sa panlasa"
  optional?: boolean;
  note?: string; // preparation note, e.g. "cut into serving pieces"
  // "linear" (default): scales exactly with servings.
  // "taste": seasoning-like, scales more gently when servings go up.
  scaling?: "linear" | "taste";
};

export type EstimatedCost = {
  amountPHP: number; // total cost in Philippine pesos...
  forServings: number; // ...for this many servings
  source: string; // where the prices came from
  checkedAt: string; // YYYY-MM-DD
  location?: string; // e.g. "Meycauayan public market"
};

export type RecipeReview = {
  reviewedBy: string;
  reviewedAt: string; // YYYY-MM-DD
};

export type Recipe = {
  id: string;
  name: string;
  slug: string;
  aliases?: string[]; // e.g. "adobo", "chicken adobo"
  description: string;
  baseServings: number;
  prepMinutes: number;
  cookMinutes: number;
  restMinutes?: number; // marinating / soaking, not active time
  mealPeriods: MealPeriod[];
  categories: Category[];
  tags: RecipeTag[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  imageUrl: string | null;
  imageCredit: string | null; // required when imageUrl is set
  sourceUrl: string | null;
  sourceAttribution: string;
  estimatedCost: EstimatedCost | null;
  publicationStatus: PublicationStatus;
  review: RecipeReview | null; // required when published
};
