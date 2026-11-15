import type { Metadata } from "next";
import { loadContent } from "@/lib/services/listings";

const fallbacks: Record<string, { title: string; body: string }> = {
  about: { title: "About AdWall", body: "AdWall is a local classifieds marketplace. People post free ads, buyers contact sellers without seeing a private email address, and moderators review new listings before they go live." },
  safety: { title: "Safety and fraud tips", body: "Meet in a public place. Inspect the item before you pay. Avoid wire transfers, gift cards, and cryptocurrency for in-person deals. If a price looks unreal, it probably is. Report the ad and stop replying." },
  terms: { title: "Terms of use", body: "You must provide accurate listings, keep your login private, and follow local laws. We may reject or remove ads, block accounts, and keep audit records of admin actions. Posting an ad does not create a contract with AdWall." },
  privacy: { title: "Privacy", body: "We store your account, ads, messages, and security logs so the marketplace can function. Seller emails are hidden on public pages and used only to relay contact. Do not send passwords or payment details through an ad." },
};

export async function Editorial({ slug }: { slug: string }) {
  const fallback = fallbacks[slug];
  let title = fallback.title;
  let body = fallback.body;
  try {
    const content = await loadContent(slug);
    const page = content.page as { title?: string; content?: string } | null;
    if (page?.title) title = page.title;
    if (page?.content) body = page.content;
  } catch {
    /* database optional until seeded */
  }
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-semibold">{title}</h1>
      <p className="mt-6 whitespace-pre-wrap leading-8 text-muted-foreground">{body}</p>
    </article>
  );
}

export function editorialMetadata(slug: string): Metadata {
  return { title: fallbacks[slug].title, alternates: { canonical: `/${slug}` } };
}
