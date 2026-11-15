import type { Metadata } from "next";
import { VerifyBox } from "@/components/customer/verify-box";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <VerifyBox token={params.token} />;
}
