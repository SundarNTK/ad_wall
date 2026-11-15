import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { clientIp } from "@/lib/utils";
import { handleReport, listReports, pageSize } from "@/lib/services/admin-ops";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const url = new URL(req.url);
  return ok("OK", await listReports(url.searchParams.get("status") || "all", url.searchParams.get("type") || "all", Number(url.searchParams.get("page") || 1), pageSize(url.searchParams.get("limit"))));
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const body = (await readJson(req)) as { id?: string; action?: string };
  if (!body.id || !body.action) return fail("Missing report action", 400);
  const result = await handleReport(guard.session, body.id, body.action, clientIp(req));
  if (result.status >= 400) return fail(result.message, result.status);
  return ok(result.message);
}
