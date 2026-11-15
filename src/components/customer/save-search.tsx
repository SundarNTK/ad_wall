"use client";

import { toast } from "@/components/shared/feedback";
import { api } from "@/lib/client";

export function SaveSearch({ query }: { query: Record<string, string> }) {
  return (
    <button
      className="rounded-full border px-3 py-1.5 text-sm"
      onClick={async () => {
        const label = window.prompt("Name this search");
        if (!label) return;
        const result = await api("/api/account/searches", { method: "POST", body: JSON.stringify({ label, query }) });
        if (!result.success) toast.error(result.message);
        else toast.success(result.message);
      }}
    >
      Save search
    </button>
  );
}
