import type { Metadata } from "next";
import { SubcategoryListing } from "@/components/customer/subcategory-listing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string; sub: string }> }): Promise<Metadata> {
  const { slug, sub } = await params;
  return { title: sub.replace(/-/g, " "), alternates: { canonical: `/category/${slug}/${sub}` } };
}

export default async function SubPage({ params, searchParams }: { params: Promise<{ slug: string; sub: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug, sub } = await params;
  const raw = await searchParams;
  const initial: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) initial[key] = Array.isArray(value) ? value[0] || "" : value || "";
  return <SubcategoryListing categorySlug={slug} subSlug={sub} initial={initial} />;
}
