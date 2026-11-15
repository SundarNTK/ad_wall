import { ok } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { adminMessages, pageSize } from "@/lib/services/admin-ops";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const params = new URL(req.url).searchParams;
  return ok("OK", await adminMessages(Number(params.get("page") || 1), pageSize(params.get("limit"))));
}
