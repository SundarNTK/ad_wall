import type { Metadata } from "next";
import { AuthPanel } from "@/components/customer/auth-panel";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const params = await searchParams;
  return (
    <div>
      {params.reset && <p className="bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">Password updated. Sign in with your new password.</p>}
      <AuthPanel mode="login" portal="customer" next={params.next} />
    </div>
  );
}
