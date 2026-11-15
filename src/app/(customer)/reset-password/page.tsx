import type { Metadata } from "next";
import { AuthPanel } from "@/components/customer/auth-panel";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <AuthPanel mode="reset" portal="customer" token={params.token || ""} />;
}
