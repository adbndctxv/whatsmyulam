// Plain-language labels for the website. Data constants live in
// src/lib/recipes/types.ts; this file only adds display text.

import type { ExclusionTag, RecipeTag } from "../recipes/types.ts";

export const EXCLUSION_LABELS: Record<ExclusionTag, string> = {
  pork: "Pork (baboy)",
  beef: "Beef (baka)",
  chicken: "Chicken (manok)",
  fish: "Fish (isda)",
  shellfish: "Shellfish (hipon, etc.)",
  egg: "Egg (itlog)",
  dairy: "Dairy",
  peanut: "Peanut (mani)",
  soy: "Soy",
  gluten: "Gluten / wheat",
  sesame: "Sesame",
};

export const TAG_LABELS: Record<RecipeTag, { fil: string; en: string }> = {
  maasim: { fil: "Maasim", en: "Sour" },
  maalat: { fil: "Maalat", en: "Salty" },
  matamis: { fil: "Matamis", en: "Sweet" },
  maanghang: { fil: "Maanghang", en: "Spicy" },
  malinamnam: { fil: "Malinamnam", en: "Savory" },
  malutong: { fil: "Malutong", en: "Crispy" },
  "may-sabaw": { fil: "May sabaw", en: "With broth" },
  gata: { fil: "Gata", en: "Coconut milk" },
  creamy: { fil: "Creamy", en: "Creamy" },
  "pang-ulan": { fil: "Pang-ulan", en: "Rainy-day comfort" },
};

export const INGREDIENT_MODE_LABELS = {
  "use-what-i-have": {
    title: "Use what I have",
    description: "Prefer dishes that use my ingredients. Other ingredients are okay.",
  },
  "use-only-what-i-have": {
    title: "Use only what I have",
    description: "Only show dishes I can cook with my ingredients (plus pantry staples if ticked).",
  },
} as const;
