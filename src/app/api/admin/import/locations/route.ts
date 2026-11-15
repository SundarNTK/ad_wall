import { fail, ok, readJson } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { bustCache } from "@/lib/cache";
import { dbConnect } from "@/lib/db";
import { Location } from "@/models/Catalog";
import { slugify } from "@/lib/utils";
import { audit } from "@/lib/audit";
import { clientIp } from "@/lib/utils";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const body = (await readJson(req)) as { csv?: string };
  const lines = (body.csv || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return fail("Paste a CSV with country,state,city,zip,lat,lng", 400);
  await dbConnect();
  let imported = 0;
  for (const line of lines) {
    if (/^country/i.test(line)) continue;
    const [country, state, city, zip, lat, lng] = line.split(",").map((part) => part.trim());
    if (!country || !state || !city) continue;
    const slug = slugify(`${city}-${state}-${zip || imported}`);
    await Location.updateOne(
      { slug },
      { country, state, city, zip: zip || "", lat: Number(lat) || 0, lng: Number(lng) || 0, slug, isActive: true },
      { upsert: true },
    );
    imported += 1;
  }
  await audit(guard.session.id, "locations_import", "locations", { imported }, clientIp(req));
  bustCache();
  return ok(`Imported ${imported} locations`, { imported });
}
