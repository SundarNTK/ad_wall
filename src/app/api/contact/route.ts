import { fail, ok, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/utils";
import { contactSchema } from "@/lib/validators/ad";
import { zodFieldErrors } from "@/lib/validators/auth";
import { getSettings } from "@/lib/services/listings";
import { sendPlainEmail } from "@/lib/mailer";
import { sanitizeText } from "@/lib/sanitize";

export async function POST(req: Request) {
  if (!rateLimit(`site-contact:${clientIp(req)}`, 5, 60 * 60 * 1000).ok) return fail("Too many messages. Try again later.", 429);
  const parsed = contactSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail("Check the form", 400, zodFieldErrors(parsed.error));
  if (parsed.data.website?.trim()) return ok("Message sent");
  const settings = await getSettings();
  await sendPlainEmail(String(settings.contactEmail || process.env.EMAIL_FROM || "hello@classinest.local"), "Contact form", [
    `${sanitizeText(parsed.data.name)} (${parsed.data.email}) wrote:`,
    sanitizeText(parsed.data.message),
  ]);
  return ok("Message sent. We'll get back to you.");
}
