import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Ad } from "@/models/Ad";
import { Favorite, Message, SavedSearch } from "@/models/Engagement";
import { checkPassword, clearSession, revokeAllSessions, type SessionUser } from "@/lib/auth";
import { deleteAccountSchema, profileSchema, zodFieldErrors } from "@/lib/validators/auth";
import { savedSearchSchema } from "@/lib/validators/ad";
import { sanitizeText } from "@/lib/sanitize";
import { presentAd } from "@/lib/services/listings";
import type { Portal } from "@/lib/constants";

export async function updateProfile(userId: string, body: unknown) {
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  await dbConnect();
  const user = await User.findByIdAndUpdate(userId, { name: parsed.data.name, phone: parsed.data.phone || "" }, { new: true });
  if (!user) return { status: 404, message: "Account not found" };
  return { status: 200, message: "Profile saved", user };
}

export async function updateAvatar(userId: string, avatar: string) {
  await User.findByIdAndUpdate(userId, { avatar });
  return { status: 200, message: "Photo updated" };
}

export async function removeAccount(user: SessionUser, body: unknown, portal: Portal) {
  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  await dbConnect();
  const record = await User.findById(user.id).select("+passwordHash");
  if (!record) return { status: 404, message: "Account not found" };
  if (record.role !== "customer") return { status: 400, message: "Admin accounts are removed from the admin panel" };
  if (!(await checkPassword(parsed.data.password, record.passwordHash))) {
    return { status: 400, message: "Password is incorrect", errors: { password: "Password is incorrect" } };
  }
  record.status = "blocked";
  record.deletedAt = new Date();
  await record.save();
  await Ad.updateMany({ user: user.id, status: { $ne: "deleted" } }, { status: "deleted" });
  await revokeAllSessions(user.id);
  await clearSession(portal);
  return { status: 200, message: "Account deleted" };
}

export async function inbox(userId: string) {
  await dbConnect();
  return Message.find({ toUser: userId }).sort({ createdAt: -1 }).populate("ad", "title slug").lean();
}

export async function setMessage(userId: string, id: string, action: "read" | "delete") {
  const message = await Message.findOne({ _id: id, toUser: userId });
  if (!message) return { status: 404, message: "Message not found" };
  if (action === "delete") await message.deleteOne();
  else {
    message.isRead = true;
    await message.save();
  }
  return { status: 200, message: action === "delete" ? "Message deleted" : "Marked as read" };
}

export async function favoritesFor(userId: string) {
  await dbConnect();
  const rows = await Favorite.find({ user: userId }).populate({
    path: "ad",
    match: { status: "live" },
    populate: [
      { path: "category", select: "name slug" },
      { path: "subCategory", select: "name slug" },
      { path: "location", select: "city state slug" },
    ],
  });
  return rows
    .map((row) => row.ad)
    .filter(Boolean)
    .map((ad) => presentAd(ad as unknown as Record<string, unknown>));
}

export async function listSearches(userId: string) {
  return SavedSearch.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

export async function addSearch(userId: string, body: unknown) {
  const parsed = savedSearchSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Name this search", errors: zodFieldErrors(parsed.error) };
  const count = await SavedSearch.countDocuments({ user: userId });
  if (count >= 20) return { status: 400, message: "You can save up to 20 searches" };
  const saved = await SavedSearch.create({ user: userId, label: sanitizeText(parsed.data.label), query: parsed.data.query });
  return { status: 201, message: "Search saved", data: saved };
}

export async function removeSearch(userId: string, id: string) {
  await SavedSearch.deleteOne({ _id: id, user: userId });
  return { status: 200, message: "Search removed" };
}
