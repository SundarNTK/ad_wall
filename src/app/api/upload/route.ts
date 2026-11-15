import { fail, ok } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { inspectImage, uploadImage } from "@/lib/upload";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/utils";

export async function POST(req: Request) {
  if (!rateLimit(`upload:${clientIp(req)}`, 30, 60 * 60 * 1000).ok) return fail("Too many uploads. Try again later.", 429);
  const guard = await requireUser(req, "customer");
  if ("error" in guard) return guard.error;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Choose an image", 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  const problem = inspectImage(file, buffer);
  if (problem) return fail(problem, 400);
  try {
    const image = await uploadImage(buffer, form.get("purpose") === "avatar" ? "classinest/avatars" : "classinest/ads");
    return ok("Uploaded", image);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Upload failed", 500);
  }
}
