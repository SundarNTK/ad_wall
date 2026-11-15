"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/shared/feedback";
import { api } from "@/lib/client";

export function VerifyBox({ token }: { token?: string }) {
  const [message, setMessage] = useState(token ? "Checking your link…" : "Enter the link from your email, or resend it.");
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!token) return;
    api("/api/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }).then((result) => setMessage(result.message));
  }, [token]);

  useEffect(() => {
    if (!left) return;
    const timer = setTimeout(() => setLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold">Verify email</h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
      <button
        disabled={left > 0}
        className="mt-6 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        onClick={async () => {
          const result = await api("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({}) });
          if (!result.success) toast.error(result.message);
          else {
            toast.success(result.message);
            setLeft(60);
          }
        }}
      >
        {left ? `Resend in ${left}s` : "Resend verification"}
      </button>
    </div>
  );
}
