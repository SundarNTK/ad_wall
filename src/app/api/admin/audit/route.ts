import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { listAudit, pageSize } from "@/lib/services/admin-ops";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const url = new URL(req.url);
  return ok("OK", await listAudit(url.searchParams.get("actor") || "", url.searchParams.get("action") || "", Number(url.searchParams.get("page") || 1), pageSize(url.searchParams.get("limit"))));
}
