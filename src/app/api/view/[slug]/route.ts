import { cookies } from "next/headers";
import { ok } from "@/lib/http";
import { dbConnect } from "@/lib/db";
import { Ad } from "@/models/Ad";
import { cookieBase } from "@/lib/constants";

export async function POST(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const jar = await cookies();
  const seen = (jar.get("ca_viewed")?.value || "").split(",").filter(Boolean);
  if (!seen.includes(slug)) {
    await dbConnect();
    await Ad.updateOne({ slug, status: "live" }, { $inc: { views: 1 } });
    jar.set("ca_viewed", [...seen, slug].slice(-80).join(","), { ...cookieBase(), maxAge: 60 * 60 * 24 });
  }
  return ok("OK");
}
