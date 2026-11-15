import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/auth";
import { safeRedirect } from "@/lib/utils";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirect = safeRedirect(url.searchParams.get("redirect"), "/account");
  const session = await refreshSession("customer", false);
  if (!session) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(redirect)}`, url.origin));
  return NextResponse.redirect(new URL(redirect, url.origin));
}
