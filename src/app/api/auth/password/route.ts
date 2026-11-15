import { fail, ok, readJson } from "@/lib/http";
import { requireUser, sessionData } from "@/lib/guards";
import { changeOwnPassword } from "@/lib/services/identity";

export async function POST(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const result = await changeOwnPassword(guard.session.id, await readJson(req), "customer");
  if (result.status >= 400 || !result.user) return fail(result.message, result.status, result.errors);
  return ok(result.message, { user: sessionData(result.user) });
}
