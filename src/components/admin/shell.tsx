"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  ChevronDown,
  ChevronLeft,
  Clock,
  FileText,
  Flag,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  UserCog,
  UserRound,
  Users,
} from "lucide-react";
import { api } from "@/lib/client";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import type { SessionUser } from "@/types";

type Leaf = { href: string; label: string };
type Tone = "indigo" | "orange" | "emerald" | "violet" | "sky";
type Item = { label: string; icon: ReactNode; tone: Tone; href?: string; children?: Leaf[] };

const TONES: Record<Tone, string> = {
  indigo: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300",
  orange: "bg-orange-500/10 text-orange-600 dark:bg-orange-400/15 dark:text-orange-300",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300",
  violet: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  sky: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-300",
};

function IconTile({ tone, active, children }: { tone: Tone; active?: boolean; children: ReactNode }) {
  return <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${active ? "bg-white/20 text-white" : TONES[tone]}`}>{children}</span>;
}

const NAV: Item[] = [
  { label: "Dashboard", tone: "indigo", icon: <LayoutDashboard className="h-[18px] w-[18px]" />, href: "/admin" },
  {
    label: "Marketplace",
    tone: "orange",
    icon: <Megaphone className="h-[18px] w-[18px]" />,
    children: [
      { href: "/admin/moderation", label: "Moderation" },
      { href: "/admin/ads", label: "Ads" },
      { href: "/admin/reports", label: "Reports" },
      { href: "/admin/messages", label: "Messages" },
    ],
  },
  {
    label: "People",
    tone: "emerald",
    icon: <Users className="h-[18px] w-[18px]" />,
    children: [
      { href: "/admin/customers", label: "Customers" },
      { href: "/admin/admins", label: "Admin Users" },
    ],
  },
  {
    label: "Masters",
    tone: "violet",
    icon: <LayoutGrid className="h-[18px] w-[18px]" />,
    children: [
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/subcategories", label: "Sub Categories" },
      { href: "/admin/locations", label: "Locations" },
      { href: "/admin/keywords", label: "Keywords" },
      { href: "/admin/expiry", label: "Expiry Options" },
      { href: "/admin/report-types", label: "Report Types" },
      { href: "/admin/content", label: "Pages & FAQ" },
    ],
  },
  {
    label: "System",
    tone: "sky",
    icon: <Settings className="h-[18px] w-[18px]" />,
    children: [
      { href: "/admin/settings", label: "Settings" },
      { href: "/admin/audit", label: "Audit log" },
    ],
  },
];

const LEAF_ICONS: Record<string, ReactNode> = {
  "/admin/moderation": <ShieldCheck className="h-3.5 w-3.5" />,
  "/admin/ads": <Megaphone className="h-3.5 w-3.5" />,
  "/admin/reports": <Flag className="h-3.5 w-3.5" />,
  "/admin/messages": <Mail className="h-3.5 w-3.5" />,
  "/admin/customers": <Users className="h-3.5 w-3.5" />,
  "/admin/admins": <UserCog className="h-3.5 w-3.5" />,
  "/admin/categories": <Tags className="h-3.5 w-3.5" />,
  "/admin/subcategories": <Tags className="h-3.5 w-3.5" />,
  "/admin/locations": <MapPin className="h-3.5 w-3.5" />,
  "/admin/keywords": <Ban className="h-3.5 w-3.5" />,
  "/admin/expiry": <Clock className="h-3.5 w-3.5" />,
  "/admin/report-types": <Flag className="h-3.5 w-3.5" />,
  "/admin/content": <FileText className="h-3.5 w-3.5" />,
  "/admin/settings": <Settings className="h-3.5 w-3.5" />,
  "/admin/audit": <ScrollText className="h-3.5 w-3.5" />,
};

const ACTIVE = "bg-harbor-600 text-white font-semibold shadow-[0_8px_18px_-8px_rgba(79,70,229,0.65)]";
const IDLE = "text-inkstone/80 hover:bg-harbor-50 hover:text-brand";
const OPEN = "bg-harbor-50 text-brand";
const SOFT = "bg-harbor-100 text-brand font-semibold";

function roleLabel(role?: string) {
  if (role === "superadmin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "Staff";
}

function initials(name?: string) {
  const parts = (name || "Admin").trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "A";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ user: SessionUser }>("/api/admin/auth/me").then((result) => {
      if (!result.success) router.push("/admin/login");
      else setUser(result.data?.user || null);
    });
  }, [router]);

  useEffect(() => {
    if (!menu) return;
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  async function logout() {
    await api("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-admin-bg text-inkstone">
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-harbor-950/70 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-harbor-100 bg-surface shadow-[8px_0_28px_-16px_rgba(30,27,75,0.25)] transition-[width,transform] duration-300 ease-out md:relative md:z-30 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "md:w-20" : ""}`}
      >
        <div className="flex h-[108px] shrink-0 flex-col items-center justify-center gap-2 border-b border-harbor-100 px-4">
          <Link href="/admin" className={`flex items-center justify-center ${collapsed ? "md:hidden" : ""}`} aria-label="AdWall admin">
            <BrandLogo priority />
          </Link>
          <span className={`text-[10.5px] font-semibold uppercase tracking-[0.2em] text-inkmute ${collapsed ? "md:hidden" : ""}`}>Admin console</span>
          <Link href="/admin" className={collapsed ? "hidden md:block" : "hidden"} aria-label="AdWall admin">
            <Image src="/AdWall_icon.png" alt="AdWall" width={44} height={44} className="h-10 w-10 rounded-xl object-contain" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3.5 top-[40px] z-30 hidden h-7 w-7 items-center justify-center rounded-full border border-harbor-200 bg-surface text-inkstone shadow-sm transition hover:scale-110 hover:text-brand md:flex"
        >
          <ChevronLeft className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>

        <nav className="admin-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.map((item) =>
            item.children ? (
              <NavGroup key={item.label} item={item} collapsed={collapsed} pathname={pathname} onNavigate={() => setMobileOpen(false)} onExpand={() => setCollapsed(false)} />
            ) : (
              <NavLink key={item.label} href={item.href || "/admin"} icon={item.icon} tone={item.tone} label={item.label} collapsed={collapsed} active={pathname === item.href} onNavigate={() => setMobileOpen(false)} />
            ),
          )}
        </nav>

        <div className={`border-t border-harbor-100 px-5 py-4 text-[11px] font-medium text-inkmute ${collapsed ? "md:hidden" : ""}`}>
          AdWall &copy; {new Date().getFullYear()}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-harbor-100 bg-surface/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-inkstone transition-colors hover:bg-harbor-50 hover:text-brand md:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <p className="hidden truncate text-[13px] font-semibold tracking-[0.1em] text-inkmute sm:block">AdWall Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="relative" ref={menuRef}>
              <button type="button" onClick={() => setMenu((value) => !value)} className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-harbor-50 sm:pr-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-harbor-600 text-[12px] font-semibold text-white">{initials(user?.name)}</span>
                <span className="hidden text-left lg:block">
                  <span className="block max-w-[140px] truncate text-[13px] font-semibold leading-tight text-inkstone">{user?.name || "Admin"}</span>
                  <span className="block text-[11px] leading-tight text-inkmute">{roleLabel(user?.role)}</span>
                </span>
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-[calc(100%+8px)] z-20 w-52 overflow-hidden rounded-xl border border-harbor-200 bg-surface shadow-[0_20px_50px_-15px_rgba(30,27,75,0.4)]"
                  >
                    <div className="border-b border-harbor-100 px-4 py-3 lg:hidden">
                      <p className="truncate text-[13px] text-inkstone">{user?.name || "Admin"}</p>
                      <p className="text-[11px] text-inkmute">{roleLabel(user?.role)}</p>
                    </div>
                    <Link href="/admin/profile" onClick={() => setMenu(false)} className="flex items-center gap-2.5 border-b border-harbor-100 px-4 py-3 text-[13px] text-inkstone transition-colors hover:bg-harbor-50 hover:text-brand">
                      <UserRound className="h-4 w-4" /> Change password
                    </Link>
                    <button type="button" onClick={logout} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[13px] text-inkstone transition-colors hover:bg-harbor-50 hover:text-brand">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className="admin-scroll relative flex-1 overflow-y-auto overflow-x-hidden">
          <div className="relative w-full px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, icon, tone, label, collapsed, active, onNavigate }: { href: string; icon: ReactNode; tone: Tone; label: string; collapsed: boolean; active: boolean; onNavigate: () => void }) {
  return (
    <Link href={href} onClick={onNavigate} title={collapsed ? label : undefined} className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13.5px] font-medium transition duration-200 ${collapsed ? "md:justify-center" : ""} ${active ? ACTIVE : IDLE}`}>
      <IconTile tone={tone} active={active}>{icon}</IconTile>
      <span className={collapsed ? "md:hidden" : ""}>{label}</span>
    </Link>
  );
}

function NavGroup({ item, collapsed, pathname, onNavigate, onExpand }: { item: Item; collapsed: boolean; pathname: string; onNavigate: () => void; onExpand: () => void }) {
  const holds = (item.children || []).some((child) => child.href === pathname);
  const [expanded, setExpanded] = useState(holds);

  useEffect(() => {
    if (holds) setExpanded(true);
  }, [holds]);

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        title={collapsed ? item.label : undefined}
        onClick={() => {
          if (collapsed) {
            onExpand();
            setExpanded(true);
            return;
          }
          setExpanded((value) => !value);
        }}
        className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-[13.5px] font-medium transition duration-200 ${collapsed ? "md:justify-center" : ""} ${
          holds && (!expanded || collapsed) ? ACTIVE : expanded && !collapsed ? OPEN : IDLE
        }`}
      >
        <IconTile tone={item.tone} active={holds && (!expanded || collapsed)}>{item.icon}</IconTile>
        <span className={`flex-1 ${collapsed ? "md:hidden" : ""}`}>{item.label}</span>
        <ChevronDown className={`h-[18px] w-[18px] shrink-0 transition-transform duration-200 ${collapsed ? "md:hidden" : ""} ${holds && !expanded ? "text-white" : "text-inkmute"} ${expanded ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && !collapsed && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
            <div className="ml-[21px] mt-1 space-y-0.5 border-l border-harbor-200 pb-1 pl-3">
              {(item.children || []).map((child) => {
                const active = pathname === child.href;
                return (
                  <li key={child.href} className="list-none">
                    <Link href={child.href} onClick={onNavigate} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition duration-200 ${active ? SOFT : "font-medium text-inkstone/75 hover:bg-harbor-50 hover:text-brand"}`}>
                      <span className="shrink-0 opacity-80">{LEAF_ICONS[child.href]}</span>
                      {child.label}
                    </Link>
                  </li>
                );
              })}
            </div>
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
