import { AboutData } from "@/components/about-data";
import { Generator } from "@/components/generator";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <Generator />
        <AboutData />
      </main>
      <SiteFooter />
    </>
  );
}
