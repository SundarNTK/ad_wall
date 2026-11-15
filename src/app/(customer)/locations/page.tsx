import type { Metadata } from "next";
import { dbConnect } from "@/lib/db";
import { Location } from "@/models/Catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Locations", alternates: { canonical: "/locations" } };

export default async function LocationsPage() {
  let groups: Record<string, { city: string; slug: string }[]> = {};
  try {
    await dbConnect();
    const rows = await Location.find({ isActive: true }).sort({ state: 1, city: 1 }).lean();
    groups = rows.reduce<Record<string, { city: string; slug: string }[]>>((all, row) => {
      all[row.state] = all[row.state] || [];
      all[row.state].push({ city: row.city, slug: row.slug });
      return all;
    }, {});
  } catch {
    groups = {};
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Locations</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {Object.entries(groups).map(([state, cities]) => (
          <section key={state}>
            <h2 className="font-semibold">{state}</h2>
            <div className="mt-2 flex flex-wrap gap-2">{cities.map((city) => <a key={city.slug} href={`/search?loc=${city.slug}`} className="rounded-full border px-3 py-1 text-sm">{city.city}</a>)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
