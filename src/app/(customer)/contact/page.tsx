import type { Metadata } from "next";
import { ContactForm } from "@/components/customer/contact-form";
export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-4xl font-semibold">Contact</h1>
      <p className="mt-3 text-muted-foreground">Questions about your account or a listing can come through here. Seller messages still belong on the ad.</p>
      <ContactForm />
    </div>
  );
}
