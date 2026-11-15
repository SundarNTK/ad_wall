import { fail, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import { resendVerification } from "@/lib/services/identity";
import { User } from "@/models/User";
import { dbConnect } from "@/lib/db";
import { emailSchema } from "@/lib/validators/auth";

export async function POST(req: Request) {
  if (!rateLimit(`resend:${clientIp(req)}`, 5, 60 * 60 * 1000).ok) return fail("Too many requests. Try again shortly.", 429);
  const session = await getSession("customer");
  if (session) {
    const result = await resendVerification(session.id);
    if (result.status >= 400) return fail(result.message, result.status);
    return ok(result.message);
  }
  const body = await readJson(req);
  const email = emailSchema.safeParse((body as { email?: string }).email);
  if (email.success) {
    await dbConnect();
    const user = await User.findOne({ email: email.data, deletedAt: null, emailVerified: false });
    if (user) await resendVerification(String(user._id));
  }
  return ok("If an unverified account exists, a verification email has been sent.");
}
