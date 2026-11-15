import { fail, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/utils";
import { sessionData } from "@/lib/guards";
import { loginAccount } from "@/lib/services/identity";

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!rateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000).ok) return fail("Too many requests. Try again shortly.", 429);
  const result = await loginAccount(await readJson(req), "admin", ip);
  if (result.status >= 400 || !result.user) return fail(result.message, result.status, result.errors);
  return ok(result.message, { user: sessionData(result.user) });
}
