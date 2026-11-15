"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Briefcase, Car, Check, ChevronLeft, ChevronRight, ChevronUp, Home, ImagePlus, KeyRound, MapPin, PawPrint, ShoppingBag, Trash2, Users, Wrench } from "lucide-react";
import { toast } from "@/components/shared/feedback";
import { api, priceLabel } from "@/lib/client";
import type { FieldDef, PublicAd, SessionUser } from "@/types";
import dynamic from "next/dynamic";
import { Dropdown } from "@/components/shared/dropdown";

const MapPicker = dynamic(() => import("@/components/shared/map-picker").then((mod) => mod.MapPicker), { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-2xl bg-muted" /> });

type Meta = {
  categories: { _id: string; name: string; slug: string }[];
  subcategories: { _id: string; name: string; category: string; fields: FieldDef[] }[];
  locations: { _id: string; city: string; state: string; zip?: string; lat?: number; lng?: number }[];
  expiry: { label: string; days: number; isDefault?: boolean }[];
};

type Draft = {
  categoryId: string;
  subCategoryId: string;
  title: string;
  description: string;
  price: string;
  priceType: "fixed" | "negotiable" | "free" | "contact";
  attributes: Record<string, string>;
  images: { url: string; publicId: string }[];
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  showPhone: boolean;
  locationId: string;
  city: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  durationDays: number;
  isPrivateSeller: boolean;
  website: string;
};

const categoryIcons: Record<string, typeof Car> = {
  Jobs: Briefcase,
  Vehicles: Car,
  "Items for Sale": ShoppingBag,
  Pets: PawPrint,
  "Real Estate": Home,
  "For Rent": KeyRound,
  Services: Wrench,
  Community: Users,
};

const stepMeta = [
  { label: "Category", hint: "Choose where the ad belongs" },
  { label: "Details", hint: "Title, description, and price" },
  { label: "Photos", hint: "Up to five images" },
  { label: "Contact", hint: "How buyers can reach you" },
  { label: "Review", hint: "Check everything before posting" },
];

const fieldClass = "w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

const empty: Draft = {
  categoryId: "",
  subCategoryId: "",
  title: "",
  description: "",
  price: "",
  priceType: "fixed",
  attributes: {},
  images: [],
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  showPhone: false,
  locationId: "",
  city: "",
  zip: "",
  lat: null,
  lng: null,
  durationDays: 0,
  isPrivateSeller: true,
  website: "",
};

export function PostWizard({ editId }: { editId?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const topRef = useRef<HTMLDivElement>(null);
  const firstStep = useRef(true);

  // every time the step changes, bring the top of the form into view
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [draft, setDraft] = useState<Draft>(empty);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [pending, setPending] = useState(false);
  const subs = useMemo(() => meta?.subcategories.filter((item) => item.category === draft.categoryId) || [], [meta, draft.categoryId]);
  const fields = subs.find((item) => item._id === draft.subCategoryId)?.fields || [];

  useEffect(() => {
    const saved = localStorage.getItem("ca_ad_draft");
    if (saved && !editId) setDraft({ ...empty, ...JSON.parse(saved) });
    api<{ user: SessionUser }>("/api/auth/me").then((result) => {
      if (!result.success || !result.data?.user) {
        router.push(`/login?next=${encodeURIComponent(editId ? `/post?edit=${editId}` : "/post")}`);
        return;
      }
      setUser(result.data.user);
      setDraft((current) => ({ ...current, contactName: current.contactName || result.data!.user.name, contactEmail: current.contactEmail || result.data!.user.email, contactPhone: current.contactPhone || result.data!.user.phone || "" }));
    });
    api<Meta>("/api/meta").then((result) => {
      if (result.data) {
        setMeta(result.data);
        const options = result.data.expiry;
        const fallback = options.find((item) => item.isDefault)?.days || options[0]?.days || 180;
        // Use the admin's Default option, unless the draft already holds an offered value (or this is an edit of an existing ad).
        setDraft((current) => ({
          ...current,
          durationDays: options.some((item) => item.days === current.durationDays) || (editId && current.durationDays) ? current.durationDays : fallback,
        }));
      }
    });
    if (editId) {
      api<PublicAd>(`/api/ads/${editId}`).then((result) => {
        const ad = result.data;
        if (!ad) return;
        setDraft({
          ...empty,
          categoryId: ad.category?.id || "",
          subCategoryId: ad.subCategory?.id || "",
          title: ad.title,
          description: ad.description,
          price: String(ad.price || ""),
          priceType: (ad.priceType as Draft["priceType"]) || "fixed",
          attributes: Object.fromEntries(Object.entries(ad.attributes || {}).map(([key, value]) => [key, String(value)])),
          images: (ad.images || []).map((image) => ({ url: image.url, publicId: image.publicId || "" })),
          contactName: ad.contactName || "",
          contactEmail: ad.contactEmail || "",
          contactPhone: ad.contactPhone || "",
          showPhone: Boolean(ad.showPhone),
          locationId: ad.location?.id || "",
          city: ad.city || "",
          zip: ad.zip || "",
          lat: typeof ad.lat === "number" ? ad.lat : null,
          lng: typeof ad.lng === "number" ? ad.lng : null,
          durationDays: ad.durationDays || 180,
          isPrivateSeller: ad.isPrivateSeller !== false,
          website: "",
        });
      });
    }
  }, [editId, router]);

  useEffect(() => {
    if (!editId) localStorage.setItem("ca_ad_draft", JSON.stringify(draft));
  }, [draft, editId]);

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  async function uploadFiles(files: FileList | File[]) {
    const next = [...draft.images];
    for (const file of Array.from(files)) {
      if (next.length >= 5) break;
      const body = new FormData();
      body.set("file", file);
      const result = await api<{ url: string; publicId: string }>("/api/upload", { method: "POST", body });
      if (!result.success || !result.data) {
        toast.error(result.message);
        continue;
      }
      next.push(result.data);
    }
    patch({ images: next });
  }

  async function submit() {
    if (!user?.emailVerified) {
      toast.error("Verify your email before posting an ad");
      return;
    }
    for (const which of [0, 1, 3]) {
      const found = problems(which);
      if (found.length) {
        setDirection(which > step ? 1 : -1);
        setStep(which);
        toast.error(`Please fix this before posting: ${found.join(" · ")}`);
        return;
      }
    }
    setPending(true);
    const payload = {
      ...draft,
      durationDays: draft.durationDays || 180,
      price: draft.price === "" ? undefined : Number(draft.price),
      attributes: Object.fromEntries(Object.entries(draft.attributes).map(([key, value]) => [key, fields.find((field) => field.key === key)?.type === "number" ? Number(value) : value])),
    };
    const result = await api(editId ? `/api/ads/${editId}` : "/api/ads", { method: editId ? "PATCH" : "POST", body: JSON.stringify(payload) });
    setPending(false);
    if (!result.success) {
      toast.error(result.message);
      const keys = Object.keys(result.errors || {});
      if (keys.length) {
        const target = Math.min(...keys.map(stepOfField));
        setDirection(target > step ? 1 : -1);
        setStep(target);
      }
      return;
    }
    localStorage.removeItem("ca_ad_draft");
    const live = /live/i.test(result.message);
    const startAgain = () => {
      const fallbackDays = meta?.expiry.find((item) => item.isDefault)?.days || meta?.expiry[0]?.days || 180;
      setDraft({ ...empty, durationDays: fallbackDays, contactName: user?.name || "", contactEmail: user?.email || "", contactPhone: user?.phone || "" });
      setDirection(-1);
      setStep(0);
    };
    toast.send(live ? "Your ad is now live for everyone to see." : "Our team will review it shortly. We will email you as soon as it is approved.", {
      title: live ? "Your ad is live!" : "Ad submitted!",
      actions: [
        { label: "View my ads", primary: true, onClick: () => router.push("/account") },
        { label: "Post another ad", onClick: startAgain },
        { label: "Go to home", onClick: () => router.push("/") },
      ],
      onClose: () => router.push("/account"),
    });
  }

  const stepOfField = (key: string) => {
    const field = key.split(".").pop() || key;
    if (key.startsWith("attributes") || ["title", "description", "price", "priceType"].includes(field)) return 1;
    if (["categoryId", "subCategoryId"].includes(field)) return 0;
    if (field === "images") return 2;
    return 3;
  };

  /** Plain-language problems for one step, empty when the step is fine. */
  function problems(which: number): string[] {
    const list: string[] = [];
    if (which === 0) {
      if (!draft.categoryId) list.push("Choose a category");
      else if (!draft.subCategoryId) list.push("Choose a subcategory");
    }
    if (which === 1) {
      if (draft.title.trim().length < 5) list.push("Give the ad a title of at least 5 characters");
      if (draft.description.trim().length < 20) list.push("Describe it in at least 20 characters so buyers know what they are getting");
      if ((draft.priceType === "fixed" || draft.priceType === "negotiable") && (draft.price === "" || Number.isNaN(Number(draft.price)))) list.push("Enter a price, or choose Free or Contact for price");
      for (const field of fields) if (field.required && !String(draft.attributes[field.key] ?? "").trim()) list.push(`${field.label} is required for this type of ad`);
    }
    if (which === 3) {
      if (draft.contactName.trim().length < 2) list.push("Enter the contact name");
      if (!/^\S+@\S+\.\S+$/.test(draft.contactEmail.trim())) list.push("Enter a valid contact email");
      if (!draft.locationId) list.push("Choose a location from the list");
      if (draft.city.trim().length < 2) list.push("Enter the city");
      if (!draft.durationDays) list.push("Choose how long the ad stays live");
    }
    return list;
  }

  /** Closest listed location to a map pin (within 150 km), so the Location field follows the pin. */
  function nearestLocation(lat: number, lng: number) {
    const rad = (value: number) => (value * Math.PI) / 180;
    let best: NonNullable<Meta["locations"]>[number] | null = null;
    let bestKm = 150;
    for (const item of meta?.locations || []) {
      if (typeof item.lat !== "number" || typeof item.lng !== "number") continue;
      const a = Math.sin(rad(item.lat - lat) / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(item.lat)) * Math.sin(rad(item.lng - lng) / 2) ** 2;
      const km = 6371 * 2 * Math.asin(Math.sqrt(a));
      if (km < bestKm) {
        bestKm = km;
        best = item;
      }
    }
    return best;
  }

  function go(next: number) {
    if (next > step) {
      const found = problems(step);
      if (found.length) {
        toast.error(`Before you continue: ${found.join(" · ")}`);
        return;
      }
    }
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  const slide = {
    enter: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * 36, y: 8 }),
    center: { opacity: 1, x: 0, y: 0 },
    exit: (dir: number) => (reduceMotion ? { opacity: 0 } : { opacity: 0, x: dir * -28, y: -6 }),
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]">
      <div ref={topRef} className="scroll-mt-24 rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-primary"><ChevronLeft className="h-4 w-4" /> Back to home</Link>
        {!user?.emailVerified && user && <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Verify your email before this ad can be submitted. <a className="underline" href="/verify-email">Resend verification</a></p>}
        <ol className="mb-6 grid grid-cols-5 gap-2">
          {stepMeta.map((item, index) => {
            const done = index < step;
            const current = index === step;
            return (
              <li key={item.label}>
                <button type="button" disabled={index > step} onClick={() => index < step && go(index)} className="group flex w-full flex-col items-center gap-2 text-center disabled:cursor-default">
                  <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold transition ${current ? "bg-primary text-primary-foreground shadow-soft" : done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {done ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className={`hidden text-xs font-medium sm:block ${current ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
                </button>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <motion.div className="h-full bg-primary" initial={false} animate={{ width: index <= step ? "100%" : "0%" }} transition={{ duration: 0.35 }} />
                </div>
              </li>
            );
          })}
        </ol>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Step {step + 1} of {stepMeta.length}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{stepMeta[step].label}</h1>
        <p className="mb-5 text-sm text-muted-foreground">{stepMeta[step].hint}</p>
        <div className="relative min-h-[280px] overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={step} custom={direction} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: reduceMotion ? 0.15 : 0.32, ease: [0.22, 1, 0.36, 1] }}>
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {meta?.categories.map((category, index) => {
                  const Icon = categoryIcons[category.name] || ShoppingBag;
                  const selected = draft.categoryId === category._id;
                  return (
                    <motion.button key={category._id} type="button" initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={{ scale: 0.98 }} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${selected ? "border-primary bg-primary/5 shadow-soft" : "hover:border-primary/40"}`} onClick={() => patch({ categoryId: category._id, subCategoryId: "" })}>
                      <span className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}><Icon className="h-5 w-5" /></span>
                      <span className="font-medium">{category.name}</span>
                    </motion.button>
                  );
                })}
              </div>
              {subs.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium">Subcategory</p>
                  <div className="flex flex-wrap gap-2">
                    {subs.map((sub) => (
                      <button key={sub._id} type="button" className={`rounded-full border px-3 py-1.5 text-sm transition ${draft.subCategoryId === sub._id ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/40"}`} onClick={() => patch({ subCategoryId: sub._id })}>{sub.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <Field label="Title"><input value={draft.title} onChange={(event) => patch({ title: event.target.value })} placeholder="What are you offering?" className={fieldClass} /></Field>
              <Field label="Description"><textarea value={draft.description} onChange={(event) => patch({ description: event.target.value })} placeholder="Condition, features, and anything a buyer should know" className={`${fieldClass} min-h-36`} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Price type">
                  <select value={draft.priceType} onChange={(event) => patch({ priceType: event.target.value as Draft["priceType"] })} className={fieldClass}>
                    <option value="fixed">Fixed price</option>
                    <option value="negotiable">Negotiable</option>
                    <option value="free">Free</option>
                    <option value="contact">Contact for price</option>
                  </select>
                </Field>
                {draft.priceType !== "free" && draft.priceType !== "contact" && (
                  <Field label="Price"><input value={draft.price} onChange={(event) => patch({ price: event.target.value })} placeholder="0" className={fieldClass} /></Field>
                )}
              </div>
              {fields.map((field) => field.type === "select" ? (
                <Field key={field.key} label={field.label}>
                  <select value={draft.attributes[field.key] || ""} onChange={(event) => patch({ attributes: { ...draft.attributes, [field.key]: event.target.value } })} className={fieldClass}>
                    <option value="">Choose</option>
                    {(field.options || []).map((option) => <option key={option}>{option}</option>)}
                  </select>
                </Field>
              ) : (
                <Field key={field.key} label={field.label + (field.required ? " *" : "")}>
                  <input value={draft.attributes[field.key] || ""} onChange={(event) => patch({ attributes: { ...draft.attributes, [field.key]: event.target.value } })} className={fieldClass} />
                </Field>
              ))}
            </div>
          )}
          {step === 2 && (
            <div>
              <label className="grid cursor-pointer place-items-center gap-2 rounded-2xl border border-dashed bg-muted/40 px-4 py-12 text-center transition hover:border-primary hover:bg-primary/5" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); uploadFiles(event.dataTransfer.files); }}>
                <ImagePlus className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Drag photos here or browse</span>
                <span className="text-xs text-muted-foreground">JPG, PNG, or WebP. Up to 5 files, 5 MB each.</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(event) => event.target.files && uploadFiles(event.target.files)} />
              </label>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {draft.images.map((image, index) => (
                  <motion.div key={image.url} initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="overflow-hidden rounded-xl border">
                    <img src={image.url} alt="" className="h-28 w-full object-cover" />
                    <div className="flex justify-between p-2 text-xs">
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => index > 0 && patch({ images: draft.images.map((item, itemIndex) => itemIndex === index - 1 ? image : itemIndex === index ? draft.images[index - 1] : item) })}><ChevronUp className="h-3.5 w-3.5" /> Up</button>
                      <button type="button" className="inline-flex items-center gap-1 text-danger" onClick={() => patch({ images: draft.images.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Contact name"><input value={draft.contactName} onChange={(event) => patch({ contactName: event.target.value })} className={fieldClass} /></Field>
                <Field label="Phone"><input value={draft.contactPhone} onChange={(event) => patch({ contactPhone: event.target.value })} className={fieldClass} /></Field>
              </div>
              <Field label="Contact email, kept private"><input value={draft.contactEmail} onChange={(event) => patch({ contactEmail: event.target.value })} className={fieldClass} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.showPhone} onChange={(event) => patch({ showPhone: event.target.checked })} /> Show phone on the ad</label>
              <Field label="Location">
                <Dropdown
                  tall
                  searchable
                  searchPlaceholder="Search city or state"
                  value={draft.locationId}
                  placeholder="Choose a location"
                  onChange={(event) => {
                    const location = meta?.locations.find((item) => item._id === event.target.value);
                    patch({ locationId: event.target.value, city: location?.city || draft.city, zip: location?.zip || draft.zip });
                  }}
                >
                  <option value="">Choose a location</option>
                  {meta?.locations.map((location) => <option key={location._id} value={location._id}>{location.city}, {location.state}</option>)}
                </Dropdown>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="City"><input value={draft.city} onChange={(event) => patch({ city: event.target.value })} className={fieldClass} /></Field>
                <Field label="ZIP"><input value={draft.zip} onChange={(event) => patch({ zip: event.target.value })} className={fieldClass} /></Field>
              </div>
              <Field label="Exact place on the map (optional)">
                <MapPicker
                  value={draft.lat !== null && draft.lng !== null ? { lat: draft.lat, lng: draft.lng } : null}
                  center={(() => {
                    const chosen = meta?.locations.find((item) => item._id === draft.locationId);
                    return { lat: chosen?.lat || 11.9416, lng: chosen?.lng || 79.8083 };
                  })()}
                  onChange={(point) => {
                    if (!point) {
                      patch({ lat: null, lng: null });
                      return;
                    }
                    // pick the closest listed location for the pin and fill City and ZIP from it (refined below once the address is known)
                    const near = nearestLocation(point.lat, point.lng);
                    patch({ lat: point.lat, lng: point.lng, ...(near ? { locationId: near._id, city: near.city, zip: near.zip || "" } : {}) });
                  }}
                  onPlace={(place) => patch({ city: place.city || draft.city, zip: place.zip || draft.zip })}
                />
              </Field>
              <Field label="How long the ad stays live">
                <Dropdown tall value={draft.durationDays} onChange={(event) => patch({ durationDays: Number(event.target.value) })}>
                  {(() => {
                    const options = meta?.expiry || [{ label: "6 months", days: 180 }];
                    const extra = draft.durationDays && !options.some((option) => option.days === draft.durationDays) ? [{ label: `${draft.durationDays} days`, days: draft.durationDays }] : [];
                    return [...options, ...extra].map((option) => <option key={option.days} value={option.days}>{option.label}</option>);
                  })()}
                </Dropdown>
              </Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isPrivateSeller} onChange={(event) => patch({ isPrivateSeller: event.target.checked })} /> I am a private seller</label>
              <input value={draft.website} onChange={(event) => patch({ website: event.target.value })} tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px]" />
            </div>
          )}
          {step === 4 && (
            <div className="space-y-3 text-sm">
              <p className="text-xl font-semibold">{draft.title || "Untitled ad"}</p>
              <p className="text-lg font-semibold text-primary">{priceLabel(Number(draft.price || 0), draft.priceType)}</p>
              <p className="whitespace-pre-wrap leading-6 text-muted-foreground">{draft.description || "No description yet."}</p>
              <p className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {draft.city || "Location not set"}{draft.lat !== null ? " · map pin set" : ""} · {draft.images.length} photo{draft.images.length === 1 ? "" : "s"}</p>
            </div>
          )}
        </motion.div>
        </AnimatePresence>
        </div>
        <div className="mt-6 flex justify-between">
          <button className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm disabled:opacity-40" disabled={step === 0} onClick={() => go(step - 1)}><ChevronLeft className="h-4 w-4" /> Back</button>
          {step < 4 ? (
            <button className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground" onClick={() => go(step + 1)}>Continue <ChevronRight className="h-4 w-4" /></button>
          ) : (
            <button disabled={pending} className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60" onClick={submit}>{pending ? "Submitting…" : "Submit ad"}</button>
          )}
        </div>
      </div>
      <aside className="h-fit rounded-3xl border bg-card p-5 shadow-soft lg:sticky lg:top-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Live preview</p>
        <motion.div key={draft.images[0]?.url || "empty"} initial={reduceMotion ? false : { opacity: 0.4 }} animate={{ opacity: 1 }} className="mt-3 overflow-hidden rounded-xl bg-muted">
          {draft.images[0] ? <img src={draft.images[0].url} alt="" className="h-40 w-full object-cover" /> : <div className="grid h-40 place-items-center text-sm text-muted-foreground">Photos appear here</div>}
        </motion.div>
        <p className="mt-3 text-lg font-semibold text-primary">{priceLabel(Number(draft.price || 0), draft.priceType)}</p>
        <h2 className="font-medium">{draft.title || "Your title"}</h2>
        <p className="inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {draft.city || "Location"}</p>
      </aside>
    </div>
  );
}
