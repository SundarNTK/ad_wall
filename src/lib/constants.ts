export const CUSTOMER_ACCESS = "ca_token";
export const CUSTOMER_REFRESH = "ca_refresh";
export const ADMIN_ACCESS = "ca_admin_token";
export const ADMIN_REFRESH = "ca_admin_refresh";

export const ACCESS_SECONDS = 60 * 15;
export const REFRESH_SECONDS = 60 * 60 * 24 * 7;
export const VERIFY_MS = 1000 * 60 * 60 * 24;
export const RESET_MS = 1000 * 60 * 30;
export const INVITE_MS = 1000 * 60 * 60 * 48;
export const LOCK_MS = 1000 * 60 * 15;
export const MAX_LOGIN_FAILS = 5;
export const BCRYPT_COST = 12;
export const MAX_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const DAILY_AD_LIMIT = 10;

export type Role = "customer" | "admin" | "superadmin";
export type Portal = "customer" | "admin";
export type AdStatus = "pending" | "live" | "rejected" | "expired" | "deleted";
export type PriceType = "fixed" | "negotiable" | "free" | "contact";

export const ADMIN_ROLES: Role[] = ["admin", "superadmin"];

export function cookieBase() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}
