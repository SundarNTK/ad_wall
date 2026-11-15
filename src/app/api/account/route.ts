import { fail, ok, readJson } from "@/lib/http";
import { requireUser, sessionData } from "@/lib/guards";
import { removeAccount, updateAvatar, updateProfile } from "@/lib/services/account";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession("customer");
  if (!session) return fail("Please sign in", 401);
  return ok("OK", { user: sessionData(session) });
}

export async function PATCH(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const body = (await readJson(req)) as { avatar?: string };
  if (typeof body.avatar === "string") {
    const result = await updateAvatar(guard.session.id, body.avatar);
    return ok(result.message);
  }
  const result = await updateProfile(guard.session.id, body);
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  const fresh = await getSession("customer");
  return ok(result.message, { user: fresh ? sessionData(fresh) : undefined });
}

export async function DELETE(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const result = await removeAccount(guard.session, await readJson(req), "customer");
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message);
}
