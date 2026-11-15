import { ok } from "@/lib/http";
import { activeCategories, activeSubs } from "@/lib/services/listings";

export async function GET() {
  const [categories, subcategories] = await Promise.all([activeCategories(), activeSubs()]);
  return ok("OK", { categories, subcategories });
}
