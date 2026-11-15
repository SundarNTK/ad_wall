import { fail, ok } from "@/lib/http";
import { getSession } from "@/lib/auth";
import { sessionData } from "@/lib/guards";

export async function GET() {
  const session = await getSession("customer");
  if (!session) return fail("Please sign in", 401);
  return ok("OK", { user: sessionData(session) });
}
