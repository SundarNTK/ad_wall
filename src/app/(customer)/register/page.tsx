import type { Metadata } from "next";
import { AuthPanel } from "@/components/customer/auth-panel";

export const metadata: Metadata = { title: "Register" };

export default function RegisterPage() {
  return <AuthPanel mode="register" portal="customer" />;
}
