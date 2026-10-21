// The ingredient catalog.
//
// Every ingredient used by a recipe MUST be listed here. The `tags` say which
// exclusion groups an ingredient contains, and the app uses them to honor
// dietary exclusions. We are deliberately CONSERVATIVE: when a common
// store-bought version may contain an allergen (for example soy sauce and
// wheat, or canton noodles and egg), we list it.
//
// Tags describe the ingredient as commonly sold. They cannot capture
// brand-specific formulas or cross-contamination. Always tell users to check
// product labels.

import type { IngredientDef } from "../lib/recipes/types.ts";

export const INGREDIENTS: IngredientDef[] = [
  // --- Meat, fish, eggs ---
  { id: "chicken", name: "Chicken", aliases: ["manok", "chicken pieces"], tags: ["chicken"] },
  { id: "pork-belly", name: "Pork belly", aliases: ["liempo", "baboy"], tags: ["pork"] },
  { id: "pork-shoulder", name: "Pork shoulder", aliases: ["kasim", "pigue"], tags: ["pork"] },
  { id: "pork-ribs", name: "Pork ribs", aliases: ["buto-buto", "spareribs"], tags: ["pork"] },
  { id: "pork-liver", name: "Pork liver", aliases: ["atay"], tags: ["pork"] },
  { id: "ground-pork", name: "Ground pork", aliases: ["giniling na baboy", "giniling"], tags: ["pork"] },
  { id: "longganisa", name: "Longganisa", aliases: ["longanisa", "sausage"], tags: ["pork"] },
  { id: "beef-sirloin", name: "Beef sirloin (thinly sliced)", aliases: ["baka", "beef", "sirloin"], tags: ["beef"] },
  { id: "corned-beef", name: "Corned beef (canned)", aliases: ["corned beef"], tags: ["beef"] },
  { id: "bangus", name: "Bangus (milkfish)", aliases: ["milkfish"], tags: ["fish"] },
  { id: "tilapia", name: "Tilapia", aliases: [], tags: ["fish"] },
  { id: "shrimp", name: "Shrimp", aliases: ["hipon"], tags: ["shellfish"] },
  { id: "egg", name: "Egg", aliases: ["itlog", "eggs"], tags: ["egg"] },

  // --- Vegetables and fruit ---
  { id: "onion", name: "Onion", aliases: ["sibuyas", "red onion"], tags: [] },
  { id: "garlic", name: "Garlic", aliases: ["bawang"], tags: [] },
  { id: "ginger", name: "Ginger", aliases: ["luya"], tags: [] },
  { id: "tomato", name: "Tomato", aliases: ["kamatis"], tags: [] },
  { id: "potato", name: "Potato", aliases: ["patatas"], tags: [] },
  { id: "carrot", name: "Carrot", aliases: ["karot"], tags: [] },
  { id: "bell-pepper", name: "Bell pepper", aliases: ["pepper"], tags: [] },
  { id: "sayote", name: "Sayote (chayote)", aliases: ["chayote"], tags: [] },
  { id: "kangkong", name: "Kangkong (water spinach)", aliases: ["water spinach"], tags: [] },
  { id: "sitaw", name: "Sitaw (long beans)", aliases: ["long beans", "string beans"], tags: [] },
  { id: "kalabasa", name: "Kalabasa (squash)", aliases: ["squash", "pumpkin"], tags: [] },
  { id: "talong", name: "Talong (eggplant)", aliases: ["eggplant"], tags: [] },
  { id: "ampalaya", name: "Ampalaya (bitter melon)", aliases: ["bitter melon", "bitter gourd"], tags: [] },
  { id: "okra", name: "Okra", aliases: [], tags: [] },
  { id: "labanos", name: "Labanos (radish)", aliases: ["radish", "daikon"], tags: [] },
  { id: "siling-haba", name: "Siling haba (long green chili)", aliases: ["long chili", "sili"], tags: [] },
  { id: "pechay", name: "Pechay", aliases: ["bok choy", "pak choi"], tags: [] },
  { id: "repolyo", name: "Repolyo (cabbage)", aliases: ["cabbage"], tags: [] },
  { id: "green-papaya", name: "Green papaya", aliases: ["papaya", "hilaw na papaya"], tags: [] },
  { id: "chili-leaves", name: "Chili leaves", aliases: ["dahon ng sili", "sili leaves"], tags: [] },
  { id: "malunggay-leaves", name: "Malunggay leaves", aliases: ["malunggay", "moringa"], tags: [] },
  { id: "corn", name: "Corn on the cob", aliases: ["mais", "sweet corn"], tags: [] },
  { id: "spring-onion", name: "Spring onion", aliases: ["onion leeks", "scallion", "dahon ng sibuyas"], tags: [] },
  { id: "calamansi", name: "Calamansi", aliases: ["kalamansi"], tags: [] },
  { id: "tamarind", name: "Tamarind (sampalok)", aliases: ["sampalok"], tags: [] },
  { id: "saba", name: "Saba banana", aliases: ["saging na saba", "saging", "banana"], tags: [] },
  { id: "kamote", name: "Kamote (sweet potato)", aliases: ["sweet potato"], tags: [] },
  { id: "langka", name: "Langka (ripe jackfruit)", aliases: ["jackfruit"], tags: [] },
  { id: "grated-coconut", name: "Grated coconut", aliases: ["niyog", "buko"], tags: [] },

  // --- Rice, noodles, flour, grains ---
  { id: "rice", name: "Uncooked rice", aliases: ["bigas"], tags: [] },
  { id: "cooked-rice", name: "Cooked rice", aliases: ["kanin", "sinangag rice"], tags: [] },
  { id: "glutinous-rice", name: "Glutinous rice (malagkit)", aliases: ["malagkit", "sticky rice"], tags: [] },
  { id: "glutinous-rice-flour", name: "Glutinous rice flour", aliases: ["malagkit flour", "galapong"], tags: [] },
  { id: "rice-flour", name: "Rice flour", aliases: [], tags: [] },
  { id: "bihon-noodles", name: "Bihon (rice vermicelli)", aliases: ["bihon", "rice noodles"], tags: [] },
  // Flour noodles may contain egg, so both tags are listed.
  { id: "canton-noodles", name: "Canton noodles (flour sticks)", aliases: ["canton", "egg noodles"], tags: ["gluten", "egg"] },
  { id: "elbow-macaroni", name: "Elbow macaroni", aliases: ["macaroni", "pasta"], tags: ["gluten"] },
  // Wrappers are wheat-based and may contain egg.
  { id: "lumpia-wrapper", name: "Lumpia wrapper", aliases: ["spring roll wrapper"], tags: ["gluten", "egg"] },
  { id: "mung-beans", name: "Mung beans (monggo)", aliases: ["monggo", "munggo"], tags: [] },
  { id: "sago", name: "Sago (tapioca pearls)", aliases: ["tapioca pearls"], tags: [] },
  { id: "baking-powder", name: "Baking powder", aliases: [], tags: [] },

  // --- Sauces and seasonings ---
  { id: "soy-sauce", name: "Soy sauce", aliases: ["toyo"], tags: ["soy", "gluten"] },
  { id: "vinegar", name: "Cane vinegar", aliases: ["suka", "vinegar"], tags: [] },
  { id: "fish-sauce", name: "Fish sauce", aliases: ["patis"], tags: ["fish"] },
  { id: "oyster-sauce", name: "Oyster sauce", aliases: [], tags: ["shellfish", "soy", "gluten"] },
  { id: "bagoong-isda", name: "Bagoong isda (fermented fish paste)", aliases: ["bagoong"], tags: ["fish"] },
  { id: "tomato-sauce", name: "Tomato sauce", aliases: [], tags: [] },
  { id: "bay-leaf", name: "Bay leaf", aliases: ["laurel", "dahon ng laurel"], tags: [] },
  { id: "peppercorn", name: "Whole peppercorns", aliases: ["pamintang buo"], tags: [] },
  { id: "sesame-seeds", name: "Sesame seeds", aliases: ["linga"], tags: ["sesame"] },

  // --- Dairy, coconut, sweeteners, chocolate ---
  { id: "coconut-milk", name: "Coconut milk", aliases: ["gata"], tags: [] },
  { id: "evaporated-milk", name: "Evaporated milk", aliases: ["gatas"], tags: ["dairy"] },
  { id: "butter", name: "Butter", aliases: ["mantikilya"], tags: ["dairy"] },
  { id: "cheese", name: "Cheese", aliases: ["keso"], tags: ["dairy"] },
  { id: "brown-sugar", name: "Brown sugar", aliases: ["muscovado", "asukal na pula"], tags: [] },
  { id: "tablea", name: "Tablea (cacao tablets)", aliases: ["tsokolate", "cacao"], tags: [] },

  // --- Pantry staples (explicitly identified; users may assume they have these) ---
  { id: "salt", name: "Salt", aliases: ["asin"], tags: [], pantryStaple: true },
  { id: "black-pepper", name: "Ground black pepper", aliases: ["paminta", "pepper powder"], tags: [], pantryStaple: true },
  { id: "sugar", name: "White sugar", aliases: ["asukal"], tags: [], pantryStaple: true },
  { id: "cooking-oil", name: "Cooking oil", aliases: ["mantika", "oil"], tags: [], pantryStaple: true },
  { id: "water", name: "Water", aliases: ["tubig"], tags: [], pantryStaple: true },
];
