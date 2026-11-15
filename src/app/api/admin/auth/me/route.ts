import { ok } from "@/lib/http";
import { requireAdmin, sessionData } from "@/lib/guards";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  return ok("OK", { user: sessionData(guard.session) });
}
