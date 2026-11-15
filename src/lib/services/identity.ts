import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import {
  LOCK_MS,
  MAX_LOGIN_FAILS,
  RESET_MS,
  VERIFY_MS,
  type Portal,
} from "@/lib/constants";
import { checkPassword, clearSession, establishSession, hashPassword, revokeAllSessions, toSession, type SessionUser } from "@/lib/auth";
import { sendLinkEmail } from "@/lib/mailer";
import { randomToken, sha256 } from "@/lib/tokens";
import { audit } from "@/lib/audit";
import {
  changeEmailSchema,
  changePasswordSchema,
  forgotSchema,
  loginSchema,
  passwordAvoidsEmail,
  passwordSchema,
  registerSchema,
  resetSchema,
  verifySchema,
  zodFieldErrors,
} from "@/lib/validators/auth";

const GENERIC = "Invalid email or password";
const RESET_MSG = "If an account exists, a reset link has been sent";

type Result = { status: number; message: string; errors?: Record<string, string>; user?: SessionUser };

function honeypot(website?: string) {
  return Boolean(website && website.trim());
}

export async function registerAccount(body: unknown, ip: string): Promise<Result> {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  if (honeypot(parsed.data.website)) return { status: 201, message: "Account created. Check your email to verify it." };
  await dbConnect();
  const existing = await User.findOne({ email: parsed.data.email });
  if (existing) return { status: 409, message: "An account with this email already exists", errors: { email: "This email is already registered" } };
  const token = randomToken();
  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || "",
    passwordHash: await hashPassword(parsed.data.password),
    role: "customer",
    status: "active",
    emailVerified: false,
    emailVerifyTokenHash: sha256(token),
    emailVerifyExpires: new Date(Date.now() + VERIFY_MS),
    verifySentAt: new Date(),
  });
  await sendLinkEmail(user.email, user.name, "verify", token);
  const session = toSession(user);
  await establishSession(session, "customer", true);
  await audit(session.id, "register", user.email, {}, ip);
  return { status: 201, message: "Account created. Check your email to verify it.", user: session };
}

export async function loginAccount(body: unknown, portal: Portal, ip: string): Promise<Result> {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  if (honeypot(parsed.data.website)) return { status: 401, message: GENERIC };
  await dbConnect();
  const user = await User.findOne({ email: parsed.data.email, deletedAt: null }).select("+passwordHash");
  if (!user) {
    await audit(undefined, "login_failed", parsed.data.email, { portal, reason: "unknown" }, ip);
    return { status: 401, message: GENERIC };
  }
  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    return { status: 429, message: "Too many failed attempts. Try again in a few minutes." };
  }
  const match = await checkPassword(parsed.data.password, user.passwordHash);
  if (!match) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_LOGIN_FAILS) {
      user.lockUntil = new Date(Date.now() + LOCK_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    await audit(String(user._id), "login_failed", user.email, { portal }, ip);
    return { status: 401, message: GENERIC };
  }
  if (user.status !== "active") {
    return { status: 403, message: "This account is disabled." };
  }
  if (portal === "admin" && user.role === "customer") {
    return { status: 403, message: "You do not have access to the admin panel" };
  }
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();
  const session = toSession(user);
  await establishSession(session, portal, Boolean(parsed.data.remember));
  await audit(session.id, "login", user.email, { portal }, ip);
  return { status: 200, message: "Welcome back", user: session };
}

export async function forgotPassword(body: unknown, portal: Portal) {
  const parsed = forgotSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  if (!honeypot(parsed.data.website)) {
    await dbConnect();
    const user = await User.findOne({ email: parsed.data.email, deletedAt: null, status: "active" });
    if (user && (portal === "customer" || user.role !== "customer")) {
      const token = randomToken();
      user.set("resetTokenHash", sha256(token));
      user.set("resetExpires", new Date(Date.now() + RESET_MS));
      await user.save();
      await sendLinkEmail(user.email, user.name, portal === "admin" ? "admin-reset" : "reset", token);
    }
  }
  return { status: 200, message: RESET_MSG };
}

export async function resetPassword(body: unknown, ip: string) {
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  await dbConnect();
  const hash = sha256(parsed.data.token);
  const user = await User.findOne({ resetTokenHash: hash, deletedAt: null }).select("+resetTokenHash +passwordHash");
  if (!user || !user.resetExpires || user.resetExpires.getTime() < Date.now()) {
    return { status: 400, message: "This reset link is invalid or has expired." };
  }
  const local = user.email.split("@")[0] || "";
  const passwordCheck = passwordSchema.safeParse(parsed.data.password);
  if (!passwordCheck.success || !passwordAvoidsEmail(parsed.data.password, user.email)) {
    return {
      status: 400,
      message: "Choose a stronger password",
      errors: { password: local.length >= 3 && parsed.data.password.toLowerCase().includes(local.toLowerCase()) ? "Password cannot contain your email name" : "Password does not meet the rules" },
    };
  }
  user.passwordHash = await hashPassword(parsed.data.password);
  user.set("resetTokenHash", undefined);
  user.set("resetExpires", undefined);
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();
  await revokeAllSessions(String(user._id));
  await audit(String(user._id), "password_reset", user.email, {}, ip);
  return { status: 200, message: "Password updated. Sign in with your new password." };
}

export async function verifyEmail(body: unknown) {
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "This verification link is invalid." };
  await dbConnect();
  const hash = sha256(parsed.data.token);
  const pending = await User.findOne({ pendingEmailTokenHash: hash }).select("+pendingEmailTokenHash");
  if (pending) {
    if (!pending.pendingEmailExpires || pending.pendingEmailExpires.getTime() < Date.now() || !pending.pendingEmail) {
      return { status: 400, message: "This verification link is invalid or has expired." };
    }
    const clash = await User.findOne({ email: pending.pendingEmail, _id: { $ne: pending._id } });
    if (clash) return { status: 409, message: "That email is already in use." };
    pending.email = pending.pendingEmail;
    pending.emailVerified = true;
    pending.pendingEmail = undefined;
    pending.set("pendingEmailTokenHash", undefined);
    pending.set("pendingEmailExpires", undefined);
    await pending.save();
    return { status: 200, message: "Email updated and verified." };
  }
  const user = await User.findOne({ emailVerifyTokenHash: hash }).select("+emailVerifyTokenHash");
  if (!user || !user.emailVerifyExpires || user.emailVerifyExpires.getTime() < Date.now()) {
    return { status: 400, message: "This verification link is invalid or has expired." };
  }
  user.emailVerified = true;
  user.set("emailVerifyTokenHash", undefined);
  user.set("emailVerifyExpires", undefined);
  await user.save();
  return { status: 200, message: "Email verified. You can post ads now." };
}

export async function resendVerification(userId: string) {
  await dbConnect();
  const user = await User.findById(userId).select("+emailVerifyTokenHash");
  if (!user) return { status: 404, message: "Account not found" };
  if (user.emailVerified) return { status: 200, message: "This email is already verified." };
  if (user.verifySentAt && Date.now() - user.verifySentAt.getTime() < 60_000) {
    return { status: 429, message: "Please wait a minute before requesting another email." };
  }
  const token = randomToken();
  user.set("emailVerifyTokenHash", sha256(token));
  user.set("emailVerifyExpires", new Date(Date.now() + VERIFY_MS));
  user.verifySentAt = new Date();
  await user.save();
  await sendLinkEmail(user.email, user.name, "verify", token);
  return { status: 200, message: "Verification email sent." };
}

export async function changeOwnPassword(userId: string, body: unknown, portal: Portal) {
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  await dbConnect();
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) return { status: 404, message: "Account not found" };
  if (!passwordAvoidsEmail(parsed.data.password, user.email)) {
    return { status: 400, message: "Choose a stronger password", errors: { password: "Password cannot contain your email name" } };
  }
  if (!(await checkPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { status: 400, message: "Current password is incorrect", errors: { currentPassword: "Current password is incorrect" } };
  }
  user.passwordHash = await hashPassword(parsed.data.password);
  await user.save();
  await revokeAllSessions(userId);
  const fresh = await User.findById(userId);
  if (!fresh) return { status: 500, message: "Could not refresh the session" };
  await establishSession(toSession(fresh), portal, true);
  return { status: 200, message: "Password updated", user: toSession(fresh) };
}

export async function requestEmailChange(userId: string, body: unknown) {
  const parsed = changeEmailSchema.safeParse(body);
  if (!parsed.success) return { status: 400, message: "Check the form", errors: zodFieldErrors(parsed.error) };
  await dbConnect();
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) return { status: 404, message: "Account not found" };
  if (!(await checkPassword(parsed.data.password, user.passwordHash))) {
    return { status: 400, message: "Password is incorrect", errors: { password: "Password is incorrect" } };
  }
  if (parsed.data.email === user.email) return { status: 400, message: "That is already your email" };
  const clash = await User.findOne({ email: parsed.data.email });
  if (clash) return { status: 409, message: "An account with this email already exists", errors: { email: "This email is already registered" } };
  const token = randomToken();
  user.pendingEmail = parsed.data.email;
  user.set("pendingEmailTokenHash", sha256(token));
  user.set("pendingEmailExpires", new Date(Date.now() + VERIFY_MS));
  await user.save();
  await sendLinkEmail(parsed.data.email, user.name, "verify", token);
  return { status: 200, message: "Check the new inbox to confirm this email." };
}

export async function logoutPortal(portal: Portal) {
  await clearSession(portal);
}

export { RESET_MSG };
