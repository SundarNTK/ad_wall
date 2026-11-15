import { Footer, Header } from "@/components/customer/shell";
import { NavProgress } from "@/components/customer/nav-progress";
import { activeCategories, activeLocations, getSettings } from "@/lib/services/listings";

export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  let siteName = "AdWall";
  let categories: { name: string; slug: string }[] = [];
  let locations: { slug: string; city: string }[] = [];
  try {
    const [settings, rows, places] = await Promise.all([getSettings(), activeCategories(), activeLocations()]);
    siteName = settings.siteName || siteName;
    if (siteName.toLowerCase() === "classinest") siteName = "AdWall";
    categories = rows.map((row) => ({ name: row.name, slug: row.slug }));
    locations = places.map((place) => ({ slug: place.slug, city: place.city }));
  } catch {
    siteName = "AdWall";
  }
  return (
    <div>
      <NavProgress />
      <Header siteName={siteName} categories={categories} locations={locations} />
      <main>{children}</main>
      <Footer siteName={siteName} />
    </div>
  );
}
