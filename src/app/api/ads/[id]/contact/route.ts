import { fail, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/utils";
import { contactSeller } from "@/lib/services/ads";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!rateLimit(`contact:${clientIp(req)}`, 10, 60 * 60 * 1000).ok) return fail("Too many messages. Try again later.", 429);
  const { id } = await ctx.params;
  const result = await contactSeller(id, await readJson(req));
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message);
}
