"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { priceLabel, when } from "@/lib/client";
import type { PublicAd } from "@/types";

export function AdCard({ ad, index = 0 }: { ad: PublicAd; index?: number }) {
  const image = ad.images?.[0]?.url;
  return (
    <motion.article initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(index, 8) * 0.04 }} whileHover={{ y: -4 }} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
      <Link href={`/ad/${ad.slug}`} className="block">
        <div className="relative h-48 bg-muted">
          {image ? <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-muted-foreground">No photo</div>}
          {ad.isFeatured && <span className="absolute left-3 top-3 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">Featured</span>}
        </div>
        <div className="space-y-2 p-4">
          <p className="text-lg font-semibold text-primary">{priceLabel(ad.price, ad.priceType)}</p>
          <h3 className="line-clamp-2 font-medium">{ad.title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {ad.location ? `${ad.location.city}, ${ad.location.state}` : ad.city}</p>
          <p className="text-xs text-muted-foreground">{when(ad.createdAt)} · {ad.views || 0} views</p>
        </div>
      </Link>
    </motion.article>
  );
}

export function AdGrid({ ads, view = "grid" }: { ads: PublicAd[]; view?: "grid" | "list" }) {
  if (!ads.length) {
    return (
      <div className="rounded-2xl border border-dashed bg-card px-6 py-16 text-center">
        <h3 className="text-xl font-semibold">No ads match yet</h3>
        <p className="mt-2 text-muted-foreground">Try a wider location, fewer filters, or check back soon.</p>
      </div>
    );
  }
  return (
    <div className={view === "list" ? "grid gap-3" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
      {ads.map((ad, index) => <AdCard key={ad.id} ad={ad} index={index} />)}
    </div>
  );
}
