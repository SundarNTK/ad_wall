import { fail, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { ownerDeleteAd, saveAd } from "@/lib/services/ads";
import { dbConnect } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { presentAd } from "@/lib/services/listings";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  await dbConnect();
  const { id } = await ctx.params;
  const ad = await Ad.findOne({ _id: id, user: guard.session.id, status: { $ne: "deleted" } })
    .populate("category", "name slug")
    .populate("subCategory", "name slug fields")
    .populate("location", "city state slug")
    .lean();
  if (!ad) return fail("Ad not found", 404);
  return ok("OK", presentAd(ad as unknown as Record<string, unknown>, true));
}

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const result = await saveAd(guard.session, await readJson(req), id);
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message, result.data);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const result = await ownerDeleteAd(guard.session.id, id);
  if (result.status >= 400) return fail(result.message, result.status);
  return ok(result.message);
}
