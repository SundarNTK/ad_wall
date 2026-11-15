"use client";

import { useState } from "react";
import { toast } from "@/components/shared/feedback";
import { api } from "@/lib/client";

export function ContactForm() {
  const [pending, setPending] = useState(false);
  return (
    <form className="mt-6 space-y-3" onSubmit={async (event) => {
      event.preventDefault();
      setPending(true);
      const data = new FormData(event.currentTarget);
      const result = await api("/api/contact", { method: "POST", body: JSON.stringify({ name: data.get("name"), email: data.get("email"), message: data.get("message"), website: data.get("website") }) });
      setPending(false);
      if (!result.success) toast.error(result.message);
      else {
        toast.success(result.message);
        event.currentTarget.reset();
      }
    }}>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px]" />
      <input name="name" required placeholder="Name" className="w-full rounded-xl border bg-card px-3 py-2" />
      <input name="email" type="email" required placeholder="Email" className="w-full rounded-xl border bg-card px-3 py-2" />
      <textarea name="message" required minLength={10} placeholder="How can we help?" className="min-h-32 w-full rounded-xl border bg-card px-3 py-2" />
      <button disabled={pending} className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">{pending ? "Sending…" : "Send"}</button>
    </form>
  );
}
