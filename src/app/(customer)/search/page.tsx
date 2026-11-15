import type { Metadata } from "next";
import Link from "next/link";
import { ListingView } from "@/components/customer/listing-controls";
import { SaveSearch } from "@/components/customer/save-search";
import { dbConnect } from "@/lib/db";
import { Location } from "@/models/Catalog";
import { searchAds } from "@/lib/services/listings";
import type { PublicAd } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search", alternates: { canonical: "/search" } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const initial: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) initial[key] = Array.isArray(value) ? value[0] || "" : value || "";
  await dbConnect();
  const [result, locations] = await Promise.all([
    searchAds({ ...initial, attrs: Object.fromEntries(Object.entries(initial).filter(([key]) => key.startsWith("attr_")).map(([key, value]) => [key.slice(5), value])) }),
    Location.find({ isActive: true }).sort({ city: 1 }).lean(),
  ]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <p className="text-sm text-muted-foreground"><Link href="/">Home</Link> / Search</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{initial.q ? `Results for “${initial.q}”` : "All listings"}</h1>
        <SaveSearch query={initial} />
      </div>
      <div className="mt-6">
        <ListingView basePath="/search" initial={initial} fields={[]} locations={locations.map((item) => ({ slug: item.slug, city: item.city, state: item.state }))} ads={result.items as PublicAd[]} total={result.total} page={result.page} pages={result.pages} />
      </div>
    </div>
  );
}
