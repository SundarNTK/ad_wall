import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { clientIp } from "@/lib/utils";
import { searchAds } from "@/lib/services/listings";
import { moderateAd } from "@/lib/services/admin-ops";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const url = new URL(req.url);
  const data = await searchAds(
    {
      q: url.searchParams.get("q") || undefined,
      category: url.searchParams.get("category") || undefined,
      loc: url.searchParams.get("loc") || undefined,
      status: url.searchParams.get("status") || "all",
      page: url.searchParams.get("page") || "1",
      limit: url.searchParams.get("limit") || undefined,
      sort: url.searchParams.get("sort") || "newest",
      from: url.searchParams.get("from") || undefined,
      to: url.searchParams.get("to") || undefined,
    },
    true,
  );
  return ok("OK", data);
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const body = (await readJson(req)) as { ids?: string[]; action?: string; reason?: string };
  if (!body.action || !Array.isArray(body.ids) || !body.ids.length) return fail("Choose ads and an action", 400);
  let done = 0;
  const skipped: string[] = [];
  for (const id of body.ids) {
    const result = await moderateAd(guard.session, id, body.action, body.reason || "", clientIp(req));
    if (result.status >= 400) {
      if (result.status === 400) return fail(result.message, 400); // e.g. missing reject reason: nothing useful to continue
      skipped.push(result.message);
    } else done += 1;
  }
  if (!done) return fail(skipped[0] || "Nothing was changed.", 409);
  const unique = [...new Set(skipped)];
  return ok(`${done} ad${done === 1 ? "" : "s"} updated${skipped.length ? `. ${skipped.length} skipped: ${unique.join(" ")}` : ""}`);
}
