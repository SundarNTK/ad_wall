import { fail, ok } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/utils";
import { requireUser } from "@/lib/guards";
import { readJson } from "@/lib/http";
import { saveAd } from "@/lib/services/ads";
import { searchAds } from "@/lib/services/listings";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const attrs: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    if (key.startsWith("attr_")) attrs[key.slice(5)] = value;
  });
  const data = await searchAds({
    q: url.searchParams.get("q") || undefined,
    category: url.searchParams.get("category") || undefined,
    sub: url.searchParams.get("sub") || undefined,
    loc: url.searchParams.get("loc") || undefined,
    minPrice: url.searchParams.get("minPrice") || undefined,
    maxPrice: url.searchParams.get("maxPrice") || undefined,
    seller: url.searchParams.get("seller") || undefined,
    posted: url.searchParams.get("posted") || undefined,
    sort: url.searchParams.get("sort") || undefined,
    page: url.searchParams.get("page") || undefined,
    attrs,
  });
  return ok("OK", data);
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`post:${ip}`, 20, 60 * 60 * 1000).ok) return fail("Too many requests. Try again shortly.", 429);
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const result = await saveAd(guard.session, await readJson(req));
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message, result.data, result.status);
}
