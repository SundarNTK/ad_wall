import type { Metadata } from "next";
import { AuthPanel } from "@/components/customer/auth-panel";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return <AuthPanel mode="forgot" portal="customer" />;
}
