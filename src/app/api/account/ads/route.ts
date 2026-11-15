import { ok } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { myAds } from "@/lib/services/ads";

export async function GET(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  return ok("OK", { items: await myAds(guard.session.id) });
}
