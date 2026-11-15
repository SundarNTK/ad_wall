import type { Metadata } from "next";
import { FaqList } from "@/components/customer/faq-list";
import { loadContent } from "@/lib/services/listings";

export const metadata: Metadata = { title: "Help", alternates: { canonical: "/help" } };

const fallback = [
  { question: "How do I post an ad?", answer: "Create an account, verify your email, then use Post a free ad. New ads wait for review when moderation is on." },
  { question: "Why can't I see the seller's email?", answer: "Messages are relayed. You write from the listing, and the seller receives it without their address appearing on the page." },
  { question: "A customer cannot open the admin panel. Is that expected?", answer: "Yes. Customer accounts are rejected at admin login and no admin session is created." },
];

export default async function HelpPage() {
  let items = fallback;
  try {
    const content = await loadContent("help");
    if (content.faqs.length) items = content.faqs.map((item) => ({ question: item.question, answer: item.answer }));
  } catch {
    items = fallback;
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Help / FAQ</h1>
      <FaqList items={items} />
    </div>
  );
}
