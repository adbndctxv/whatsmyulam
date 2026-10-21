import { RECIPES } from "@/data/index.ts";

export function AboutData() {
  const sampleCount = RECIPES.filter((r) => r.publicationStatus === "sample").length;
  return (
    <section id="about" aria-labelledby="about-heading" className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 id="about-heading" className="font-serif text-2xl font-semibold">
          About these recipes
        </h2>
        <ul className="mt-4 flex flex-col gap-3 leading-relaxed text-muted-foreground">
          <li>
            <strong className="text-foreground">All {sampleCount} recipes are sample recipes.</strong> They follow
            common home-cooking methods but have not been kitchen-tested or editorially reviewed, and they do not
            come from a cited source.
          </li>
          <li>
            <strong className="text-foreground">No prices yet.</strong> We do not have verified ingredient prices,
            so every dish says &quot;Cost estimate unavailable&quot; instead of guessing.
          </li>
          <li>
            <strong className="text-foreground">Allergies:</strong> dietary exclusions only check the ingredients
            written in each recipe. They cannot guarantee a dish is free from allergens or cross-contamination.
            Always check product labels.
          </li>
          <li>
            <strong className="text-foreground">No photos, ratings, or nutrition facts</strong> are shown, because
            we do not have properly sourced data for them yet.
          </li>
        </ul>
      </div>
    </section>
  );
}
