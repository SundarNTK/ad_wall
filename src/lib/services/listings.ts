import { dbConnect } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { Category, ExpiryOption, Faq, Location, Page, Setting, SubCategory } from "@/models/Catalog";
import { Favorite } from "@/models/Engagement";
import { escapeRegex } from "@/lib/utils";
import { cached } from "@/lib/cache";

export async function getSettings() {
  return cached("settings", 60_000, loadSettings);
}

async function loadSettings() {
  await dbConnect();
  const existing = await Setting.findOne({ key: "site" }).lean();
  if (existing) return existing;
  return {
    siteName: "AdWall",
    logoUrl: "",
    contactEmail: "hello@classinest.local",
    moderationEnabled: true,
    maxImages: 5,
  };
}

export async function activeCategories() {
  return cached("categories", 60_000, async () => {
    await dbConnect();
    return Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean();
  });
}

export async function activeLocations() {
  return cached("locations", 60_000, async () => {
    await dbConnect();
    return Location.find({ isActive: true }).sort({ city: 1 }).select("slug city state").lean();
  });
}

export async function activeSubs(categoryId?: string) {
  return cached(`subs:${categoryId || "all"}`, 60_000, async () => {
    await dbConnect();
    const filter = categoryId ? { category: categoryId, isActive: true } : { isActive: true };
    return SubCategory.find(filter).sort({ order: 1, name: 1 }).lean();
  });
}

export async function homeDirectory() {
  return cached("home", 60_000, async () => {
    await dbConnect();
    const [categories, subs, locations] = await Promise.all([
      Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
      SubCategory.find({ isActive: true }).sort({ order: 1, name: 1 }).lean(),
      Location.find({ isActive: true }).sort({ city: 1 }).select("slug city state").lean(),
    ]);
    const slugById = new Map(categories.map((category) => [String(category._id), category.slug]));
    const subsByCategory: Record<string, { name: string; slug: string }[]> = {};
    for (const sub of subs) {
      const slug = slugById.get(String(sub.category));
      if (!slug) continue;
      (subsByCategory[slug] ||= []).push({ name: sub.name, slug: sub.slug });
    }
    return {
      categories: categories.map((category) => ({ name: category.name, slug: category.slug, icon: category.icon || "Tag" })),
      subsByCategory,
      locations: locations.map((location) => ({ slug: location.slug, city: location.city, state: location.state })),
    };
  });
}

export async function adjacentInCategory(ad: { _id: unknown; category: unknown; createdAt?: Date | string }) {
  return cached(`adjacent:${String(ad._id)}`, 30_000, () => adjacentUncached(ad));
}

async function adjacentUncached(ad: { _id: unknown; category: unknown; createdAt?: Date | string }) {
  const categoryId = (ad.category as { _id?: unknown })?._id || ad.category;
  const createdAt = ad.createdAt ? new Date(ad.createdAt) : new Date();
  const base = { status: "live", category: categoryId, _id: { $ne: ad._id } };
  const [older, newer] = await Promise.all([
    Ad.findOne({ ...base, createdAt: { $lt: createdAt } }).sort({ createdAt: -1 }).select("slug title").lean(),
    Ad.findOne({ ...base, createdAt: { $gt: createdAt } }).sort({ createdAt: 1 }).select("slug title").lean(),
  ]);
  const [fallbackNext, fallbackPrev] = await Promise.all([
    older ? null : Ad.findOne(base).sort({ createdAt: -1 }).select("slug title").lean(),
    newer ? null : Ad.findOne(base).sort({ createdAt: 1 }).select("slug title").lean(),
  ]);
  const next = older || fallbackNext;
  const prev = newer || fallbackPrev;
  const link = (row: { slug?: string; title?: string } | null) => (row?.slug ? { slug: String(row.slug), title: String(row.title || "") } : null);
  return { next: link(next), prev: link(prev) };
}

type ListParams = {
  q?: string;
  category?: string;
  sub?: string;
  loc?: string;
  minPrice?: string;
  maxPrice?: string;
  seller?: string;
  posted?: string;
  sort?: string;
  page?: string;
  limit?: string;
  view?: string;
  status?: string;
  from?: string;
  to?: string;
  attrs?: Record<string, string>;
};

function num(value?: string) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

type CatalogMaps = {
  catMap: Map<string, Record<string, unknown>>;
  subMap: Map<string, Record<string, unknown>>;
  locMap: Map<string, Record<string, unknown>>;
};

/** Category, subcategory and location records from the 60-second cache, keyed by id. */
async function catalogMaps(): Promise<CatalogMaps> {
  const [cats, subsAll, locs] = await Promise.all([
    cached("all-cats", 60_000, () => Category.find().select("name slug icon").lean()),
    cached("all-subs", 60_000, () => SubCategory.find().select("name slug fields category").lean()),
    cached("all-locs", 60_000, () => Location.find().select("city state country slug lat lng").lean()),
  ]);
  return {
    catMap: new Map(cats.map((item) => [String(item._id), item as unknown as Record<string, unknown>])),
    subMap: new Map(subsAll.map((item) => [String(item._id), item as unknown as Record<string, unknown>])),
    locMap: new Map(locs.map((item) => [String(item._id), item as unknown as Record<string, unknown>])),
  };
}

/** Replaces the id fields of an ad row with the matching catalog records (what populate used to do, without extra queries). */
function withNames<T extends object>(row: T, maps: CatalogMaps) {
  const source = row as Record<string, unknown>;
  const idOf = (value: unknown) => String((value as { _id?: unknown })?._id || value);
  return {
    ...source,
    category: maps.catMap.get(idOf(source.category)) || source.category,
    subCategory: maps.subMap.get(idOf(source.subCategory)) || source.subCategory,
    location: maps.locMap.get(idOf(source.location)) || source.location,
  } as unknown as Omit<T, "category" | "subCategory" | "location"> & { category: unknown; subCategory: unknown; location: unknown };
}

let lastExpirySweep = 0;

export async function searchAds(params: ListParams, includeAll = false) {
  // Public listings repeat a lot (same category, same page), so they are cached for a few seconds. Admin lists are always live.
  if (!includeAll) return cached(`list:${JSON.stringify(params)}`, 20_000, () => searchAdsUncached(params, false));
  return searchAdsUncached(params, true);
}

async function searchAdsUncached(params: ListParams, includeAll: boolean) {
  await dbConnect();
  // Mark overdue ads as expired at most once a minute instead of on every request.
  if (Date.now() - lastExpirySweep > 60_000) {
    lastExpirySweep = Date.now();
    await Ad.updateMany({ status: "live", expiresAt: { $lt: new Date() } }, { $set: { status: "expired" } });
  }
  const filter: Record<string, unknown> = {};
  if (!includeAll) {
    filter.status = "live";
    filter.expiresAt = { $gt: new Date() }; // hide overdue ads right away, even before the sweep marks them expired
  }
  else if (params.status && params.status !== "all") filter.status = params.status;
  else if (includeAll) filter.status = { $ne: "deleted" };

  if (params.category) {
    const category = await cached(`cat-slug:${params.category}`, 60_000, () => Category.findOne({ slug: params.category }).lean());
    if (!category) return { items: [], total: 0, page: 1, pages: 1 };
    filter.category = category._id;
    if (params.sub) {
      const sub = await cached(`sub-slug:${category._id}:${params.sub}`, 60_000, () => SubCategory.findOne({ category: category._id, slug: params.sub }).lean());
      if (sub) filter.subCategory = sub._id;
    }
  }
  if (params.loc) {
    const location = await cached(`loc-slug:${params.loc}`, 60_000, () => Location.findOne({ slug: params.loc, isActive: true }).lean());
    if (location) filter.location = location._id;
  }
  const minPrice = num(params.minPrice);
  const maxPrice = num(params.maxPrice);
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {
      ...(minPrice !== undefined ? { $gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
    };
  }
  if (params.seller === "private") filter.isPrivateSeller = true;
  const postedDays = num(params.posted);
  if (postedDays) filter.createdAt = { $gte: new Date(Date.now() - postedDays * 86400000) };
  if (params.from || params.to) {
    filter.createdAt = {
      ...(params.from ? { $gte: new Date(params.from) } : {}),
      ...(params.to ? { $lte: new Date(`${params.to}T23:59:59`) } : {}),
    };
  }
  for (const [key, value] of Object.entries(params.attrs || {})) {
    if (!value) continue;
    if (key.endsWith("_min") || key.endsWith("_max")) {
      const field = key.replace(/_(min|max)$/, "");
      const current = (filter[`attributes.${field}`] as Record<string, number>) || {};
      current[key.endsWith("_min") ? "$gte" : "$lte"] = Number(value);
      filter[`attributes.${field}`] = current;
    } else {
      filter[`attributes.${key}`] = value;
    }
  }
  const q = params.q?.trim();
  if (q) {
    if (/^\d+$/.test(q)) {
      filter.$or = [{ adNumber: Number(q) }, { title: new RegExp(escapeRegex(q), "i") }];
    } else if (q.split(/\s+/).length >= 2) {
      filter.$text = { $search: q };
    } else {
      const regex = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: regex }, { description: regex }, { city: regex }];
    }
  }
  const page = Math.max(1, num(params.page) || 1);
  const limit = includeAll ? ([10, 25, 50, 100].includes(Number(params.limit)) ? Number(params.limit) : 10) : 12;
  const sort: Record<string, 1 | -1> = params.sort === "price_asc" ? { price: 1 } : params.sort === "price_desc" ? { price: -1 } : { isFeatured: -1, createdAt: -1 };
  const [total, rows, maps] = await Promise.all([
    Ad.countDocuments(filter),
    Ad.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(includeAll ? [{ path: "user", select: "name email" }] : [])
      .lean(),
    catalogMaps(),
  ]);
  const shaped = rows.map((row) => withNames(row, maps));
  return {
    items: shaped.map((row) => (includeAll ? { ...presentAd(row as never, true), owner: (row as { user?: unknown }).user || null } : presentAd(row as never))),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function presentAd(ad: Record<string, unknown>, reveal = false, withContact = false) {
  const category = ad.category as { _id?: unknown; name?: string; slug?: string; icon?: string } | undefined;
  const sub = ad.subCategory as { _id?: unknown; name?: string; slug?: string; fields?: unknown } | undefined;
  const location = ad.location as { _id?: unknown; city?: string; state?: string; country?: string; slug?: string; lat?: number; lng?: number } | undefined;
  const showPhone = Boolean(ad.showPhone);
  return {
    id: String(ad._id),
    adNumber: ad.adNumber,
    title: ad.title,
    slug: ad.slug,
    description: ad.description,
    price: ad.price,
    priceType: ad.priceType,
    attributes: ad.attributes || {},
    images: ad.images || [],
    contactName: ad.contactName,
    contactEmail: reveal || withContact ? ad.contactEmail : undefined,
    contactPhone: reveal || showPhone ? ad.contactPhone : "",
    showPhone,
    city: ad.city,
    zip: ad.zip,
    lat: typeof ad.lat === "number" ? ad.lat : null,
    lng: typeof ad.lng === "number" ? ad.lng : null,
    status: ad.status,
    rejectReason: reveal ? ad.rejectReason : undefined,
    expiresAt: ad.expiresAt ? new Date(ad.expiresAt as string).toISOString() : null,
    renewedAt: ad.renewedAt ? new Date(ad.renewedAt as string).toISOString() : null,
    createdAt: ad.createdAt ? new Date(ad.createdAt as string).toISOString() : null,
    updatedAt: ad.updatedAt ? new Date(ad.updatedAt as string).toISOString() : null,
    views: ad.views || 0,
    isPrivateSeller: ad.isPrivateSeller,
    isFeatured: ad.isFeatured,
    durationDays: ad.durationDays,
    userId: ad.user ? String((ad.user as { _id?: unknown })._id || ad.user) : undefined,
    category: category?.name ? { id: String(category._id), name: category.name, slug: category.slug, icon: category.icon } : null,
    subCategory: sub?.name ? { id: String(sub._id), name: sub.name, slug: sub.slug, fields: sub.fields || [] } : null,
    location: location?.city ? { id: String(location._id), city: location.city, state: location.state, country: location.country, slug: location.slug, lat: location.lat || null, lng: location.lng || null } : null,
  };
}

export async function getAdBySlug(slug: string) {
  await dbConnect();
  const [ad, maps] = await Promise.all([Ad.findOne({ slug, status: { $in: ["live", "pending", "expired", "rejected"] } }).lean(), catalogMaps()]);
  return ad ? withNames(ad, maps) : null;
}

export async function similarAds(ad: { _id: unknown; subCategory: unknown }) {
  const subId = String((ad.subCategory as { _id?: unknown })?._id || ad.subCategory);
  return cached(`similar:${String(ad._id)}`, 30_000, async () => {
    const [rows, maps] = await Promise.all([
      Ad.find({ status: "live", expiresAt: { $gt: new Date() }, subCategory: subId, _id: { $ne: ad._id } }).sort({ createdAt: -1 }).limit(4).lean(),
      catalogMaps(),
    ]);
    return rows.map((row) => presentAd(withNames(row, maps)));
  });
}

export async function locationSuggestions(q: string) {
  await dbConnect();
  const regex = new RegExp(escapeRegex(q), "i");
  return Location.find({ isActive: true, $or: [{ city: regex }, { state: regex }, { zip: regex }] })
    .sort({ city: 1 })
    .limit(8)
    .lean();
}

export async function favoriteIds(userId?: string) {
  if (!userId) return [];
  const rows = await Favorite.find({ user: userId }).select("ad").lean();
  return rows.map((row) => String(row.ad));
}

export async function loadContent(slug: string) {
  return cached(`content:${slug}`, 60_000, () => loadContentUncached(slug));
}

async function loadContentUncached(slug: string) {
  await dbConnect();
  const [page, faqs, locations] = await Promise.all([
    Page.findOne({ slug, isActive: true }).lean(),
    slug === "help" ? Faq.find({ isActive: true }).sort({ order: 1 }).lean() : Promise.resolve([]),
    slug === "locations" ? Location.find({ isActive: true }).sort({ state: 1, city: 1 }).lean() : Promise.resolve([]),
  ]);
  return { page, faqs, locations };
}

export async function expiryChoices() {
  return cached("expiry", 60_000, async () => {
    await dbConnect();
    const rows = await ExpiryOption.find({ isActive: true }).sort({ order: 1 }).lean();
    if (rows.length) return rows;
    return [{ label: "6 months", days: 180, isDefault: true }];
  });
}
