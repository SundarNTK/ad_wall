import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_ACCESS, ADMIN_REFRESH, CUSTOMER_ACCESS, CUSTOMER_REFRESH } from "@/lib/constants";

const ADMIN_PUBLIC = new Set(["/admin/login", "/admin/forgot-password", "/admin/reset-password"]);

async function accessOk(token: string | undefined, portal: "customer" | "admin", roles?: string[]) {
  if (!token || !process.env.JWT_SECRET) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    if (payload.typ !== "access" || payload.portal !== portal) return false;
    if (roles && !roles.includes(String(payload.role))) return false;
    return true;
  } catch {
    return false;
  }
}

function gate(req: NextRequest, pathname: string, loginPath: string, refreshPath: string, hasRefresh: boolean) {
  const url = req.nextUrl.clone();
  if (hasRefresh) {
    url.pathname = refreshPath;
    url.search = "";
    url.searchParams.set("redirect", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  url.pathname = loginPath;
  url.search = "";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (ADMIN_PUBLIC.has(pathname)) return NextResponse.next();
    if (await accessOk(req.cookies.get(ADMIN_ACCESS)?.value, "admin", ["admin", "superadmin"])) {
      return NextResponse.next();
    }
    return gate(req, pathname, "/admin/login", "/api/admin/auth/session", Boolean(req.cookies.get(ADMIN_REFRESH)?.value));
  }
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    if (await accessOk(req.cookies.get(CUSTOMER_ACCESS)?.value, "customer")) return NextResponse.next();
    return gate(req, pathname, "/login", "/api/auth/session", Boolean(req.cookies.get(CUSTOMER_REFRESH)?.value));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/account", "/account/:path*"],
};
