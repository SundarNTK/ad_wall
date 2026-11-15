import { AuditLog } from "@/models/Engagement";
import { dbConnect } from "./db";

export async function audit(actor: string | undefined, action: string, target = "", meta: Record<string, unknown> = {}, ip = "") {
  await dbConnect();
  await AuditLog.create({ actor: actor || undefined, action, target, meta, ip });
}
