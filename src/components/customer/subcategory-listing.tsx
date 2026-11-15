import Link from "next/link";
import { CategoryRail } from "@/components/customer/category-rail";
import { ListingView } from "@/components/customer/listing-controls";
import { dbConnect } from "@/lib/db";
import { Category, SubCategory } from "@/models/Catalog";
import { cached } from "@/lib/cache";
import { activeLocations, searchAds } from "@/lib/services/listings";
import type { FieldDef, PublicAd } from "@/types";

export async function SubcategoryListing({ categorySlug, subSlug, initial }: { categorySlug: string; subSlug: string; initial: Record<string, string> }) {
  await dbConnect();
  const category = await cached(`cat-slug:${categorySlug}`, 60_000, () => Category.findOne({ slug: categorySlug }).lean());
  const sub = category ? await cached(`sub-slug:${category._id}:${subSlug}`, 60_000, () => SubCategory.findOne({ category: category._id, slug: subSlug }).lean()) : null;
  const [result, locations] = await Promise.all([
    searchAds({
      ...initial,
      category: categorySlug,
      sub: subSlug,
      attrs: Object.fromEntries(Object.entries(initial).filter(([key]) => key.startsWith("attr_")).map(([key, value]) => [key.slice(5), value])),
    }),
    activeLocations(),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-sm text-muted-foreground">
        <Link href="/">Home</Link> / <Link href={`/category/${categorySlug}`}>{category?.name}</Link> / {sub?.name}
      </p>
      <h1 className="mt-2 text-3xl font-semibold">{sub?.name || "Listings"}</h1>
      <div className="mt-6">
        <CategoryRail ads={result.items as PublicAd[]} categoryName={sub?.name || category?.name || "this category"} />
        <ListingView
          basePath={`/category/${categorySlug}/${subSlug}`}
          initial={initial}
          fields={(sub?.fields || []) as FieldDef[]}
          locations={locations.map((item) => ({ slug: item.slug, city: item.city, state: item.state }))}
          ads={result.items as PublicAd[]}
          total={result.total}
          page={result.page}
          pages={result.pages}
        />
      </div>
    </div>
  );
}
