import type { Metadata } from "next";
import { HomeDirectory } from "@/components/customer/home-directory";
import { homeDirectory } from "@/lib/services/listings";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Find local listings",
  description: "Browse jobs, vehicles, homes, pets, services, and community ads in Pondy.",
};

export default async function HomePage() {
  let problem = "";
  let data: Awaited<ReturnType<typeof homeDirectory>> | null = null;
  try {
    data = await homeDirectory();
  } catch (error) {
    problem = error instanceof Error ? error.message : "Connect MongoDB to load listings.";
  }

  if (!data) {
    return (
      <p className="mx-auto my-10 max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {problem}. Add MONGODB_URI to .env.local and run npm run seed.
      </p>
    );
  }

  return (
    <HomeDirectory categories={data.categories} subsByCategory={data.subsByCategory} />
  );
}
