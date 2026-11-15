"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "@/components/shared/feedback";
import { Calendar, ExternalLink, Eye, Mail, MapPin, Phone, Star, Tag, User as UserIcon, X } from "lucide-react";
import { api, priceLabel } from "@/lib/client";
import { GhostButton, PrimaryButton, TonePill } from "@/components/admin/ui";

type Detail = {
  id: string; adNumber?: number; title: string; slug: string; description: string; price: number; priceType: string;
  attributes: Record<string, string | number>; images: { url: string }[];
  contactName?: string; contactEmail?: string; contactPhone?: string; showPhone?: boolean; city?: string; zip?: string;
  status: string; rejectReason?: string; expiresAt?: string | null; renewedAt?: string | null; createdAt?: string | null; updatedAt?: string | null;
  lat?: number | null; lng?: number | null;
  views?: number; isPrivateSeller?: boolean; isFeatured?: boolean; durationDays?: number;
  category?: { name: string } | null; subCategory?: { name: string; fields?: { key: string; label: string }[] } | null; location?: { city: string; state?: string } | null;
  owner?: { name?: string; email?: string; phone?: string } | null;
};

const tone = (status: string): "good" | "wait" | "bad" | "muted" => (status === "live" ? "good" : status === "pending" ? "wait" : status === "rejected" ? "bad" : "muted");
const fmt = (value?: string | null) => (value ? new Date(value).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

function Row({ icon, label, children }: { icon?: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-harbor-50 text-brand">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium uppercase tracking-wide text-inkmute">{label}</p>
        <div className="break-words text-[13.5px] text-inkstone">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-harbor-200 bg-surface px-4 py-3">
      <h3 className="text-[13px] font-bold text-inkstone">{title}</h3>
      <div className="mt-1 grid gap-x-6 divide-y divide-harbor-100 sm:grid-cols-2 sm:divide-y-0">{children}</div>
    </section>
  );
}

export function AdDetailDrawer({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const [ad, setAd] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [photo, setPhoto] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setAd(null);
    setLoading(true);
    setPhoto(0);
    setReason("");
    api<Detail>(`/api/admin/ads/${id}`).then((result) => {
      if (cancelled) return;
      if (!result.success) toast.error(result.message);
      setAd(result.data || null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [id, onClose]);

  async function act(action: string) {
    if (!ad) return;
    if (action === "reject" && !reason.trim()) {
      toast.error("Write a reject reason first");
      return;
    }
    setBusy(true);
    const result = await api(`/api/admin/ads/${ad.id}`, { method: "PATCH", body: JSON.stringify({ action, reason }) });
    setBusy(false);
    if (!result.success) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    onChanged();
    if (action === "delete") {
      onClose();
      return;
    }
    const fresh = await api<Detail>(`/api/admin/ads/${ad.id}`);
    if (fresh.data) setAd(fresh.data);
  }

  const fieldLabels = new Map((ad?.subCategory?.fields || []).map((field) => [field.key, field.label]));

  return (
    <AnimatePresence>
      {id && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-harbor-950/60 backdrop-blur-[2px]" />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Ad details"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[640px] flex-col border-l border-harbor-200 bg-admin-bg shadow-[-20px_0_60px_-20px_rgba(12,14,34,0.5)]"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-harbor-100 bg-surface px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-inkmute">Ad #{ad?.adNumber ?? ""}</p>
                <h2 className="truncate text-[17px] font-bold text-inkstone">{ad?.title || "Loading…"}</h2>
              </div>
              <div className="flex items-center gap-2">
                {ad && <TonePill tone={tone(ad.status)}>{ad.status}</TonePill>}
                <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-inkmute transition-colors hover:bg-harbor-50 hover:text-brand">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="admin-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {loading && <p className="text-[13.5px] text-inkmute">Loading…</p>}
              {ad && (
                <>
                  {ad.images.length > 0 ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ad.images[photo]?.url} alt="" className="h-56 w-full rounded-xl border border-harbor-200 bg-harbor-50 object-cover" />
                      {ad.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto">
                          {ad.images.map((image, index) => (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={index} src={image.url} alt="" onClick={() => setPhoto(index)} className={`h-14 w-20 shrink-0 cursor-pointer rounded-lg object-cover ring-2 ${index === photo ? "ring-harbor-600" : "ring-transparent opacity-80 hover:opacity-100"}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-harbor-200 px-4 py-6 text-center text-[13px] text-inkmute">No photos on this ad.</p>
                  )}

                  <section className="rounded-xl border border-harbor-200 bg-surface px-4 py-3">
                    <p className="text-[20px] font-bold text-brand">{priceLabel(Number(ad.price || 0), ad.priceType || "fixed")}</p>
                    <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-inkstone">{ad.description}</p>
                    {ad.status === "rejected" && ad.rejectReason && <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-[13px] text-rose-700 dark:text-rose-300">Rejected: {ad.rejectReason}</p>}
                  </section>

                  <Section title="Posted by (account)">
                    <Row icon={<UserIcon className="h-4 w-4" />} label="Name">{ad.owner?.name || "—"}</Row>
                    <Row icon={<Mail className="h-4 w-4" />} label="Account email">{ad.owner?.email || "—"}</Row>
                    <Row icon={<Phone className="h-4 w-4" />} label="Account phone">{ad.owner?.phone || "—"}</Row>
                    <Row icon={<Tag className="h-4 w-4" />} label="Seller type">{ad.isPrivateSeller === false ? "Business" : "Private seller"}</Row>
                  </Section>

                  <Section title="Contact shown for this ad">
                    <Row icon={<UserIcon className="h-4 w-4" />} label="Contact name">{ad.contactName || "—"}</Row>
                    <Row icon={<Mail className="h-4 w-4" />} label="Contact email (hidden from public)">{ad.contactEmail || "—"}</Row>
                    <Row icon={<Phone className="h-4 w-4" />} label="Phone">{ad.contactPhone || "—"}{ad.contactPhone ? <span className="ml-2 text-[12px] text-inkmute">({ad.showPhone ? "shown on ad" : "hidden"})</span> : null}</Row>
                    <Row icon={<MapPin className="h-4 w-4" />} label="Location">{[ad.city, ad.location?.state, ad.zip].filter(Boolean).join(", ") || "—"}</Row>
                  </Section>

                  <Section title="Listing details">
                    <Row icon={<Tag className="h-4 w-4" />} label="Category">{ad.category?.name || "—"}{ad.subCategory?.name ? ` › ${ad.subCategory.name}` : ""}</Row>
                    {typeof ad.lat === "number" && typeof ad.lng === "number" && (
                      <Row icon={<MapPin className="h-4 w-4" />} label="Map pin">
                        <a href={`https://www.google.com/maps/search/?api=1&query=${ad.lat},${ad.lng}`} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">{ad.lat.toFixed(5)}, {ad.lng.toFixed(5)}</a>
                      </Row>
                    )}
                    <Row icon={<Eye className="h-4 w-4" />} label="Views">{ad.views ?? 0}</Row>
                    <Row icon={<Calendar className="h-4 w-4" />} label="Posted">{fmt(ad.createdAt)}</Row>
                    <Row icon={<Calendar className="h-4 w-4" />} label="Expires">{fmt(ad.expiresAt)}{ad.durationDays ? <span className="ml-2 text-[12px] text-inkmute">({ad.durationDays}-day listing)</span> : null}</Row>
                    <Row icon={<Calendar className="h-4 w-4" />} label="Last updated">{fmt(ad.updatedAt)}</Row>
                    <Row icon={<Star className="h-4 w-4" />} label="Featured">{ad.isFeatured ? "Yes" : "No"}</Row>
                    {Object.entries(ad.attributes || {}).map(([key, value]) => (
                      <Row key={key} label={fieldLabels.get(key) || key}>{String(value)}</Row>
                    ))}
                  </Section>
                </>
              )}
            </div>

            {ad && (
              <footer className="shrink-0 space-y-2 border-t border-harbor-100 bg-surface px-5 py-3">
                <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason (needed to reject)" className="h-9 w-full rounded-lg border border-harbor-200 bg-surface px-3 text-[13.5px] text-inkstone outline-none placeholder:text-inkmute focus:border-harbor-600" />
                <div className="flex flex-wrap items-center gap-2">
                  {ad.status === "live" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-[7px] text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">Approved and live</span>
                  ) : ad.status === "deleted" ? null : (
                    <PrimaryButton type="button" disabled={busy} onClick={() => act("approve")}>{ad.status === "rejected" ? "Re-approve" : ad.status === "expired" ? "Republish" : "Approve"}</PrimaryButton>
                  )}
                  {ad.status !== "rejected" && <GhostButton type="button" disabled={busy} onClick={() => act("reject")}>Reject</GhostButton>}
                  {ad.status === "live" && <GhostButton type="button" disabled={busy} onClick={() => act("expire")}>Expire</GhostButton>}
                  {ad.status === "live" && <GhostButton type="button" disabled={busy} onClick={() => act(ad.isFeatured ? "unfeature" : "feature")}>{ad.isFeatured ? "Remove featured" : "Make featured"}</GhostButton>}
                  <GhostButton type="button" disabled={busy} onClick={() => act("delete")} className="text-rose-600 dark:text-rose-300">Delete</GhostButton>
                  <a href={`/ad/${ad.slug}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand hover:underline">
                    Open public page <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
