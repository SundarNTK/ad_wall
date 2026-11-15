import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Ad } from "@/models/Ad";
import { Category, Setting } from "@/models/Catalog";
import { AuditLog, Message, Report } from "@/models/Engagement";
import { hashPassword, revokeAllSessions, type SessionUser } from "@/lib/auth";
import { adminUserSchema } from "@/lib/validators/ad";
import { passwordAvoidsEmail, passwordSchema, zodFieldErrors } from "@/lib/validators/auth";
import { INVITE_MS } from "@/lib/constants";
import { randomToken, sha256 } from "@/lib/tokens";
import { sendLinkEmail, sendPlainEmail } from "@/lib/mailer";
import { sanitizeText } from "@/lib/sanitize";
import { audit } from "@/lib/audit";
import { escapeRegex } from "@/lib/utils";
import { bustCache } from "@/lib/cache";

async function activeSuperadmins(exceptId?: string) {
  return User.countDocuments({
    role: "superadmin",
    status: "active",
    deletedAt: null,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  });
}

export async function dashboardStats() {
  await dbConnect();
  const since = new Date(Date.now() - 30 * 86400000);
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const [customers, admins, pending, live, rejected, expired, today, openReports, messages, perDay, perCategory, recentAds, recentReports] =
    await Promise.all([
      User.countDocuments({ role: "customer", deletedAt: null }),
      User.countDocuments({ role: { $in: ["admin", "superadmin"] }, deletedAt: null }),
      Ad.countDocuments({ status: "pending" }),
      Ad.countDocuments({ status: "live" }),
      Ad.countDocuments({ status: "rejected" }),
      Ad.countDocuments({ status: "expired" }),
      Ad.countDocuments({ createdAt: { $gte: startToday }, status: { $ne: "deleted" } }),
      Report.countDocuments({ status: "open" }),
      Message.countDocuments(),
      Ad.aggregate([
        { $match: { createdAt: { $gte: since }, status: { $ne: "deleted" } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Ad.aggregate([
        { $match: { status: { $ne: "deleted" } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Ad.find({ status: { $ne: "deleted" } }).sort({ createdAt: -1 }).limit(6).populate("category", "name").lean(),
      Report.find().sort({ createdAt: -1 }).limit(6).populate("ad", "title slug").lean(),
    ]);
  const categories = await Category.find().lean();
  const names = new Map(categories.map((item) => [String(item._id), item.name]));
  return {
    customers,
    admins,
    pending,
    live,
    rejected,
    expired,
    today,
    openReports,
    messages,
    perDay: perDay.map((row) => ({ date: row._id as string, count: row.count as number })),
    perCategory: perCategory.map((row) => ({ name: names.get(String(row._id)) || "Unknown", count: row.count as number })),
    recentAds: recentAds.map((row) => ({ id: String(row._id), title: row.title, status: row.status, createdAt: row.createdAt })),
    recentReports: recentReports.map((row) => ({
      id: String(row._id),
      type: row.type,
      status: row.status,
      title: (row.ad as { title?: string } | null)?.title || "Removed ad",
    })),
  };
}


/** When an account is suspended its ads must stop showing. They go to "rejected" so an admin can re-approve them if the account is restored. */
async function suspendAdsOf(userId: unknown) {
  await Ad.updateMany(
    { user: userId, status: { $in: ["live", "pending"] } },
    { status: "rejected", isFeatured: false, rejectReason: "Posted from an account that was suspended." },
  );
}

export async function moderateAd(actor: SessionUser, id: string, action: string, reason = "", ip = "") {
  await dbConnect();
  const ad = await Ad.findById(id).populate("user", "email name");
  if (!ad || ad.status === "deleted") return { status: 404, message: "Ad not found" };
  const owner = ad.user as unknown as { email?: string; name?: string; _id?: unknown };
  if (action === "approve") {
    if (ad.status === "live") return { status: 409, message: "This ad is already approved and live." };
    const wasLive = Boolean(ad.expiresAt && ad.expiresAt.getTime() > Date.now());
    ad.status = "live";
    ad.rejectReason = "";
    // Keep an unexpired date (e.g. a live ad that went back to review after an edit) so edits cannot be used to extend an ad.
    if (!wasLive) ad.expiresAt = new Date(Date.now() + (ad.durationDays || 180) * 86400000);
    if (owner.email) {
      try {
        await sendPlainEmail(owner.email, "Your ad is live", [`Hello ${owner.name || "there"},`, `Good news: “${ad.title}” was approved and is now live on the marketplace.`]);
      } catch {
        // an email problem must not block moderation
      }
    }
  } else if (action === "reject") {
    if (ad.status === "rejected") return { status: 409, message: "This ad is already rejected." };
    if (!reason.trim()) return { status: 400, message: "Write a reason before rejecting. The owner receives it by email so they can fix the ad." };
    ad.status = "rejected";
    ad.isFeatured = false;
    ad.rejectReason = sanitizeText(reason).slice(0, 500);
    if (owner.email) {
      try {
        await sendPlainEmail(owner.email, "Your ad was not approved", [`Hello ${owner.name || "there"},`, `“${ad.title}” was rejected.`, ad.rejectReason, "You can edit the ad from My Account and submit it again."]);
      } catch {
        // an email problem must not block moderation
      }
    }
  } else if (action === "expire") {
    if (ad.status !== "live") return { status: 409, message: "Only live ads can be expired." };
    ad.status = "expired";
    ad.isFeatured = false;
    ad.expiresAt = new Date();
  } else if (action === "delete") {
    ad.status = "deleted";
    ad.isFeatured = false;
  } else if (action === "feature") {
    if (ad.status !== "live") return { status: 409, message: "Only live ads can be featured. Approve the ad first." };
    ad.isFeatured = true;
  } else if (action === "unfeature") ad.isFeatured = false;
  else return { status: 400, message: "Unknown action" };
  await ad.save();
  bustCache();
  await audit(actor.id, `ad_${action}`, String(ad._id), { title: ad.title }, ip);
  return { status: 200, message: "Ad updated" };
}

export function pageSize(raw: unknown, fallback = 10) {
  const n = Number(raw);
  return [10, 25, 50, 100].includes(n) ? n : fallback;
}

export async function listCustomers(q: string, page: number, limit = 10) {
  await dbConnect();
  const filter: Record<string, unknown> = { role: "customer", deletedAt: null };
  if (q) {
    const regex = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }
  const [total, items] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
  ]);
  return {
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    items: items.map((user) => ({
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    })),
  };
}

export async function customerAction(actor: SessionUser, id: string, action: string, ip: string) {
  await dbConnect();
  const user = await User.findOne({ _id: id, role: "customer" });
  if (!user || user.deletedAt) return { status: 404, message: "Customer not found" };
  if (action === "block") {
    user.status = "blocked";
    await user.save();
    await suspendAdsOf(user._id);
    await revokeAllSessions(id);
  } else if (action === "unblock") {
    user.status = "active";
    user.deletedAt = undefined;
    await user.save();
  } else if (action === "delete") {
    user.status = "blocked";
    user.deletedAt = new Date();
    await user.save();
    await Ad.updateMany({ user: id, status: { $ne: "deleted" } }, { status: "deleted" });
    await revokeAllSessions(id);
  } else if (action === "resend") {
    const token = randomToken();
    user.set("emailVerifyTokenHash", sha256(token));
    user.set("emailVerifyExpires", new Date(Date.now() + 24 * 60 * 60 * 1000));
    user.emailVerified = false;
    user.verifySentAt = new Date();
    await user.save();
    await sendLinkEmail(user.email, user.name, "verify", token);
  } else if (action === "reset") {
    const token = randomToken();
    user.set("resetTokenHash", sha256(token));
    user.set("resetExpires", new Date(Date.now() + 30 * 60 * 1000));
    await user.save();
    await sendLinkEmail(user.email, user.name, "reset", token);
  } else return { status: 400, message: "Unknown action" };
  await audit(actor.id, `customer_${action}`, user.email, {}, ip);
  return { status: 200, message: "Customer updated" };
}

export async function listStaff() {
  await dbConnect();
  const items = await User.find({ role: { $in: ["admin", "superadmin"] }, deletedAt: null }).sort({ createdAt: 1 }).lean();
  return items.map((user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }));
}

export async function createStaff(actor: SessionUser, body: unknown, ip: string) {
  const parsed = adminUserSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  if (parsed.data.role === "superadmin" && actor.role !== "superadmin") {
    return { status: 403, message: "Only a superadmin can create another superadmin" };
  }
  await dbConnect();
  const exists = await User.findOne({ email: parsed.data.email });
  if (exists) return { status: 409, message: "An account with this email already exists", errors: { email: "This email is already registered" } };
  let password = parsed.data.password || "";
  if (parsed.data.mode === "password") {
    const check = passwordSchema.safeParse(password);
    if (!check.success || !passwordAvoidsEmail(password, parsed.data.email)) {
      return { status: 400, message: "Temporary password does not meet the rules", errors: { password: "Use 8+ characters with upper, lower, number, and symbol" } };
    }
  } else {
    password = `${randomToken(9)}aA1!`;
  }
  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || "",
    passwordHash: await hashPassword(password),
    role: parsed.data.role,
    status: "active",
    emailVerified: true,
    createdBy: actor.id,
  });
  if (parsed.data.mode === "invite") {
    const token = randomToken();
    user.set("resetTokenHash", sha256(token));
    user.set("resetExpires", new Date(Date.now() + INVITE_MS));
    await user.save();
    await sendLinkEmail(user.email, user.name, "invite", token);
  } else {
    await sendPlainEmail(user.email, "Your AdWall admin account", [
      `Hello ${user.name}, an administrator created an account for you.`,
      "Sign in with the temporary password you were given, then change it.",
    ]);
  }
  await audit(actor.id, "admin_created", user.email, { role: user.role }, ip);
  return { status: 201, message: parsed.data.mode === "invite" ? "Invite sent" : "Admin created" };
}

export async function updateStaff(actor: SessionUser, id: string, body: { name?: string; phone?: string; role?: "admin" | "superadmin"; status?: "active" | "blocked" }, ip: string) {
  await dbConnect();
  const user = await User.findOne({ _id: id, role: { $in: ["admin", "superadmin"] }, deletedAt: null });
  if (!user) return { status: 404, message: "Admin not found" };
  if (body.role && body.role !== user.role) {
    if (actor.role !== "superadmin") return { status: 403, message: "Only a superadmin can change this role" };
    if (String(user._id) === actor.id) return { status: 400, message: "You cannot change your own role" };
    if (user.role === "superadmin" && body.role !== "superadmin" && (await activeSuperadmins(id)) < 1) {
      return { status: 400, message: "The last superadmin cannot be demoted" };
    }
    user.role = body.role;
  }
  if (body.status && body.status !== user.status) {
    if (String(user._id) === actor.id) return { status: 400, message: "You cannot deactivate yourself" };
    if (user.role === "superadmin" && body.status !== "active" && (await activeSuperadmins(id)) < 1) {
      return { status: 400, message: "The last superadmin cannot be deactivated" };
    }
    user.status = body.status;
    if (body.status !== "active") await revokeAllSessions(id);
  }
  if (body.name) user.name = sanitizeText(body.name);
  if (typeof body.phone === "string") user.phone = body.phone;
  await user.save();
  await audit(actor.id, "admin_updated", user.email, {}, ip);
  return { status: 200, message: "Admin updated" };
}

export async function deleteStaff(actor: SessionUser, id: string, ip: string) {
  await dbConnect();
  const user = await User.findOne({ _id: id, role: { $in: ["admin", "superadmin"] }, deletedAt: null });
  if (!user) return { status: 404, message: "Admin not found" };
  if (String(user._id) === actor.id) return { status: 400, message: "You cannot delete yourself" };
  if (user.role === "superadmin") {
    if (actor.role !== "superadmin") return { status: 403, message: "Only a superadmin can delete a superadmin" };
    if ((await activeSuperadmins(id)) < 1) return { status: 400, message: "The last superadmin cannot be removed" };
  }
  user.status = "blocked";
  user.deletedAt = new Date();
  await user.save();
  await revokeAllSessions(id);
  await audit(actor.id, "admin_deleted", user.email, {}, ip);
  return { status: 200, message: "Admin removed" };
}

export async function listReports(status: string, type: string, page: number, limit = 10) {
  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  if (type && type !== "all") filter.type = type;
  const [total, items] = await Promise.all([
    Report.countDocuments(filter),
    Report.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("ad", "title slug status user").lean(),
  ]);
  return { total, page, pages: Math.max(1, Math.ceil(total / limit)), items };
}

export async function handleReport(actor: SessionUser, id: string, action: string, ip: string) {
  await dbConnect();
  const report = await Report.findById(id).populate("ad");
  if (!report) return { status: 404, message: "Report not found" };
  if (action === "resolve") report.status = "resolved";
  else if (action === "dismiss") report.status = "dismissed";
  else if (action === "delete-ad") {
    report.status = "resolved";
    if (report.ad) await Ad.updateOne({ _id: (report.ad as { _id: unknown })._id }, { status: "deleted" });
  } else if (action === "block-user") {
    report.status = "resolved";
    const ad = report.ad as { user?: unknown } | null;
    if (ad?.user) {
      await User.updateOne({ _id: ad.user }, { status: "blocked" });
      await suspendAdsOf(ad.user);
      await revokeAllSessions(String(ad.user));
    }
  } else return { status: 400, message: "Unknown action" };
  report.handledBy = actor.id as unknown as typeof report.handledBy;
  await report.save();
  await audit(actor.id, `report_${action}`, String(report._id), {}, ip);
  return { status: 200, message: "Report updated" };
}

export async function listAudit(actor: string, action: string, page: number, limit = 10) {
  await dbConnect();
  const filter: Record<string, unknown> = {};
  if (actor) filter.actor = actor;
  if (action) filter.action = new RegExp(escapeRegex(action), "i");
  const [total, items] = await Promise.all([
    AuditLog.countDocuments(filter),
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("actor", "name email").lean(),
  ]);
  return { total, page, pages: Math.max(1, Math.ceil(total / limit)), items };
}

export async function saveSettings(body: Record<string, unknown>, actorId: string, ip: string) {
  await dbConnect();
  const settings = await Setting.findOneAndUpdate(
    { key: "site" },
    {
      siteName: sanitizeText(String(body.siteName || "AdWall")).slice(0, 60),
      logoUrl: String(body.logoUrl || "").slice(0, 300),
      contactEmail: String(body.contactEmail || "").toLowerCase().slice(0, 120),
      moderationEnabled: Boolean(body.moderationEnabled),
      maxImages: Math.min(5, Math.max(1, Number(body.maxImages) || 5)),
    },
    { upsert: true, new: true },
  );
  await audit(actorId, "settings_updated", "site", {}, ip);
  return settings;
}

export async function adminMessages(page: number, limit = 10) {
  await dbConnect();
  const [total, items] = await Promise.all([
    Message.countDocuments(),
    Message.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("ad", "title slug").lean(),
  ]);
  return { total, page, pages: Math.max(1, Math.ceil(total / limit)), items };
}
