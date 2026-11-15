import { fail, ok, readJson } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { addSearch, listSearches, removeSearch } from "@/lib/services/account";

export async function GET(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  return ok("OK", { items: await listSearches(guard.session.id) });
}

export async function POST(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const result = await addSearch(guard.session.id, await readJson(req));
  if (result.status >= 400) return fail(result.message, result.status, result.errors);
  return ok(result.message, result.data, result.status);
}

export async function DELETE(req: Request) {
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const id = new URL(req.url).searchParams.get("id") || "";
  const result = await removeSearch(guard.session.id, id);
  return ok(result.message);
}
