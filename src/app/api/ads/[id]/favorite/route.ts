import { fail, ok } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { toggleFavorite } from "@/lib/services/ads";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const result = await toggleFavorite(guard.session.id, id);
  if (result.status >= 400) return fail(result.message, result.status);
  return ok(result.message, result.data);
}
