import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdExperience } from "@/components/customer/ad-experience";
import { getSession } from "@/lib/auth";
import { appUrl } from "@/lib/utils";
import { adjacentInCategory, favoriteIds, getAdBySlug, presentAd, similarAds } from "@/lib/services/listings";
import type { PublicAd } from "@/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const ad = await getAdBySlug((await params).slug);
    if (!ad || ad.status !== "live") return { title: "Listing" };
    const view = presentAd(ad as unknown as Record<string, unknown>);
    return {
      title: String(view.title),
      description: String(view.description).slice(0, 160),
      alternates: { canonical: `/ad/${view.slug}` },
      openGraph: { title: String(view.title), description: String(view.description).slice(0, 160), images: Array.isArray(view.images) && view.images[0]?.url ? [String(view.images[0].url)] : [] },
    };
  } catch {
    return { title: "Listing" };
  }
}

export default async function AdPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ad = await getAdBySlug(slug);
  if (!ad || ad.status !== "live" || (ad.expiresAt && new Date(ad.expiresAt).getTime() < Date.now())) notFound();
  const view = presentAd(ad as unknown as Record<string, unknown>) as PublicAd;
  const [related, session, neighbors] = await Promise.all([similarAds(ad), getSession("customer"), adjacentInCategory(ad)]);
  const saved = session ? (await favoriteIds(session.id)).includes(view.id) : false;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: view.title,
    description: view.description,
    image: (view.images || []).map((image) => image.url),
    sku: String(view.adNumber),
    offers: { "@type": "Offer", priceCurrency: "USD", price: view.priceType === "free" ? 0 : view.price, availability: "https://schema.org/InStock", url: `${appUrl()}/ad/${view.slug}` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AdExperience ad={view} similar={related as PublicAd[]} saved={saved} neighbors={neighbors} />
      <p className="sr-only"><Link href={`/category/${view.category?.slug}`}>More in {view.category?.name}</Link></p>
    </>
  );
}
