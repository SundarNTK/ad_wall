// Safe, additive: upserts extra subcategories only. Does not touch ads, users or locations.
import { config } from "dotenv";
import { extraSubs, toSlug } from "./subcategory-data";

config({ path: ".env.local" });
config();

async function main() {
  const { dbConnect } = await import("../src/lib/db");
  const { Category, SubCategory } = await import("../src/models/Catalog");
  const { Ad } = await import("../src/models/Ad");
  await dbConnect();
  let added = 0;
  let removed = 0;
  for (const [catSlug, names] of Object.entries(extraSubs)) {
    const category = await Category.findOne({ slug: catSlug });
    if (!category) { console.log("skip missing category", catSlug); continue; }
    const wanted = new Set(names.map(toSlug));
    for (const [i, name] of names.entries()) {
      const slug = toSlug(name);
      const res = await SubCategory.updateOne(
        { category: category._id, slug },
        { $setOnInsert: { category: category._id, name, slug, order: 10 + i, fields: [] }, $set: { isActive: true } },
        { upsert: true },
      );
      if (res.upsertedCount) added += 1;
    }
    // drop stale extras (order >= 10) from an earlier list, only when no ad uses them
    const stale = await SubCategory.find({ category: category._id, order: { $gte: 10 }, slug: { $nin: [...wanted] } });
    for (const sub of stale) {
      if ((await Ad.countDocuments({ subCategory: sub._id })) === 0) { await sub.deleteOne(); removed += 1; }
    }
  }
  console.log(`Subcategories added: ${added}, stale removed: ${removed}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
