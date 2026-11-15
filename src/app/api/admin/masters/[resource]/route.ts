import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { bustCache } from "@/lib/cache";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/utils";
import { isMasterKey, listMaster, masterRegistry } from "@/lib/services/masters";
import { zodFieldErrors } from "@/lib/validators/auth";
import { ExpiryOption } from "@/models/Catalog";

type Ctx = { params: Promise<{ resource: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { resource } = await ctx.params;
  if (!isMasterKey(resource)) return fail("Unknown master", 404);
  const url = new URL(req.url);
  return ok("OK", await listMaster(
    resource,
    url.searchParams.get("q") || "",
    Number(url.searchParams.get("page") || 1),
    url.searchParams.get("status") || "",
    Number(url.searchParams.get("limit") || 10),
  ));
}

export async function POST(req: Request, ctx: Ctx) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { resource } = await ctx.params;
  if (!isMasterKey(resource)) return fail("Unknown master", 404);
  const config = masterRegistry[resource];
  const model = config.model as unknown as {
    updateOne: (filter: object, update: object) => Promise<unknown>;
    create: (doc: object) => Promise<{ _id: unknown }>;
  };
  const body = await readJson(req);
  if ((body as { action?: string }).action === "reorder") {
    const ids = (body as { ids?: string[] }).ids || [];
    await Promise.all(ids.map((id, index) => model.updateOne({ _id: id }, { order: index })));
    await audit(guard.session.id, `${resource}_reorder`, resource, { count: ids.length }, clientIp(req));
    bustCache();
    return ok("Order saved");
  }
  const parsed = config.schema.safeParse(body);
  if (!parsed.success) return fail("Check the form", 400, zodFieldErrors(parsed.error));
  const prepared = (config.prepare as (data: unknown) => Record<string, unknown>)(parsed.data);
  const created = await model.create(prepared);
  if (resource === "expiry" && (parsed.data as { isDefault?: boolean }).isDefault) {
    await ExpiryOption.updateMany({ _id: { $ne: created._id } }, { isDefault: false });
  }
  await audit(guard.session.id, `${resource}_created`, String(created._id), {}, clientIp(req));
  bustCache();
  return ok("Saved", created, 201);
}
