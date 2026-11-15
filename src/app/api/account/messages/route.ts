import { fail, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { inbox, setMessage } from "@/lib/services/account";

export async function GET(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  return ok("OK", { items: await inbox(guard.session.id) });
}

export async function PATCH(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const body = (await readJson(req)) as { id?: string; action?: "read" | "delete" };
  if (!body.id || (body.action !== "read" && body.action !== "delete")) return fail("Missing message", 400);
  const result = await setMessage(guard.session.id, body.id, body.action);
  if (result.status >= 400) return fail(result.message, result.status);
  return ok(result.message);
}
