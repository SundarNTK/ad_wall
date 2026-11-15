import type { Metadata } from "next";
import { AccountPanel } from "@/components/customer/account-panel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  return <AccountPanel tab={params.tab || "ads"} />;
}
