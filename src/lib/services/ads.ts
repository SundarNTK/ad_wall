import { dbConnect } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { Category, Counter, ExpiryOption, Keyword, Location, ReportType, Setting, SubCategory } from "@/models/Catalog";
import { Favorite, Message, Report } from "@/models/Engagement";
import { adInputSchema, contactSellerSchema, reportSchema } from "@/lib/validators/ad";
import { zodFieldErrors } from "@/lib/validators/auth";
import { DAILY_AD_LIMIT } from "@/lib/constants";
import { sanitizeText } from "@/lib/sanitize";
import { sendPlainEmail } from "@/lib/mailer";
import { escapeRegex, slugify } from "@/lib/utils";
import { presentAd } from "@/lib/services/listings";
import type { SessionUser } from "@/lib/auth";

type Result = { status: number; message: string; errors?: Record<string, string>; data?: unknown };

async function nextAdNumber() {
  await Counter.updateOne({ key: "ad" }, { $setOnInsert: { seq: 10000 } }, { upsert: true });
  const counter = await Counter.findOneAndUpdate({ key: "ad" }, { $inc: { seq: 1 } }, { new: true });
  return counter?.seq || Date.now();
}

function cleanAttributes(raw: Record<string, string | number>, fields: { key: string; label?: string; type: string; required?: boolean; options?: string[] }[]) {
  const attributes: Record<string, string | number> = {};
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = raw[field.key];
    if ((value === undefined || value === "") && field.required) {
      errors[`attributes.${field.key}`] = `${field.label || field.key} is required`;
      continue;
    }
    if (value === undefined || value === "") continue;
    if (field.type === "number") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) errors[`attributes.${field.key}`] = "Enter a number";
      else attributes[field.key] = parsed;
    } else if (field.type === "select") {
      const text = sanitizeText(String(value));
      if (field.options?.length && !field.options.includes(text)) errors[`attributes.${field.key}`] = "Choose a valid option";
      else attributes[field.key] = text;
    } else {
      attributes[field.key] = sanitizeText(String(value)).slice(0, 120);
    }
  }
  return { attributes, errors };
}

export async function saveAd(user: SessionUser, body: unknown, adId?: string): Promise<Result> {
  const parsed = adInputSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  if (parsed.data.website?.trim()) return { status: 201, message: "Ad submitted" };
  if (!user.emailVerified) return { status: 403, message: "Verify your email before posting an ad" };
  await dbConnect();
  const [category, sub, location, settings, keywords, expiryOptions] = await Promise.all([
    Category.findOne({ _id: parsed.data.categoryId, isActive: true }),
    SubCategory.findOne({ _id: parsed.data.subCategoryId, category: parsed.data.categoryId, isActive: true }),
    Location.findOne({ _id: parsed.data.locationId, isActive: true }),
    Setting.findOne({ key: "site" }),
    Keyword.find({ isActive: true }).lean(),
    ExpiryOption.find({ isActive: true }).select("days").lean(),
  ]);
  if (!category || !sub || !location) return { status: 400, message: "Choose a valid category, subcategory, and location" };
  // The duration must be one of the active Expiry options (or 180 days when none are configured).
  const allowedDays = expiryOptions.length ? expiryOptions.map((option) => Number(option.days)) : [180];
  if (!allowedDays.includes(parsed.data.durationDays)) {
    let keep = false;
    if (adId) {
      const existing = await Ad.findOne({ _id: adId, user: user.id }).select("durationDays").lean();
      keep = Boolean(existing && existing.durationDays === parsed.data.durationDays); // an edit may keep its original duration
    }
    if (!keep) return { status: 400, message: "Choose a valid ad duration", errors: { durationDays: "Choose one of the listed durations" } };
  }
  const maxImages = settings?.maxImages || 5;
  if (parsed.data.images.length > maxImages) return { status: 400, message: `You can upload up to ${maxImages} photos`, errors: { images: `Maximum ${maxImages} photos` } };
  const title = sanitizeText(parsed.data.title);
  const description = sanitizeText(parsed.data.description);
  const blocked = keywords.find((word) => `${title} ${description}`.toLowerCase().includes(String(word.word)));
  if (blocked) return { status: 400, message: "This ad includes a prohibited term", errors: { description: "Remove prohibited wording and try again" } };
  const { attributes, errors } = cleanAttributes(parsed.data.attributes || {}, (sub.fields || []) as { key: string; type: string; required?: boolean; options?: string[]; label?: string }[]);
  if (Object.keys(errors).length) return { status: 400, message: "Check the details", errors };
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  if (!adId) {
    const today = await Ad.countDocuments({ user: user.id, createdAt: { $gte: dayStart }, status: { $ne: "deleted" } });
    if (today >= DAILY_AD_LIMIT) return { status: 429, message: "You can post up to 10 ads per day" };
  }
  const duplicate = await Ad.findOne({
    user: user.id,
    category: category._id,
    title: new RegExp(`^${escapeRegex(title)}$`, "i"),
    createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    status: { $ne: "deleted" },
    ...(adId ? { _id: { $ne: adId } } : {}),
  });
  if (duplicate) return { status: 409, message: "You already posted a very similar ad in the last 48 hours" };
  const moderation = settings?.moderationEnabled !== false;
  const price = parsed.data.priceType === "free" ? 0 : parsed.data.price || 0;
  const payload = {
    category: category._id,
    subCategory: sub._id,
    location: location._id,
    title,
    description,
    price,
    priceType: parsed.data.priceType,
    attributes,
    images: parsed.data.images.slice(0, maxImages).map((image) => ({ url: image.url, publicId: image.publicId || "" })),
    contactName: sanitizeText(parsed.data.contactName),
    contactEmail: parsed.data.contactEmail,
    contactPhone: parsed.data.contactPhone || "",
    showPhone: parsed.data.showPhone,
    city: sanitizeText(parsed.data.city),
    zip: sanitizeText(parsed.data.zip || ""),
    lat: typeof parsed.data.lat === "number" && typeof parsed.data.lng === "number" ? parsed.data.lat : null,
    lng: typeof parsed.data.lat === "number" && typeof parsed.data.lng === "number" ? parsed.data.lng : null,
    durationDays: parsed.data.durationDays,
    isPrivateSeller: parsed.data.isPrivateSeller,
  };
  if (adId) {
    const ad = await Ad.findOne({ _id: adId, user: user.id, status: { $ne: "deleted" } });
    if (!ad) return { status: 404, message: "Ad not found" };
    Object.assign(ad, payload);
    if (moderation) ad.status = "pending";
    else if (ad.status === "rejected" || ad.status === "pending") {
      ad.status = "live";
      ad.expiresAt = new Date(Date.now() + payload.durationDays * 86400000);
    }
    await ad.save();
    return { status: 200, message: moderation ? "Ad updated and sent for review" : "Ad updated", data: { id: String(ad._id), slug: ad.slug } };
  }
  const adNumber = await nextAdNumber();
  const ad = await Ad.create({
    ...payload,
    user: user.id,
    adNumber,
    slug: `${slugify(title)}-${adNumber}`,
    status: moderation ? "pending" : "live",
    expiresAt: moderation ? undefined : new Date(Date.now() + payload.durationDays * 86400000),
  });
  return { status: 201, message: moderation ? "Ad submitted for review" : "Your ad is live", data: { id: String(ad._id), slug: ad.slug, status: ad.status } };
}

export async function renewAd(userId: string, adId: string, republish: boolean): Promise<Result> {
  await dbConnect();
  const ad = await Ad.findOne({ _id: adId, user: userId, status: { $ne: "deleted" } });
  if (!ad) return { status: 404, message: "Ad not found" };
  const settings = await Setting.findOne({ key: "site" });
  const moderation = settings?.moderationEnabled !== false;
  const soon = ad.expiresAt ? ad.expiresAt.getTime() - Date.now() <= 3 * 86400000 : false;
  if (!republish) {
    if (ad.status !== "live" || !soon) return { status: 400, message: "Renewal opens 3 days before expiry" };
    const base = ad.expiresAt && ad.expiresAt.getTime() > Date.now() ? ad.expiresAt.getTime() : Date.now();
    ad.expiresAt = new Date(base + (ad.durationDays || 180) * 86400000);
    ad.renewedAt = new Date();
    await ad.save();
    return { status: 200, message: "Ad renewed" };
  }
  if (ad.status !== "expired") return { status: 400, message: "Only expired ads can be republished" };
  ad.status = moderation ? "pending" : "live";
  ad.expiresAt = new Date(Date.now() + (ad.durationDays || 180) * 86400000);
  ad.renewedAt = new Date();
  await ad.save();
  return { status: 200, message: moderation ? "Ad sent for review" : "Ad republished" };
}

export async function ownerDeleteAd(userId: string, adId: string): Promise<Result> {
  const ad = await Ad.findOne({ _id: adId, user: userId, status: { $ne: "deleted" } });
  if (!ad) return { status: 404, message: "Ad not found" };
  ad.status = "deleted";
  await ad.save();
  return { status: 200, message: "Ad deleted" };
}

export async function toggleFavorite(userId: string, adId: string): Promise<Result> {
  await dbConnect();
  const ad = await Ad.findOne({ _id: adId, status: "live" });
  if (!ad) return { status: 404, message: "Ad not found" };
  const existing = await Favorite.findOne({ user: userId, ad: adId });
  if (existing) {
    await existing.deleteOne();
    return { status: 200, message: "Removed from favorites", data: { saved: false } };
  }
  await Favorite.create({ user: userId, ad: adId });
  return { status: 200, message: "Saved to favorites", data: { saved: true } };
}

export async function contactSeller(adId: string, body: unknown): Promise<Result> {
  const parsed = contactSellerSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  if (parsed.data.website?.trim()) return { status: 200, message: "Message sent" };
  await dbConnect();
  const ad = await Ad.findOne({ _id: adId, status: "live" }).populate("user", "email name");
  if (!ad) return { status: 404, message: "Ad not found" };
  const seller = ad.user as unknown as { _id: unknown; email?: string; name?: string };
  await Message.create({
    ad: ad._id,
    fromName: sanitizeText(parsed.data.fromName),
    fromEmail: parsed.data.fromEmail,
    body: sanitizeText(parsed.data.body),
    toUser: seller._id,
  });
  const to = ad.contactEmail || seller.email;
  if (to) {
    await sendPlainEmail(to, `New message about ${ad.title}`, [
      `${parsed.data.fromName} (${parsed.data.fromEmail}) wrote:`,
      sanitizeText(parsed.data.body),
      "Reply directly to the sender. Their address is in this message, and yours was not shown on the ad.",
    ]);
  }
  return { status: 200, message: "Message sent to the seller" };
}

export async function reportAd(adId: string, body: unknown): Promise<Result> {
  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  if (parsed.data.website?.trim()) return { status: 200, message: "Report received" };
  await dbConnect();
  const [ad, type] = await Promise.all([
    Ad.findOne({ _id: adId, status: { $ne: "deleted" } }),
    ReportType.findOne({ key: parsed.data.type, isActive: true }),
  ]);
  if (!ad) return { status: 404, message: "Ad not found" };
  if (!type) return { status: 400, message: "Choose a report type", errors: { type: "Choose a report type" } };
  await Report.create({
    ad: ad._id,
    type: type.key,
    email: parsed.data.email,
    url: sanitizeText(parsed.data.url || ""),
    comment: sanitizeText(parsed.data.comment || ""),
  });
  return { status: 201, message: "Thanks. Our team will review this report." };
}

export async function myAds(userId: string) {
  await dbConnect();
  const rows = await Ad.find({ user: userId, status: { $ne: "deleted" } })
    .sort({ createdAt: -1 })
    .populate("category", "name slug")
    .populate("subCategory", "name slug")
    .populate("location", "city state slug")
    .lean();
  return rows.map((row) => presentAd(row as unknown as Record<string, unknown>, true));
}
