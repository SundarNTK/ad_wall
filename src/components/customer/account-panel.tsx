"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { toast } from "@/components/shared/feedback";
import { api, priceLabel, when } from "@/lib/client";
import type { PublicAd, SessionUser } from "@/types";

type MessageItem = { _id: string; fromName: string; fromEmail: string; body: string; isRead: boolean; createdAt: string; ad?: { title?: string; slug?: string } };
type SearchItem = { _id: string; label: string; query: Record<string, string> };

export function AccountPanel({ tab }: { tab: string }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ads, setAds] = useState<PublicAd[]>([]);
  const [favorites, setFavorites] = useState<PublicAd[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [searches, setSearches] = useState<SearchItem[]>([]);
  const current = ["ads", "favorites", "messages", "settings", "searches"].includes(tab) ? tab : "ads";

  async function load() {
    const me = await api<{ user: SessionUser }>("/api/auth/me");
    if (!me.success || !me.data?.user) {
      router.push("/login?next=/account");
      return;
    }
    setUser(me.data.user);
    const [adRes, favRes, msgRes, searchRes] = await Promise.all([
      api<{ items: PublicAd[] }>("/api/account/ads"),
      api<{ items: PublicAd[] }>("/api/account/favorites"),
      api<{ items: MessageItem[] }>("/api/account/messages"),
      api<{ items: SearchItem[] }>("/api/account/searches"),
    ]);
    setAds(adRes.data?.items || []);
    setFavorites(favRes.data?.items || []);
    setMessages(msgRes.data?.items || []);
    setSearches(searchRes.data?.items || []);
  }

  useEffect(() => { load(); }, []);

  async function act(url: string, init: RequestInit, success?: string) {
    const result = await api(url, init);
    if (!result.success) toast.error(result.message);
    else toast.success(success || result.message);
    await load();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-primary"><Home className="h-4 w-4" /> Home</Link>
      <h1 className="text-3xl font-semibold">Your account</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {[["ads", "My Ads"], ["favorites", "Favorites"], ["messages", "Messages"], ["searches", "Saved searches"], ["settings", "Settings"]].map(([key, label]) => (
          <Link key={key} href={key === "ads" ? "/account" : `/account?tab=${key}`} className={`rounded-full px-4 py-2 text-sm ${current === key ? "bg-primary text-primary-foreground" : "border"}`}>{label}</Link>
        ))}
      </div>
      {current === "ads" && (
        <div className="mt-6 space-y-3">
          {ads.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">You have not posted an ad yet.</p>}
          {ads.map((ad) => {
            const expiring = ad.expiresAt && new Date(ad.expiresAt).getTime() - Date.now() < 3 * 86400000;
            return (
              <article key={ad.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-4">
                <div>
                  <Link href={`/ad/${ad.slug}`} className="font-medium">{ad.title}</Link>
                  <p className="text-sm text-muted-foreground">{priceLabel(ad.price, ad.priceType)} · {ad.views || 0} views · {ad.status} · expires {when(ad.expiresAt)}</p>
                  {ad.rejectReason && <p className="text-sm text-danger">{ad.rejectReason}</p>}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-muted px-2 py-1">{ad.status}</span>
                  <Link className="rounded-full border px-3 py-1" href={`/post?edit=${ad.id}`}>Edit</Link>
                  <button className="rounded-full border px-3 py-1" onClick={() => act(`/api/ads/${ad.id}`, { method: "DELETE" })}>Delete</button>
                  {ad.status === "live" && expiring && <button className="rounded-full bg-accent px-3 py-1 text-accent-foreground" onClick={() => act(`/api/ads/${ad.id}/renew`, { method: "POST" })}>Renew</button>}
                  {ad.status === "expired" && <button className="rounded-full bg-primary px-3 py-1 text-primary-foreground" onClick={() => act(`/api/ads/${ad.id}/republish`, { method: "POST" })}>Republish</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {current === "favorites" && (
        <div className="mt-6 grid gap-3">
          {favorites.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center">No favorites yet.</p>}
          {favorites.map((ad) => <Link key={ad.id} href={`/ad/${ad.slug}`} className="rounded-2xl border bg-card p-4">{ad.title}</Link>)}
        </div>
      )}
      {current === "messages" && (
        <div className="mt-6 space-y-3">
          {messages.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center">No messages yet.</p>}
          {messages.map((message) => (
            <article key={message._id} className={`rounded-2xl border p-4 ${message.isRead ? "bg-card" : "bg-primary/5"}`}>
              <p className="text-sm text-muted-foreground">{message.fromName} · {message.fromEmail} · {when(message.createdAt)}</p>
              <p className="font-medium">{message.ad?.title}</p>
              <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
              <div className="mt-3 flex gap-2 text-sm">
                {!message.isRead && <button className="rounded-full border px-3 py-1" onClick={() => act("/api/account/messages", { method: "PATCH", body: JSON.stringify({ id: message._id, action: "read" }) })}>Mark read</button>}
                <button className="rounded-full border px-3 py-1" onClick={() => act("/api/account/messages", { method: "PATCH", body: JSON.stringify({ id: message._id, action: "delete" }) })}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {current === "searches" && (
        <div className="mt-6 space-y-3">
          {searches.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center">Save a search from the search page.</p>}
          {searches.map((search) => (
            <div key={search._id} className="flex items-center justify-between rounded-2xl border bg-card p-4">
              <Link href={`/search?${new URLSearchParams(search.query).toString()}`}>{search.label}</Link>
              <button className="text-sm" onClick={() => act(`/api/account/searches?id=${search._id}`, { method: "DELETE" })}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {current === "settings" && user && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <form className="space-y-3 rounded-2xl border bg-card p-5" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); act("/api/account", { method: "PATCH", body: JSON.stringify({ name: data.get("name"), phone: data.get("phone") }) }); }}>
            <h2 className="font-semibold">Profile</h2>
            <input name="name" defaultValue={user.name} className="w-full rounded-xl border bg-background px-3 py-2" />
            <input name="phone" defaultValue={user.phone} className="w-full rounded-xl border bg-background px-3 py-2" />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const body = new FormData();
              body.set("file", file);
              body.set("purpose", "avatar");
              const uploaded = await api<{ url: string }>("/api/upload", { method: "POST", body });
              if (!uploaded.success || !uploaded.data) return toast.error(uploaded.message);
              await act("/api/account", { method: "PATCH", body: JSON.stringify({ avatar: uploaded.data.url }) }, "Photo updated");
            }} />
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Save profile</button>
          </form>
          <form className="space-y-3 rounded-2xl border bg-card p-5" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); act("/api/auth/password", { method: "POST", body: JSON.stringify({ currentPassword: data.get("currentPassword"), password: data.get("password"), confirmPassword: data.get("confirmPassword") }) }); }}>
            <h2 className="font-semibold">Change password</h2>
            <input name="currentPassword" type="password" placeholder="Current password" className="w-full rounded-xl border bg-background px-3 py-2" />
            <input name="password" type="password" placeholder="New password" className="w-full rounded-xl border bg-background px-3 py-2" />
            <input name="confirmPassword" type="password" placeholder="Confirm password" className="w-full rounded-xl border bg-background px-3 py-2" />
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Update password</button>
          </form>
          <form className="space-y-3 rounded-2xl border bg-card p-5" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); act("/api/auth/email", { method: "POST", body: JSON.stringify({ email: data.get("email"), password: data.get("password") }) }); }}>
            <h2 className="font-semibold">Change email</h2>
            <input name="email" type="email" placeholder="New email" className="w-full rounded-xl border bg-background px-3 py-2" />
            <input name="password" type="password" placeholder="Current password" className="w-full rounded-xl border bg-background px-3 py-2" />
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Send confirmation</button>
          </form>
          <form className="space-y-3 rounded-2xl border bg-card p-5" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); act("/api/account", { method: "DELETE", body: JSON.stringify({ password: data.get("password") }) }).then(() => router.push("/")); }}>
            <h2 className="font-semibold">Delete account</h2>
            <p className="text-sm text-muted-foreground">This signs you out and soft-deletes your ads.</p>
            <input name="password" type="password" placeholder="Password" className="w-full rounded-xl border bg-background px-3 py-2" />
            <button className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white">Delete account</button>
            <button type="button" className="ml-2 text-sm underline" onClick={() => act("/api/auth/logout-all", { method: "POST" }).then(() => router.push("/"))}>Log out of all devices</button>
          </form>
        </div>
      )}
    </div>
  );
}
