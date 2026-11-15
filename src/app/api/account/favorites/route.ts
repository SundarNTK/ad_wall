import { ok } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { favoritesFor } from "@/lib/services/account";

export async function GET(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  return ok("OK", { items: await favoritesFor(guard.session.id) });
}
