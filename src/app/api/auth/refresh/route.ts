import { fail, ok } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { refreshSession } from "@/lib/auth";
import { sessionData } from "@/lib/guards";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return fail("Forbidden", 403);
  }
  const session = await refreshSession("customer", true);
  if (!session) return fail("Session expired", 401);
  return ok("Session refreshed", { user: sessionData(session) });
}
