import { ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { bustCache } from "@/lib/cache";
import { clientIp } from "@/lib/utils";
import { getSettings } from "@/lib/services/listings";
import { saveSettings } from "@/lib/services/admin-ops";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  return ok("OK", await getSettings());
}

export async function PUT(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const settings = await saveSettings((await readJson(req)) as Record<string, unknown>, guard.session.id, clientIp(req));
  bustCache();
  return ok("Settings saved", settings);
}
