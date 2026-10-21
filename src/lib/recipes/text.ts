// Small text helpers used by search and by the recommendation engine.

// "Adobong Manok!" -> "adobong manok"; "Sinigáng" -> "sinigang"; "may-sabaw" -> "may sabaw"
export function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// True when `term` matches the START of any word in any of the texts.
// "sabaw" matches "may-sabaw" and "sabaw"; "ado" matches "adobo";
// "bo" does not match "adobo" (we do not match the middle of words).
export function textMatches(texts: readonly string[], term: string): boolean {
  const needle = normalizeText(term);
  if (needle.length < 2) return false;
  for (const text of texts) {
    const hay = ` ${normalizeText(text)}`;
    if (hay.includes(` ${needle}`)) return true;
  }
  return false;
}
