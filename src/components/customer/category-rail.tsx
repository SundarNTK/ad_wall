"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { priceLabel } from "@/lib/client";
import type { PublicAd } from "@/types";

export function CategoryRail({ ads, categoryName }: { ads: PublicAd[]; categoryName: string }) {
  const [index, setIndex] = useState(0);
  if (!ads.length) return null;
  const ad = ads[index % ads.length];
  const place = ad.location?.city || ad.city || "Pondy";

  return (
    <section className="mb-8 grid gap-4 rounded-2xl border bg-card p-4 shadow-soft md:grid-cols-[240px_1fr] md:items-center">
      <Link href={`/ad/${ad.slug}`} className="block overflow-hidden rounded-xl bg-muted">
        {ad.images?.[0]?.url ? (
          <img src={ad.images[0].url} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="grid h-40 place-items-center text-sm text-muted-foreground">No photo</div>
        )}
      </Link>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">Selected category · {categoryName}</p>
        <h2 className="mt-1 text-xl font-semibold">
          <Link href={`/ad/${ad.slug}`} className="hover:text-primary">{ad.title}</Link>
        </h2>
        <p className="mt-1 text-lg font-semibold text-primary">{priceLabel(ad.price, ad.priceType)}</p>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {place}{ad.subCategory?.name ? ` · ${ad.subCategory.name}` : ""}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{(index % ads.length) + 1} of {ads.length} in {categoryName}</span>
          <button type="button" className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold disabled:opacity-40" disabled={ads.length < 2} onClick={() => setIndex((value) => (value - 1 + ads.length) % ads.length)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>
          <button type="button" className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-40" disabled={ads.length < 2} onClick={() => setIndex((value) => (value + 1) % ads.length)}>
            Next ad <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
