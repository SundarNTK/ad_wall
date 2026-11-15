import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { dbConnect } from "./db";
import { User, type UserDoc } from "@/models/User";
import { RefreshToken } from "@/models/Engagement";
import {
  ACCESS_SECONDS,
  ADMIN_ACCESS,
  ADMIN_REFRESH,
  ADMIN_ROLES,
  BCRYPT_COST,
  CUSTOMER_ACCESS,
  CUSTOMER_REFRESH,
  REFRESH_SECONDS,
  cookieBase,
  type Portal,
  type Role,
} from "./constants";
import { newJti, readToken, sha256, signToken, type TokenPayload } from "./tokens";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: string;
  emailVerified: boolean;
  avatar: string;
  tokenVersion: number;
};

const accessName = (portal: Portal) => (portal === "admin" ? ADMIN_ACCESS : CUSTOMER_ACCESS);
const refreshName = (portal: Portal) => (portal === "admin" ? ADMIN_REFRESH : CUSTOMER_REFRESH);

export function toSession(user: Pick<UserDoc, "_id" | "name" | "email" | "phone" | "role" | "status" | "emailVerified" | "avatar" | "tokenVersion">): SessionUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role as Role,
    status: user.status,
    emailVerified: Boolean(user.emailVerified),
    avatar: user.avatar || "",
    tokenVersion: user.tokenVersion || 0,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

async function issue(user: SessionUser, portal: Portal, remember: boolean) {
  const jti = newJti();
  const access = await signToken(
    { sub: user.id, role: user.role, tv: user.tokenVersion, portal, typ: "access" },
    ACCESS_SECONDS,
  );
  const refresh = await signToken(
    { sub: user.id, role: user.role, tv: user.tokenVersion, portal, typ: "refresh", jti },
    REFRESH_SECONDS,
  );
  await dbConnect();
  await RefreshToken.create({
    user: user.id,
    jti,
    tokenHash: sha256(refresh),
    portal,
    expiresAt: new Date(Date.now() + REFRESH_SECONDS * 1000),
  });
  const jar = await cookies();
  const base = cookieBase();
  jar.set(accessName(portal), access, { ...base, maxAge: ACCESS_SECONDS });
  jar.set(refreshName(portal), refresh, remember ? { ...base, maxAge: REFRESH_SECONDS } : base);
}

export async function establishSession(user: SessionUser, portal: Portal, remember = true) {
  if (portal === "admin" && !ADMIN_ROLES.includes(user.role)) {
    throw new Error("NO_ADMIN_ACCESS");
  }
  await issue(user, portal, remember);
}

export async function clearSession(portal: Portal, revokeJti?: string) {
  const jar = await cookies();
  const refresh = jar.get(refreshName(portal))?.value;
  if (refresh || revokeJti) {
    try {
      const payload = refresh ? await readToken(refresh, "refresh") : undefined;
      const jti = revokeJti || payload?.jti;
      if (jti) await RefreshToken.updateOne({ jti }, { revokedAt: new Date() });
    } catch {
      /* expired refresh still needs the cookies cleared */
    }
  }
  const base = cookieBase();
  jar.set(accessName(portal), "", { ...base, maxAge: 0 });
  jar.set(refreshName(portal), "", { ...base, maxAge: 0 });
}

export async function revokeAllSessions(userId: string) {
  await dbConnect();
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
}

async function userFromPayload(payload: TokenPayload) {
  await dbConnect();
  const user = await User.findById(payload.sub);
  if (!user || user.deletedAt || user.status !== "active") return null;
  if ((user.tokenVersion || 0) !== payload.tv) return null;
  if (payload.portal === "admin" && !ADMIN_ROLES.includes(user.role as Role)) return null;
  return user;
}

export async function getSession(portal: Portal) {
  const jar = await cookies();
  const token = jar.get(accessName(portal))?.value;
  if (!token) return null;
  try {
    const payload = await readToken(token, "access");
    if (payload.typ !== "access" || payload.portal !== portal) return null;
    const user = await userFromPayload(payload);
    return user ? toSession(user) : null;
  } catch {
    return null;
  }
}

export async function refreshSession(portal: Portal, rotate: boolean) {
  const jar = await cookies();
  const token = jar.get(refreshName(portal))?.value;
  if (!token) return null;
  let payload: TokenPayload;
  try {
    payload = await readToken(token, "refresh");
  } catch {
    return null;
  }
  if (payload.typ !== "refresh" || payload.portal !== portal || !payload.jti) return null;
  await dbConnect();
  const stored = await RefreshToken.findOne({ jti: payload.jti, portal });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.tokenHash !== sha256(token)) {
    if (stored?.revokedAt && payload.sub) await revokeAllSessions(payload.sub);
    return null;
  }
  const user = await userFromPayload(payload);
  if (!user) return null;
  const session = toSession(user);
  if (rotate) {
    stored.revokedAt = new Date();
    const nextJti = newJti();
    stored.replacedBy = nextJti;
    await stored.save();
    const refresh = await signToken(
      { sub: session.id, role: session.role, tv: session.tokenVersion, portal, typ: "refresh", jti: nextJti },
      REFRESH_SECONDS,
    );
    await RefreshToken.create({
      user: session.id,
      jti: nextJti,
      tokenHash: sha256(refresh),
      portal,
      expiresAt: new Date(Date.now() + REFRESH_SECONDS * 1000),
    });
    jar.set(refreshName(portal), refresh, { ...cookieBase(), maxAge: REFRESH_SECONDS });
  }
  const access = await signToken(
    { sub: session.id, role: session.role, tv: session.tokenVersion, portal, typ: "access" },
    ACCESS_SECONDS,
  );
  jar.set(accessName(portal), access, { ...cookieBase(), maxAge: ACCESS_SECONDS });
  return session;
}
