import { fail, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { requestEmailChange } from "@/lib/services/identity";

export async function POST(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const result = await requestEmailChange(guard.session.id, await readJson(req));
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message);
}
