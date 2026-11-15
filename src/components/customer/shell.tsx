"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Facebook, Heart, Home, Instagram, LayoutGrid, Linkedin, LogOut, MapPin, Menu, MessageSquare, Moon, Plus, Search, Settings, Sun, UserRound, X, Youtube } from "lucide-react";
import { useTheme } from "next-themes";
import { api } from "@/lib/client";
import type { SessionUser } from "@/types";

type CategoryLink = { name: string; slug: string };
type PlaceLink = { slug: string; city: string };

function Brand({ siteName, priority = false }: { siteName: string; priority?: boolean }) {
  return <BrandLogo alt={siteName} priority={priority} />;
}

export function Header({ siteName, categories, locations }: { siteName: string; categories: CategoryLink[]; locations: PlaceLink[] }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    api<{ user: SessionUser }>("/api/auth/me").then((result) => setUser(result.success ? result.data?.user || null : null));
  }, [pathname]);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenu(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="shrink-0" aria-label={siteName}>
          <Brand siteName={siteName} priority />
        </Link>
        <form action="/search" className="mx-auto hidden min-w-0 max-w-2xl flex-1 items-center rounded-full border bg-card py-1 pl-4 pr-1 shadow-soft md:flex">
          <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
          <label className="sr-only" htmlFor="nav-category">Category</label>
          <select id="nav-category" name="category" defaultValue="" className="max-w-[9rem] bg-transparent py-2 pl-2 text-sm outline-none">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
          <span className="mx-2 h-5 w-px bg-border" />
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input name="q" aria-label="Search ads" placeholder="Search for..." className="w-full bg-transparent px-2 py-2 text-sm outline-none" />
          <span className="mx-1 h-5 w-px bg-border" />
          <MapPin className="h-4 w-4 shrink-0 text-primary" />
          <label className="sr-only" htmlFor="nav-loc">Location</label>
          <select id="nav-loc" name="loc" defaultValue={locations.find((item) => item.slug === "pondy")?.slug || locations[0]?.slug || ""} className="max-w-[7rem] bg-transparent py-2 pl-1 text-sm outline-none">
            <option value="">Anywhere</option>
            {locations.map((item) => <option key={item.slug} value={item.slug}>{item.city}</option>)}
          </select>
          <button className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <Search className="h-4 w-4" /> Search
          </button>
        </form>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link href="/" className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-2.5 text-sm font-semibold hover:bg-muted">
            <Home className="h-4 w-4" /> Home
          </Link>
          <button aria-label="Toggle color theme" className="grid h-10 w-10 place-items-center rounded-full border bg-card" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="hidden h-4 w-4 dark:block" />
            <Moon className="h-4 w-4 dark:hidden" />
          </button>
          <Link href="/post" className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground">
            <Plus className="h-4 w-4" /> Post a free ad
          </Link>
          {user ? (
            <div className="relative">
              <button className="inline-flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3 text-sm" onClick={() => setMenu((value) => !value)} aria-expanded={menu}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-muted"><UserRound className="h-4 w-4" /></span>
                {user.name.split(" ")[0]}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 mt-2 w-52 rounded-2xl border bg-card p-2 shadow-soft">
                    <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted" href="/" onClick={() => setMenu(false)}><Home className="h-4 w-4" /> Home</Link>
                    <Link className="block rounded-xl px-3 py-2 text-sm hover:bg-muted" href="/account" onClick={() => setMenu(false)}>My Ads</Link>
                    <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted" href="/account?tab=favorites" onClick={() => setMenu(false)}><Heart className="h-4 w-4" /> Favorites</Link>
                    <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted" href="/account?tab=messages" onClick={() => setMenu(false)}><MessageSquare className="h-4 w-4" /> Messages</Link>
                    <Link className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-muted" href="/account?tab=settings" onClick={() => setMenu(false)}><Settings className="h-4 w-4" /> Settings</Link>
                    <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-muted" onClick={logout}><LogOut className="h-4 w-4" /> Logout</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium">Login</Link>
              <Link href="/register" className="rounded-full border px-3 py-2 text-sm font-semibold">Register</Link>
            </>
          )}
        </div>
        <button className="ml-auto rounded-full border p-2 md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>
      <form action="/search" className="mx-auto flex max-w-7xl gap-2 px-4 pb-3 md:hidden">
        <input name="q" aria-label="Search ads" placeholder="Search for..." className="min-w-0 flex-1 rounded-full border bg-card px-4 py-2 text-sm outline-none" />
        <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Search</button>
      </form>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setOpen(false)}>
            <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute right-0 h-full w-[86%] max-w-sm overflow-y-auto bg-card p-5" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <Brand siteName={siteName} />
                <button aria-label="Close menu" onClick={() => setOpen(false)}><X /></button>
              </div>
              <div className="grid gap-1">
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 font-semibold"><Home className="h-4 w-4" /> Home</Link>
                <Link href="/post" onClick={() => setOpen(false)} className="rounded-full bg-accent px-3 py-2 text-center font-semibold text-accent-foreground">Post a free ad</Link>
                {user ? (
                  <>
                    <Link href="/account" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2">My Ads</Link>
                    <button onClick={logout} className="rounded-xl px-3 py-2 text-left">Logout</button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-3 py-2">Login</Link>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer({ siteName }: { siteName: string }) {
  return (
    <footer className="relative mt-10 overflow-hidden border-t bg-card">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-primary/10 to-transparent" />
      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
        <div>
          <Brand siteName={siteName} />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{siteName} is your local marketplace to buy, sell, rent, and more.</p>
          <div className="mt-4 flex gap-2 text-muted-foreground">
            {([
              ["facebook", Facebook],
              ["youtube", Youtube],
              ["linkedin", Linkedin],
              ["instagram", Instagram],
            ] as const).map(([name, Icon]) => (
              <span key={name} className="grid h-8 w-8 place-items-center rounded-full border"><Icon className="h-4 w-4" /></span>
            ))}
          </div>
        </div>
        <div>
          <p className="font-display text-sm font-bold">About</p>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground">About us</Link>
            <Link href="/help" className="hover:text-foreground">Help / FAQ</Link>
            <Link href="/safety" className="hover:text-foreground">Safety tips</Link>
            <Link href="/locations" className="hover:text-foreground">Locations</Link>
          </div>
        </div>
        <div>
          <p className="font-display text-sm font-bold">Terms</p>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of use</Link>
            <Link href="/post" className="hover:text-foreground">Post an ad</Link>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Meet in public, never wire money to a stranger, and keep conversations on the platform until you trust the seller.</p>
      </div>
    </footer>
  );
}
