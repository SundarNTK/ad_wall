import { ok } from "@/lib/http";
import { assertSameOrigin } from "@/lib/csrf";
import { fail } from "@/lib/http";
import { logoutPortal } from "@/lib/services/identity";

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
  } catch {
    return fail("Forbidden", 403);
  }
  await logoutPortal("customer");
  return ok("Signed out");
}
