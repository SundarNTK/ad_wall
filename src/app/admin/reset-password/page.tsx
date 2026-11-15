import type { Metadata } from "next";
import { AuthPanel } from "@/components/customer/auth-panel";
export const metadata: Metadata = { title: "Admin reset password", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <AuthPanel mode="reset" portal="admin" token={params.token || ""} />;
}
