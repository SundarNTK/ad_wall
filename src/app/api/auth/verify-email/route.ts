import { fail, ok, readJson } from "@/lib/http";
import { verifyEmail } from "@/lib/services/identity";

export async function POST(req: Request) {
  const result = await verifyEmail(await readJson(req));
  if (result.status >= 400) return fail(result.message, result.status);
  return ok(result.message);
}
