import { fail, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/utils";
import { forgotPassword } from "@/lib/services/identity";

export async function POST(req: Request) {
  if (!rateLimit(`admin-forgot:${clientIp(req)}`, 5, 60 * 60 * 1000).ok) return fail("Too many requests. Try again shortly.", 429);
  const result = await forgotPassword(await readJson(req), "admin");
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message);
}
