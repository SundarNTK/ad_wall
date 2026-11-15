import { ok } from "@/lib/http";
import { cached } from "@/lib/cache";
import { dbConnect } from "@/lib/db";
import { Category, ExpiryOption, Location, ReportType, SubCategory } from "@/models/Catalog";

export async function GET() {
  return ok("OK", await cached("meta", 60_000, loadMeta));
}

async function loadMeta() {
  await dbConnect();
  const [categories, subcategories, locations, expiry, reportTypes] = await Promise.all([
    Category.find({ isActive: true }).sort({ order: 1 }).lean(),
    SubCategory.find({ isActive: true }).sort({ order: 1 }).lean(),
    Location.find({ isActive: true }).sort({ state: 1, city: 1 }).lean(),
    ExpiryOption.find({ isActive: true }).sort({ order: 1 }).lean(),
    ReportType.find({ isActive: true }).sort({ order: 1 }).lean(),
  ]);
  return { categories, subcategories, locations, expiry, reportTypes };
}
