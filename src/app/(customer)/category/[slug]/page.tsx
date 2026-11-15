import type { Metadata } from "next";
import Link from "next/link";
import { CategoryRail } from "@/components/customer/category-rail";
import { ListingView } from "@/components/customer/listing-controls";
import { dbConnect } from "@/lib/db";
import { Category, SubCategory } from "@/models/Catalog";
import { cached } from "@/lib/cache";
import { activeLocations, activeSubs, searchAds } from "@/lib/services/listings";
import type { PublicAd } from "@/types";

export const dynamic = "force-dynamic";

function readParams(input: Record<string, string | string[] | undefined>) {
  const output: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) output[key] = Array.isArray(value) ? value[0] || "" : value || "";
  return output;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace(/-/g, " "), alternates: { canonical: `/category/${slug}` } };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const initial = readParams(await searchParams);
  await dbConnect();
  const category = await cached(`cat-active:${slug}`, 60_000, () => Category.findOne({ slug, isActive: true }).lean());
  if (!category) return <p className="p-10 text-center">Category not found.</p>;
  const [result, locations, subs] = await Promise.all([
    searchAds({ ...initial, category: slug, attrs: Object.fromEntries(Object.entries(initial).filter(([key]) => key.startsWith("attr_")).map(([key, value]) => [key.slice(5), value])) }),
    activeLocations(),
    activeSubs(String(category._id)),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-sm text-muted-foreground"><Link href="/">Home</Link> / {category.name}</p>
      <h1 className="mt-2 text-3xl font-semibold">{category.name}</h1>
      <div className="my-4 flex flex-wrap gap-2">{subs.map((sub) => <Link key={sub.slug} className="rounded-full border px-3 py-1 text-sm" href={`/category/${slug}/${sub.slug}`}>{sub.name}</Link>)}</div>
      <CategoryRail ads={result.items as PublicAd[]} categoryName={category.name} />
      <ListingView basePath={`/category/${slug}`} initial={initial} fields={[]} locations={locations.map((item) => ({ slug: item.slug, city: item.city, state: item.state }))} ads={result.items as PublicAd[]} total={result.total} page={result.page} pages={result.pages} />
    </div>
  );
}

