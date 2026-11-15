import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { bustCache } from "@/lib/cache";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/utils";
import { isMasterKey, masterRegistry } from "@/lib/services/masters";
import { zodFieldErrors } from "@/lib/validators/auth";
import { ExpiryOption } from "@/models/Catalog";

type Ctx = { params: Promise<{ resource: string; id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { resource, id } = await ctx.params;
  if (!isMasterKey(resource)) return fail("Unknown master", 404);
  const config = masterRegistry[resource];
  const model = config.model as unknown as {
    findByIdAndUpdate: (id: string, update: object, options: object) => Promise<unknown>;
    findByIdAndDelete: (id: string) => Promise<unknown>;
  };
  const parsed = config.schema.partial().safeParse(await readJson(req));
  if (!parsed.success) return fail("Check the form", 400, zodFieldErrors(parsed.error));
  const keys = Object.keys(parsed.data);
  const prepared = keys.every((key) => key === "isActive" || key === "order")
    ? parsed.data
    : (config.prepare as (data: unknown) => Record<string, unknown>)(parsed.data);
  const updated = await model.findByIdAndUpdate(id, prepared, { new: true });
  if (!updated) return fail("Not found", 404);
  if (resource === "expiry" && (parsed.data as { isDefault?: boolean }).isDefault) {
    await ExpiryOption.updateMany({ _id: { $ne: id } }, { isDefault: false });
  }
  await audit(guard.session.id, `${resource}_updated`, id, {}, clientIp(req));
  bustCache();
  return ok("Saved", updated);
}

export async function DELETE(req: Request, ctx: Ctx) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { resource, id } = await ctx.params;
  if (!isMasterKey(resource)) return fail("Unknown master", 404);
  const config = masterRegistry[resource];
  const model = config.model as unknown as { findByIdAndDelete: (id: string) => Promise<unknown> };
  if (await config.inUse(id)) return fail("This record is in use. Deactivate it instead.", 409);
  const removed = await model.findByIdAndDelete(id);
  if (!removed) return fail("Not found", 404);
  await audit(guard.session.id, `${resource}_deleted`, id, {}, clientIp(req));
  bustCache();
  return ok("Deleted");
}
