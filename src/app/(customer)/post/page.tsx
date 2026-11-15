import type { Metadata } from "next";
import { PostWizard } from "@/components/customer/post-wizard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Post a free ad" };

export default async function PostPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const params = await searchParams;
  return <PostWizard editId={params.edit} />;
}
