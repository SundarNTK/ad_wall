import { fail, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/utils";
import { resetPassword } from "@/lib/services/identity";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`admin-reset:${ip}`, 10, 60 * 60 * 1000).ok) return fail("Too many requests. Try again shortly.", 429);
  const result = await resetPassword(await readJson(req), ip);
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message);
}
