import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { clientIp } from "@/lib/utils";
import { customerAction, listCustomers, pageSize } from "@/lib/services/admin-ops";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Ad } from "@/models/Ad";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const url = new URL(req.url);
  return ok("OK", await listCustomers(url.searchParams.get("q") || "", Number(url.searchParams.get("page") || 1), pageSize(url.searchParams.get("limit"))));
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const body = (await readJson(req)) as { id?: string; action?: string };
  if (!body.id || !body.action) return fail("Missing customer action", 400);
  if (body.action === "detail") {
    await dbConnect();
    const user = await User.findById(body.id).lean();
    const ads = await Ad.find({ user: body.id }).sort({ createdAt: -1 }).limit(20).lean();
    if (!user) return fail("Customer not found", 404);
    return ok("OK", {
      user: { id: String(user._id), name: user.name, email: user.email, phone: user.phone, status: user.status, emailVerified: user.emailVerified, createdAt: user.createdAt },
      ads: ads.map((ad) => ({ id: String(ad._id), title: ad.title, status: ad.status, slug: ad.slug, views: ad.views })),
    });
  }
  const result = await customerAction(guard.session, body.id, body.action, clientIp(req));
  if (result.status >= 400) return fail(result.message, result.status);
  return ok(result.message);
}
