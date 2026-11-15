import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { dashboardStats } from "@/lib/services/admin-ops";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  return ok("OK", await dashboardStats());
}
