"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "@/components/shared/feedback";
import { ChevronLeft, ChevronRight, Flag, Heart, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { api, priceLabel, when } from "@/lib/client";
import { AdCard } from "@/components/customer/ad-card";
import type { PublicAd } from "@/types";

const MapView = dynamic(() => import("@/components/shared/map-view").then((mod) => mod.MapView), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-2xl bg-muted" /> });

export function AdExperience({ ad, similar, saved, neighbors }: { ad: PublicAd; similar: PublicAd[]; saved: boolean; neighbors?: { next: { slug: string; title: string } | null; prev: { slug: string; title: string } | null } }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [favorite, setFavorite] = useState(saved);
  const [reportOpen, setReportOpen] = useState(false);
  const [types, setTypes] = useState<{ key: string; label: string }[]>([]);
  const images = ad.images?.length ? ad.images : [];

  useEffect(() => {
    api("/api/view/" + ad.slug, { method: "POST" });
    api<{ reportTypes: { key: string; label: string }[] }>("/api/meta").then((result) => setTypes(result.data?.reportTypes || []));
  }, [ad.slug]);

  async function sendReport(formData: FormData) {
    const result = await api(`/api/ads/${ad.id}/report`, {
      method: "POST",
      body: JSON.stringify({ type: formData.get("type"), email: formData.get("email"), comment: formData.get("comment"), url: window.location.href, website: formData.get("website") }),
    });
    if (!result.success) toast.error(result.message);
    else {
      toast.success(result.message);
      setReportOpen(false);
    }
  }

  async function toggleFavorite() {
    const result = await api<{ saved: boolean }>(`/api/ads/${ad.id}/favorite`, { method: "POST" });
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    setFavorite(Boolean(result.data?.saved));
    toast.quiet(result.message);
  }

  async function share(kind: "copy" | "whatsapp" | "facebook") {
    const url = window.location.href;
    if (kind === "copy") {
      await navigator.clipboard.writeText(url);
      toast.quiet("Link copied");
    } else if (kind === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(ad.title + " " + url)}`, "_blank");
    else window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1fr_340px]">
      <div>
        <p className="text-sm text-muted-foreground"><Link href="/">Home</Link> / <Link href={`/category/${ad.category?.slug}`}>{ad.category?.name}</Link> / {ad.subCategory?.name}</p>
        {(neighbors?.prev || neighbors?.next) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {neighbors.prev ? (
              <Link href={`/ad/${neighbors.prev.slug}`} className="inline-flex max-w-[46%] items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-semibold">
                <ChevronLeft className="h-4 w-4 shrink-0" /> <span className="truncate">Previous in {ad.category?.name}</span>
              </Link>
            ) : <span />}
            {neighbors.next ? (
              <Link href={`/ad/${neighbors.next.slug}`} className="inline-flex max-w-[46%] items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">
                <span className="truncate">Next in {ad.category?.name}</span> <ChevronRight className="h-4 w-4 shrink-0" />
              </Link>
            ) : <span />}
          </div>
        )}
        <div className="mt-4 overflow-hidden rounded-2xl bg-muted">
          {images[index] ? <img src={images[index].url} alt="" className="max-h-[520px] w-full cursor-zoom-in object-cover" onClick={() => setLightbox(true)} /> : <div className="grid h-72 place-items-center">No photo</div>}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((image, imageIndex) => (
            <button key={image.url} onClick={() => setIndex(imageIndex)} className={`h-16 w-20 overflow-hidden rounded-xl border ${imageIndex === index ? "ring-2 ring-primary" : ""}`}>
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            {ad.isFeatured && <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">Featured</span>}
            <h1 className="text-3xl font-semibold">{ad.title}</h1>
            <p className="mt-2 text-2xl font-semibold text-primary">{priceLabel(ad.price, ad.priceType)}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleFavorite} className="rounded-full border p-2" aria-label="Save favorite"><Heart className={favorite ? "fill-rose-500 text-rose-500" : ""} /></button>
            <button onClick={() => share("copy")} className="rounded-full border p-2" aria-label="Share"><Share2 /></button>
            <button onClick={() => setReportOpen(true)} className="rounded-full border p-2" aria-label="Report this ad"><Flag /></button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button className="rounded-full border px-3 py-1" onClick={() => share("whatsapp")}>WhatsApp</button>
          <button className="rounded-full border px-3 py-1" onClick={() => share("facebook")}>Facebook</button>
        </div>
        <dl className="mt-6 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div>Location: {ad.location ? `${ad.location.city}, ${ad.location.state}` : ad.city}</div>
          <div>Posted {when(ad.createdAt)}</div>
          <div>Updated {when(ad.updatedAt)}</div>
          <div>Expires {when(ad.expiresAt)}</div>
          <div>Ad #{ad.adNumber}</div>
          <div>{ad.views || 0} views</div>
        </dl>
        {typeof ad.lat === "number" && typeof ad.lng === "number" && (
          <section className="mt-6">
            <h2 className="mb-3 text-lg font-semibold">Location on map</h2>
            <MapView lat={ad.lat} lng={ad.lng} className="h-72" />
          </section>
        )}
        {ad.attributes && Object.keys(ad.attributes).length > 0 && (
          <table className="mt-6 w-full overflow-hidden rounded-2xl border text-sm">
            <tbody>
              {Object.entries(ad.attributes).map(([key, value]) => (
                <tr key={key} className="border-t"><th className="bg-muted px-4 py-2 text-left font-medium capitalize">{key}</th><td className="px-4 py-2">{String(value)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-6 whitespace-pre-wrap leading-7">{ad.description}</p>
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Avoid scams: meet in public, inspect items first, and never send wire transfers or gift cards to someone you have not met.
        </div>
        {similar.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-semibold">Similar ads</h2>
            <div className="grid gap-4 sm:grid-cols-2">{similar.map((item) => <AdCard key={item.id} ad={item} />)}</div>
          </div>
        )}
      </div>
      <aside className="h-fit rounded-2xl border bg-card p-5 shadow-soft lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold">Contact details</h2>
        <p className="mt-1 text-sm text-muted-foreground">{ad.contactName}{ad.isPrivateSeller ? " · Private seller" : ""}</p>
        <ul className="mt-4 space-y-3 text-sm">
          {ad.contactEmail && (
            <li><a href={`mailto:${ad.contactEmail}?subject=${encodeURIComponent("Enquiry: " + ad.title)}`} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 font-medium hover:bg-muted"><Mail className="h-4 w-4 shrink-0 text-primary" /><span className="break-all">{ad.contactEmail}</span></a></li>
          )}
          {ad.showPhone && ad.contactPhone && (
            <li><a href={`tel:${ad.contactPhone}`} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 font-medium hover:bg-muted"><Phone className="h-4 w-4 shrink-0 text-primary" />{ad.contactPhone}</a></li>
          )}
          <li className="flex items-center gap-3 rounded-xl border px-3 py-2.5"><MapPin className="h-4 w-4 shrink-0 text-primary" />{ad.location ? `${ad.location.city}, ${ad.location.state}` : ad.city}</li>
        </ul>
      </aside>
      {lightbox && images[index] && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6" onClick={() => setLightbox(false)}>
          <img src={images[index].url} alt="" className="max-h-[90vh] max-w-5xl rounded-2xl object-contain" />
        </motion.div>
      )}
      {reportOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={() => setReportOpen(false)}>
          <form action={sendReport} className="w-full max-w-md space-y-3 rounded-2xl bg-card p-5" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-lg font-semibold">Report this ad</h2>
            <input name="website" tabIndex={-1} autoComplete="off" className="absolute -left-[9999px]" aria-hidden />
            <select name="type" className="w-full rounded-xl border bg-background px-3 py-2" required>
              {types.map((type) => <option key={type.key} value={type.key}>{type.label}</option>)}
            </select>
            <input name="email" type="email" required placeholder="Your email" className="w-full rounded-xl border bg-background px-3 py-2" />
            <textarea name="comment" placeholder="What should we know?" className="min-h-24 w-full rounded-xl border bg-background px-3 py-2" />
            <button className="w-full rounded-full bg-primary py-2 text-sm font-semibold text-primary-foreground">Submit report</button>
          </form>
        </div>
      )}
    </div>
  );
}
