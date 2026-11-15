import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { clientIp } from "@/lib/utils";
import { createStaff, deleteStaff, listStaff, updateStaff } from "@/lib/services/admin-ops";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  return ok("OK", { items: await listStaff() });
}

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const result = await createStaff(guard.session, await readJson(req), clientIp(req));
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message, undefined, result.status);
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const body = (await readJson(req)) as { id?: string; name?: string; phone?: string; role?: "admin" | "superadmin"; status?: "active" | "blocked" };
  if (!body.id) return fail("Missing admin", 400);
  const result = await updateStaff(guard.session, body.id, body, clientIp(req));
  if (result.status >= 400) return fail(result.message, result.status);
  return ok(result.message);
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const id = new URL(req.url).searchParams.get("id") || "";
  const result = await deleteStaff(guard.session, id, clientIp(req));
  if (result.status >= 400) return fail(result.message, result.status);
  return ok(result.message);
}
