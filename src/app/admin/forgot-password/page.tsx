import type { Metadata } from "next";
import { AuthPanel } from "@/components/customer/auth-panel";
export const metadata: Metadata = { title: "Admin forgot password", robots: { index: false } };
export default function Page() { return <AuthPanel mode="forgot" portal="admin" />; }
