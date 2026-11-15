import { ok } from "@/lib/http";
import { locationSuggestions } from "@/lib/services/listings";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() || "";
  if (q.length < 2) return ok("OK", { items: [] });
  const items = await locationSuggestions(q);
  return ok("OK", {
    items: items.map((item) => ({
      id: String(item._id),
      slug: item.slug,
      label: `${item.city}, ${item.state}`,
      city: item.city,
      state: item.state,
      zip: item.zip,
    })),
  });
}
