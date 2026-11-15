"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { AdGrid } from "@/components/customer/ad-card";
import type { FieldDef, PublicAd } from "@/types";

type LocationOption = { slug: string; city: string; state: string };

export function ListingView({
  basePath,
  initial,
  fields,
  locations,
  ads,
  total,
  page,
  pages,
}: {
  basePath: string;
  initial: Record<string, string>;
  fields: FieldDef[];
  locations: LocationOption[];
  ads: PublicAd[];
  total: number;
  page: number;
  pages: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  function go(next: Record<string, string>, resetPage = true) {
    const params = new URLSearchParams(initial);
    Object.entries(next).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
    if (resetPage) params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  const form = (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const next: Record<string, string> = {};
      data.forEach((value, key) => { next[key] = String(value); });
      if (!data.get("seller")) next.seller = "";
      go(next);
      setOpen(false);
    }}>
      <label className="block text-sm font-medium">Minimum price<input name="minPrice" defaultValue={initial.minPrice || ""} className="mt-1 w-full rounded-xl border bg-background px-3 py-2" /></label>
      <label className="block text-sm font-medium">Maximum price<input name="maxPrice" defaultValue={initial.maxPrice || ""} className="mt-1 w-full rounded-xl border bg-background px-3 py-2" /></label>
      <label className="block text-sm font-medium">Location
        <select name="loc" defaultValue={initial.loc || ""} className="mt-1 w-full rounded-xl border bg-background px-3 py-2">
          <option value="">Anywhere</option>
          {locations.map((location) => <option key={location.slug} value={location.slug}>{location.city}, {location.state}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="seller" value="private" defaultChecked={initial.seller === "private"} /> Private sellers only</label>
      <label className="block text-sm font-medium">Posted within
        <select name="posted" defaultValue={initial.posted || ""} className="mt-1 w-full rounded-xl border bg-background px-3 py-2">
          <option value="">Any time</option>
          <option value="1">24 hours</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
        </select>
      </label>
      {fields.filter((field) => field.filterable).map((field) => field.type === "number" ? (
        <div key={field.key} className="grid grid-cols-2 gap-2">
          <label className="text-sm font-medium">{field.label} min<input name={`attr_${field.key}_min`} defaultValue={initial[`attr_${field.key}_min`] || ""} className="mt-1 w-full rounded-xl border bg-background px-3 py-2" /></label>
          <label className="text-sm font-medium">max<input name={`attr_${field.key}_max`} defaultValue={initial[`attr_${field.key}_max`] || ""} className="mt-1 w-full rounded-xl border bg-background px-3 py-2" /></label>
        </div>
      ) : field.type === "select" ? (
        <label key={field.key} className="block text-sm font-medium">{field.label}
          <select name={`attr_${field.key}`} defaultValue={initial[`attr_${field.key}`] || ""} className="mt-1 w-full rounded-xl border bg-background px-3 py-2">
            <option value="">Any</option>
            {(field.options || []).map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      ) : (
        <label key={field.key} className="block text-sm font-medium">{field.label}
          <input name={`attr_${field.key}`} defaultValue={initial[`attr_${field.key}`] || ""} className="mt-1 w-full rounded-xl border bg-background px-3 py-2" />
        </label>
      ))}
      <button className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground">Apply filters</button>
    </form>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="sticky top-28 hidden rounded-2xl border bg-card p-4 shadow-soft lg:block">{form}</aside>
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{total} result{total === 1 ? "" : "s"}</p>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm lg:hidden" onClick={() => setOpen(true)}><SlidersHorizontal className="h-4 w-4" /> Filters</button>
            <select aria-label="Sort" className="rounded-full border bg-card px-3 py-2 text-sm" value={initial.sort || "newest"} onChange={(event) => go({ sort: event.target.value })}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
            <div className="rounded-full border p-1 text-sm">
              <button className={`rounded-full px-3 py-1 ${view === "grid" ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setView("grid")}>Grid</button>
              <button className={`rounded-full px-3 py-1 ${view === "list" ? "bg-primary text-primary-foreground" : ""}`} onClick={() => setView("list")}>List</button>
            </div>
          </div>
        </div>
        <AdGrid ads={ads} view={view} />
        <nav className="mt-6 flex flex-wrap items-center gap-2" aria-label="Pagination">
          {Array.from({ length: Math.min(pages, 8) }).map((_, index) => {
            const number = index + 1;
            const params = new URLSearchParams({ ...initial, page: String(number) });
            return <a key={number} href={`${basePath}?${params.toString()}`} className={`rounded-full px-3 py-1 text-sm ${number === page ? "bg-primary text-primary-foreground" : "border"}`}>{number}</a>;
          })}
          {page < pages && <a className="rounded-full border px-3 py-1 text-sm" href={`${basePath}?${new URLSearchParams({ ...initial, page: String(page + 1) }).toString()}`}>Next</a>}
        </nav>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-card p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Filters</h2><button onClick={() => setOpen(false)}>Close</button></div>
            {form}
          </div>
        </div>
      )}
    </div>
  );
}
