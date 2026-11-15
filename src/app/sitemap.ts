import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const staticRoutes = ["", "/search", "/about", "/help", "/safety", "/terms", "/privacy", "/contact", "/locations", "/post"].map((path) => ({
    url: `${base}${path || "/"}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.6,
  }));
  try {
    const { Ad } = await import("@/models/Ad");
    const { Category } = await import("@/models/Catalog");
    const { dbConnect } = await import("@/lib/db");
    await dbConnect();
    const [ads, categories] = await Promise.all([
      Ad.find({ status: "live" }).select("slug updatedAt").limit(5000).lean(),
      Category.find({ isActive: true }).select("slug").lean(),
    ]);
    return [
      ...staticRoutes,
      ...categories.map((item) => ({ url: `${base}/category/${item.slug}`, changeFrequency: "daily" as const, priority: 0.7 })),
      ...ads.map((item) => ({ url: `${base}/ad/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.5 })),
    ];
  } catch {
    return staticRoutes;
  }
}
