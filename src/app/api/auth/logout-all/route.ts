import { ok } from "@/lib/http";
import { requireUser, sessionData } from "@/lib/guards";
import { clearSession, getSession, revokeAllSessions } from "@/lib/auth";

export async function POST(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  await revokeAllSessions(guard.session.id);
  await clearSession("customer");
  const still = await getSession("customer");
  return still ? ok("Signed out everywhere", { user: sessionData(still) }) : ok("Signed out everywhere");
}
