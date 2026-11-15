import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { clientIp } from "@/lib/utils";
import { moderateAd } from "@/lib/services/admin-ops";
import { dbConnect } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { sanitizeText } from "@/lib/sanitize";
import { presentAd } from "@/lib/services/listings";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  await dbConnect();
  const { id } = await ctx.params;
  const ad = await Ad.findById(id).populate("category", "name slug").populate("subCategory", "name slug").populate("location", "city state slug").populate("user", "name email phone").lean();
  if (!ad) return fail("Ad not found", 404);
  return ok("OK", { ...presentAd(ad as unknown as Record<string, unknown>, true), owner: ad.user });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const body = (await readJson(req)) as { action?: string; reason?: string; title?: string; description?: string; price?: number; priceType?: string };
  if (body.action) {
    const result = await moderateAd(guard.session, id, body.action, body.reason || "", clientIp(req));
    if (result.status >= 400) return fail(result.message, result.status);
    return ok(result.message);
  }
  await dbConnect();
  const ad = await Ad.findById(id);
  if (!ad) return fail("Ad not found", 404);
  if (body.title) ad.title = sanitizeText(body.title).slice(0, 100);
  if (body.description) ad.description = sanitizeText(body.description).slice(0, 8000);
  if (body.price !== undefined) ad.price = Number(body.price) || 0;
  if (body.priceType && ["fixed", "negotiable", "free", "contact"].includes(body.priceType)) ad.priceType = body.priceType as typeof ad.priceType;
  await ad.save();
  return ok("Ad saved");
}
