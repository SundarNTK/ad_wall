"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/shared/feedback";
import Link from "next/link";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTheme } from "next-themes";
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Flag, ShieldCheck, Users } from "lucide-react";
import { api, priceLabel } from "@/lib/client";
import { AdDetailDrawer } from "@/components/admin/ad-detail";
import {
  AddButton,
  AdminTable,
  CheckRow,
  ConfirmDialog,
  DeleteIconButton,
  EditIconButton,
  FilterSelect,
  filterInput,
  FormModal,
  GhostButton,
  PageHeader,
  Pager,
  PanelCard,
  PrimaryButton,
  SearchBox,
  SelectField,
  StatusPill,
  StatusSwitch,
  TextAreaField,
  TextField,
  TonePill,
} from "@/components/admin/ui";

const cap = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

type Row = Record<string, unknown> & { _id?: string; id?: string };

function useLoad<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<T>(url).then((result) => {
      if (cancelled) return;
      if (!result.success) toast.error(result.message);
      setData(result.data || null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [url, version]);
  return { data, loading, reload: () => setVersion((value) => value + 1) };
}

function useDebounced(value: string, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function failToast(result: { message: string; errors?: Record<string, string> }) {
  const extra = result.errors ? Object.values(result.errors).filter(Boolean).join(" ") : "";
  toast.error(extra || result.message);
}

function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setShown(value);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 700);
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{shown.toLocaleString()}</>;
}

function adTone(status: string): "good" | "wait" | "bad" | "muted" {
  if (status === "live") return "good";
  if (status === "pending") return "wait";
  if (status === "rejected") return "bad";
  return "muted";
}

type DashStats = {
  customers: number; admins: number; pending: number; live: number; rejected: number; expired: number; today: number; openReports: number; messages: number;
  perDay: { date: string; count: number }[]; perCategory: { name: string; count: number }[];
  recentAds: { id: string; title: string; status: string; createdAt?: string }[]; recentReports: { id: string; type: string; title: string; status: string }[];
};

const STATUS_COLORS: Record<string, string> = { Live: "#10b981", Pending: "#f59e0b", Rejected: "#f43f5e", Expired: "#94a3b8" };

function lastDays(perDay: { date: string; count: number }[], n = 14) {
  const map = new Map(perDay.map((row) => [row.date, row.count]));
  const out: { date: string; label: string; count: number }[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const key = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    out.push({ date: key, label: new Date(`${key}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }), count: map.get(key) || 0 });
  }
  return out;
}

function timeAgo(value?: string) {
  if (!value) return "";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function Kpi({ label, value, icon: Icon, tone, note, href }: { label: string; value: number; icon: typeof Users; tone: string; note: string; href?: string }) {
  const body = (
    <PanelCard className="h-full transition-shadow hover:shadow-[0_14px_30px_-18px_rgba(30,27,75,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12.5px] font-medium text-inkmute">{label}</p>
          <p className="mt-1.5 text-[30px] font-bold leading-none tracking-tight text-inkstone"><CountUp value={value} /></p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-3 text-[12px] text-inkmute">{note}</p>
    </PanelCard>
  );
  return href ? <Link href={href} className="block h-full">{body}</Link> : body;
}

export function DashboardPanel() {
  const { data, loading } = useLoad<DashStats>("/api/admin/stats");
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const grid = dark ? "#2b3060" : "#e8ebf8";
  const axis = dark ? "#9aa3bf" : "#6b7692";
  const line = dark ? "#818cf8" : "#4f46e5";
  const tip = { background: dark ? "#141730" : "#ffffff", border: `1px solid ${dark ? "#323768" : "#d3d7ff"}`, borderRadius: 10, color: dark ? "#e5e7f5" : "#111827", fontSize: 12 };
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  const days = data ? lastDays(data.perDay) : [];
  const total = data ? data.live + data.pending + data.rejected + data.expired : 0;
  const statusData = data
    ? [
        { name: "Live", value: data.live },
        { name: "Pending", value: data.pending },
        { name: "Rejected", value: data.rejected },
        { name: "Expired", value: data.expired },
      ]
    : [];
  const categories = data ? [...data.perCategory].sort((a, b) => b.count - a.count) : [];
  const maxCategory = Math.max(1, ...categories.map((item) => item.count));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle={`Marketplace activity at a glance · ${today}`}
        actions={
          <>
            <Link href="/admin/moderation" className="inline-flex items-center gap-1.5 rounded-lg bg-harbor-600 px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-harbor-700">
              <ShieldCheck className="h-4 w-4" /> Review pending{data && data.pending > 0 ? ` (${data.pending})` : ""}
            </Link>
            <Link href="/admin/reports" className="inline-flex items-center gap-1.5 rounded-lg border border-harbor-300 bg-surface px-3.5 py-[7px] text-[13px] font-medium text-brand transition-colors hover:bg-harbor-50">
              <Flag className="h-4 w-4" /> Reports
            </Link>
          </>
        }
      />
      {loading && !data ? <p className="text-[13.5px] text-inkmute">Loading…</p> : null}
      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Live ads" value={data.live} icon={CheckCircle2} tone="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" note={`${data.today} posted today · ${total} in total`} href="/admin/ads" />
            <Kpi label="Pending review" value={data.pending} icon={Clock} tone="bg-amber-500/10 text-amber-600 dark:text-amber-300" note={data.pending ? "Waiting for a decision" : "Queue is clear"} href="/admin/moderation" />
            <Kpi label="Customers" value={data.customers} icon={Users} tone="bg-indigo-500/10 text-indigo-600 dark:text-indigo-300" note={`${data.admins} admin ${data.admins === 1 ? "user" : "users"}`} href="/admin/customers" />
            <Kpi label="Open reports" value={data.openReports} icon={Flag} tone="bg-rose-500/10 text-rose-600 dark:text-rose-300" note={`${data.messages} seller ${data.messages === 1 ? "message" : "messages"}`} href="/admin/reports" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <PanelCard className="lg:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-bold text-inkstone">New ads</h2>
                  <p className="text-[12px] text-inkmute">Last 14 days</p>
                </div>
                <span className="rounded-full bg-harbor-50 px-2.5 py-1 text-[12px] font-semibold text-brand">{days.reduce((sum, day) => sum + day.count, 0)} ads</span>
              </div>
              <div className="mt-3 h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={days} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={line} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={line} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                    <XAxis dataKey="label" stroke={axis} fontSize={11} tickLine={false} axisLine={false} interval={1} />
                    <YAxis allowDecimals={false} stroke={axis} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tip} cursor={{ stroke: line, strokeOpacity: 0.25 }} formatter={(value) => [String(value), "Ads"]} />
                    <Area type="monotone" dataKey="count" stroke={line} strokeWidth={2.5} fill="url(#adsFill)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PanelCard>

            <PanelCard>
              <h2 className="text-[15px] font-bold text-inkstone">Ads by status</h2>
              <p className="text-[12px] text-inkmute">{total} ads in total</p>
              <div className="relative mx-auto mt-2 h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={total ? statusData : [{ name: "None", value: 1 }]} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={total ? 3 : 0} stroke="none">
                      {(total ? statusData : [{ name: "None", value: 1 }]).map((entry) => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || grid} />)}
                    </Pie>
                    {total ? <Tooltip contentStyle={tip} /> : null}
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[26px] font-bold leading-none text-inkstone">{total}</span>
                  <span className="mt-1 text-[11px] text-inkmute">Total ads</span>
                </div>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
                {statusData.map((item) => (
                  <li key={item.name} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-inkmute"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[item.name] }} />{item.name}</span>
                    <span className="font-semibold text-inkstone">{item.value}</span>
                  </li>
                ))}
              </ul>
            </PanelCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <PanelCard>
              <h2 className="text-[15px] font-bold text-inkstone">Ads by category</h2>
              <div className="mt-3 space-y-3">
                {categories.length === 0 && <p className="text-[13px] text-inkmute">Nothing here yet.</p>}
                {categories.map((item) => (
                  <div key={item.name}>
                    <div className="mb-1 flex items-center justify-between text-[13px]">
                      <span className="text-inkstone">{item.name}</span>
                      <span className="font-semibold text-inkstone">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-harbor-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-harbor-500 to-violet-500" style={{ width: `${Math.max(4, (item.count / maxCategory) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>

            <PanelCard>
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-inkstone">Recent ads</h2>
                <Link href="/admin/ads" className="text-[12.5px] font-semibold text-brand hover:underline">View all</Link>
              </div>
              <div className="mt-2 divide-y divide-harbor-100">
                {data.recentAds.length === 0 && <p className="py-2 text-[13px] text-inkmute">Nothing here yet.</p>}
                {data.recentAds.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-inkstone">{ad.title}</p>
                      <p className="text-[11.5px] text-inkmute">{timeAgo(ad.createdAt)}</p>
                    </div>
                    <TonePill tone={adTone(ad.status)}>{ad.status}</TonePill>
                  </div>
                ))}
              </div>
            </PanelCard>

            <PanelCard>
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-inkstone">Recent reports</h2>
                <Link href="/admin/reports" className="text-[12.5px] font-semibold text-brand hover:underline">View all</Link>
              </div>
              <div className="mt-2 divide-y divide-harbor-100">
                {data.recentReports.length === 0 && (
                  <div className="flex flex-col items-center gap-1.5 py-8 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" /></span>
                    <p className="text-[13px] text-inkmute">No reports. All clear.</p>
                  </div>
                )}
                {data.recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-inkstone">{report.title}</p>
                      <p className="text-[11.5px] capitalize text-inkmute">{report.type}</p>
                    </div>
                    <TonePill tone={report.status === "open" ? "wait" : report.status === "resolved" ? "good" : "muted"}>{report.status}</TonePill>
                  </div>
                ))}
              </div>
            </PanelCard>
          </div>
        </>
      )}
    </div>
  );
}

export function AdsPanel({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const [q, setQ] = useState("");
  const queryText = useDebounced(q);
  const [status, setStatus] = useState(pendingOnly ? "pending" : "all");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const query = `/api/admin/ads?q=${encodeURIComponent(queryText)}&status=${status}&category=${encodeURIComponent(category)}&page=${page}&limit=${pageSize}`;
  const { data, loading, reload } = useLoad<{ items: Row[]; total: number; page: number; pages: number }>(query);

  async function run(action: string, ids: string[]) {
    if (!ids.length) {
      toast.error("Choose ads and an action");
      return;
    }
    const result = await api("/api/admin/ads", { method: "POST", body: JSON.stringify({ action, ids, reason }) });
    if (!result.success) toast.error(result.message);
    else toast.success(result.message);
    setSelected([]);
    setConfirmDelete(false);
    reload();
  }

  const items = data?.items || [];
  return (
    <div className="space-y-3">
      <PageHeader title={pendingOnly ? "Moderation queue" : "Ads"} subtitle={pendingOnly ? "Listings waiting for a decision." : "Every listing on the marketplace."} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search title or ad number" />
        {!pendingOnly && (
          <FilterSelect value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All statuses</option>
            {["pending", "live", "rejected", "expired"].map((item) => <option key={item} value={item}>{cap(item)}</option>)}
          </FilterSelect>
        )}
        <input value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} placeholder="Category slug" className={filterInput} />
        <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reject reason" className={filterInput} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
        <PrimaryButton type="button" onClick={() => run("approve", selected)} className="py-2">Approve</PrimaryButton>
        <GhostButton type="button" onClick={() => run("reject", selected)}>Reject</GhostButton>
        <GhostButton type="button" onClick={() => run("expire", selected)}>Expire</GhostButton>
        <GhostButton type="button" onClick={() => run("feature", selected)}>Feature</GhostButton>
        <GhostButton type="button" onClick={() => setConfirmDelete(true)}>Delete</GhostButton>
        </div>
      </div>
      <AdminTable
        columns={[
          {
            key: "pick",
            label: "",
            className: "w-12",
            render: (ad) => (
              <input
                type="checkbox"
                checked={selected.includes(String(ad.id))}
                onChange={(event) => setSelected((current) => event.target.checked ? [...current, String(ad.id)] : current.filter((id) => id !== ad.id))}
              />
            ),
          },
          {
            key: "ad",
            label: "Ad",
            render: (ad) => (
              <div className="min-w-[180px]">
                <button type="button" onClick={() => setViewId(String(ad.id))} className="text-left font-semibold text-brand hover:underline">{String(ad.title)}{ad.isFeatured ? <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Featured</span> : null}</button>
                <p className="text-[12px] text-inkmute">#{String(ad.adNumber || "")}</p>
              </div>
            ),
          },
          {
            key: "category",
            label: "Category",
            render: (ad) => (
              <div>
                <p>{String((ad.category as { name?: string } | null)?.name || "—")}</p>
                <p className="text-[12px] text-inkmute">{String((ad.subCategory as { name?: string } | null)?.name || "")}</p>
              </div>
            ),
          },
          {
            key: "owner",
            label: "Posted by",
            render: (ad) => {
              const owner = ad.owner as { name?: string; email?: string } | null;
              return (
                <div>
                  <p className="font-medium">{owner?.name || String(ad.contactName || "—")}</p>
                  <p className="text-[12px] text-inkmute">{owner?.email || ""}</p>
                </div>
              );
            },
          },
          { key: "status", label: "Status", render: (ad) => <TonePill tone={adTone(String(ad.status))}>{String(ad.status)}</TonePill> },
          { key: "price", label: "Price", render: (ad) => priceLabel(Number(ad.price || 0), String(ad.priceType || "fixed")) },
          { key: "expires", label: "Expires", render: (ad) => <span className="whitespace-nowrap text-[13px]">{ad.expiresAt ? new Date(String(ad.expiresAt)).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}</span> },
        ]}
        rows={items}
        rowKey={(ad) => String(ad.id)}
        loading={loading && !data}
        empty="No ads match these filters."
        actions={(ad) => {
          const state = String(ad.status);
          return (
            <>
              <GhostButton type="button" className="px-3 py-1.5" onClick={() => setViewId(String(ad.id))}>View</GhostButton>
              {state === "live" ? (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" /> Approved
                </span>
              ) : state === "deleted" ? null : (
                <GhostButton type="button" className="px-3 py-1.5" onClick={() => run("approve", [String(ad.id)])}>
                  {state === "rejected" ? "Re-approve" : state === "expired" ? "Republish" : "Approve"}
                </GhostButton>
              )}
            </>
          );
        }}
      />
      <Pager page={data?.page || page} pages={data?.pages || 1} total={data?.total || 0} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
      <AdDetailDrawer id={viewId} onClose={() => setViewId(null)} onChanged={reload} />
      <ConfirmDialog open={confirmDelete} title="Delete ads" body="Delete the selected ads? This removes them from the marketplace." confirmLabel="Delete" onClose={() => setConfirmDelete(false)} onConfirm={() => run("delete", selected)} />
    </div>
  );
}

export function ReportsPanel() {
  const [status, setStatus] = useState("open");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, loading, reload } = useLoad<{ items: Row[]; total: number; page: number; pages: number }>(`/api/admin/reports?status=${status}&type=${encodeURIComponent(type)}&page=${page}&limit=${pageSize}`);
  async function run(id: string, action: string) {
    const result = await api("/api/admin/reports", { method: "POST", body: JSON.stringify({ id, action }) });
    if (!result.success) toast.error(result.message); else toast.success(result.message);
    reload();
  }
  return (
    <div className="space-y-3">
      <PageHeader title="Reports" subtitle="Member reports on listings." />
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="w-36">
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </FilterSelect>
        <input value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} placeholder="Type or all" className={filterInput} />
      </div>
      <AdminTable
        columns={[
          { key: "ad", label: "Ad", render: (report) => String((report.ad as { title?: string } | null)?.title || "Ad removed") },
          { key: "type", label: "Type", render: (report) => String(report.type || "") },
          { key: "status", label: "Status", render: (report) => <TonePill tone={String(report.status) === "open" ? "wait" : String(report.status) === "resolved" ? "good" : "muted"}>{String(report.status)}</TonePill> },
          { key: "from", label: "From", render: (report) => <span className="text-[13px]">{String(report.email || "")}<span className="mt-0.5 block text-[12px] text-inkmute">{String(report.comment || "")}</span></span> },
        ]}
        rows={data?.items || []}
        rowKey={(report) => String(report._id)}
        loading={loading && !data}
        empty="No reports in this view."
        actions={(report) => {
          const ad = report.ad as { slug?: string } | null;
          return (
            <>
              {ad?.slug && <a className="rounded-md border border-harbor-300 px-2.5 py-1 text-[12.5px] font-medium text-brand hover:bg-harbor-50" href={`/ad/${ad.slug}`} target="_blank" rel="noreferrer">View</a>}
              <GhostButton type="button" className="px-2.5 py-1" onClick={() => run(String(report._id), "resolve")}>Resolve</GhostButton>
              <GhostButton type="button" className="px-2.5 py-1" onClick={() => run(String(report._id), "dismiss")}>Dismiss</GhostButton>
              <GhostButton type="button" className="px-2.5 py-1" onClick={() => run(String(report._id), "delete-ad")}>Delete ad</GhostButton>
              <GhostButton type="button" className="px-2.5 py-1" onClick={() => run(String(report._id), "block-user")}>Block user</GhostButton>
            </>
          );
        }}
      />
      <Pager page={data?.page || page} pages={data?.pages || 1} total={data?.total || 0} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
    </div>
  );
}

export function CustomersPanel() {
  const [q, setQ] = useState("");
  const queryText = useDebounced(q);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState<{ user?: Row; ads?: Row[] } | null>(null);
  const [removeId, setRemoveId] = useState("");
  const { data, loading, reload } = useLoad<{ items: Row[]; total: number; page: number; pages: number }>(`/api/admin/customers?q=${encodeURIComponent(queryText)}&page=${page}&limit=${pageSize}`);
  async function run(id: string, action: string) {
    const result = await api<{ user?: Row; ads?: Row[] }>("/api/admin/customers", { method: "POST", body: JSON.stringify({ id, action }) });
    if (!result.success) toast.error(result.message);
    else if (action === "detail") setDetail(result.data || null);
    else toast.success(result.message);
    if (action !== "detail") {
      setRemoveId("");
      reload();
    }
  }
  const user = detail?.user;
  return (
    <div className="space-y-3">
      <PageHeader title="Customers" subtitle="Accounts that post and message on the marketplace." />
      <SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder="Search name or email" />
      <AdminTable
        columns={[
          { key: "name", label: "Name", render: (row) => <span className="font-semibold">{String(row.name || "")}</span> },
          { key: "email", label: "Email", render: (row) => String(row.email || "") },
          { key: "status", label: "Status", render: (row) => <TonePill tone={row.status === "blocked" ? "bad" : "good"}>{String(row.status || "")}</TonePill> },
          { key: "verified", label: "Verified", render: (row) => <StatusPill active={Boolean(row.emailVerified)} activeLabel="Verified" inactiveLabel="Unverified" /> },
        ]}
        rows={data?.items || []}
        rowKey={(row) => String(row.id)}
        loading={loading && !data}
        actions={(row) => (
          <>
            <GhostButton type="button" className="px-2.5 py-1" onClick={() => run(String(row.id), "detail")}>View</GhostButton>
            <GhostButton type="button" className="px-2.5 py-1" onClick={() => run(String(row.id), row.status === "blocked" ? "unblock" : "block")}>{row.status === "blocked" ? "Unblock" : "Block"}</GhostButton>
            <GhostButton type="button" className="px-2.5 py-1" onClick={() => run(String(row.id), "resend")}>Resend</GhostButton>
            <GhostButton type="button" className="px-2.5 py-1" onClick={() => run(String(row.id), "reset")}>Reset</GhostButton>
            <DeleteIconButton onClick={() => setRemoveId(String(row.id))} />
          </>
        )}
      />
      <Pager page={data?.page || page} pages={data?.pages || 1} total={data?.total || 0} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
      <FormModal open={Boolean(detail)} title={String(user?.name || "Customer")} onClose={() => setDetail(null)} onSubmit={() => setDetail(null)} submitLabel="Close">
        {user && (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Name" value={String(user.name || "")} readOnly />
            <TextField label="Email" value={String(user.email || "")} readOnly />
            <TextField label="Phone" value={String(user.phone || "")} readOnly />
            <TextField label="Status" value={String(user.status || "")} readOnly />
            <div className="sm:col-span-2">
              <p className="mb-2 text-[13px] font-semibold text-brand">Recent ads</p>
              <div className="space-y-2">
                {(detail?.ads || []).length === 0 && <p className="text-[13px] text-inkmute">No ads yet.</p>}
                {(detail?.ads || []).map((ad) => (
                  <div key={String(ad.id)} className="flex items-center justify-between gap-3 rounded-lg border border-harbor-100 px-3 py-2 text-[13.5px]">
                    <a className="font-medium text-brand hover:underline" href={`/ad/${ad.slug}`} target="_blank" rel="noreferrer">{String(ad.title)}</a>
                    <span className="text-inkmute">{String(ad.status)} · {String(ad.views || 0)} views</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </FormModal>
      <ConfirmDialog open={Boolean(removeId)} title="Delete customer" body="Delete this customer account? Their sign-in will stop working." onClose={() => setRemoveId("")} onConfirm={() => run(removeId, "delete")} />
    </div>
  );
}

export function StaffPanel() {
  const { data, loading, reload } = useLoad<{ items: Row[] }>("/api/admin/staff");
  const [open, setOpen] = useState(false);
  const [removeId, setRemoveId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "admin", mode: "invite", password: "" });
  async function create() {
    const result = await api("/api/admin/staff", { method: "POST", body: JSON.stringify(form) });
    if (!result.success) failToast(result);
    else {
      toast.success(result.message);
      setOpen(false);
      setForm({ name: "", email: "", phone: "", role: "admin", mode: "invite", password: "" });
      reload();
    }
  }
  async function update(id: string, body: object) {
    const result = await api("/api/admin/staff", { method: "PATCH", body: JSON.stringify({ id, ...body }) });
    if (!result.success) toast.error(result.message); else toast.success(result.message);
    reload();
  }
  async function remove(id: string) {
    const result = await api(`/api/admin/staff?id=${id}`, { method: "DELETE" });
    if (!result.success) toast.error(result.message); else toast.success(result.message);
    setRemoveId("");
    reload();
  }
  return (
    <div className="space-y-3">
      <PageHeader title="Admin users" subtitle="People who can sign in to this desk." actions={<AddButton onClick={() => setOpen(true)}>Add admin</AddButton>} />
      <AdminTable
        columns={[
          { key: "name", label: "Name", render: (user) => <span className="font-semibold">{String(user.name || "")}</span> },
          { key: "email", label: "Email", render: (user) => String(user.email || "") },
          { key: "role", label: "Role", render: (user) => <span className="capitalize">{String(user.role || "")}</span> },
          { key: "status", label: "Status", render: (user) => <StatusPill active={user.status === "active"} activeLabel="Active" inactiveLabel={String(user.status || "Inactive")} /> },
        ]}
        rows={data?.items || []}
        rowKey={(user) => String(user.id)}
        loading={loading && !data}
        actions={(user) => (
          <>
            <GhostButton type="button" className="px-2.5 py-1" onClick={() => update(String(user.id), { status: user.status === "active" ? "blocked" : "active" })}>{user.status === "active" ? "Deactivate" : "Activate"}</GhostButton>
            <GhostButton type="button" className="px-2.5 py-1" onClick={() => update(String(user.id), { role: user.role === "superadmin" ? "admin" : "superadmin" })}>Toggle role</GhostButton>
            <DeleteIconButton onClick={() => setRemoveId(String(user.id))} />
          </>
        )}
      />
      <FormModal open={open} title="Add admin" onClose={() => setOpen(false)} onSubmit={create} submitLabel="Create admin">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <TextField label="Email" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <TextField label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <SelectField label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </SelectField>
          <SelectField label="Access" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })} className="sm:col-span-2">
            <option value="invite">Send invite email</option>
            <option value="password">Temporary password</option>
          </SelectField>
          {form.mode === "password" && <TextField label="Temporary password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="sm:col-span-2" />}
        </div>
      </FormModal>
      <ConfirmDialog open={Boolean(removeId)} title="Delete admin" body="Remove this admin account? They will no longer be able to sign in." onClose={() => setRemoveId("")} onConfirm={() => remove(removeId)} />
    </div>
  );
}

type CustomField = { key: string; label: string; type: "text" | "number" | "select"; options: string; required: boolean; filterable: boolean };
type MasterForm = {
  name: string; icon: string; order: string; isActive: boolean; category: string; slug: string;
  country: string; state: string; city: string; zip: string; lat: string; lng: string;
  word: string; label: string; days: string; isDefault: boolean; key: string;
  title: string; content: string; question: string; answer: string; fields: CustomField[];
};

const ORDERED = new Set(["categories", "subcategories", "expiry", "report-types", "pages", "faqs"]);
const NOUNS: Record<string, string> = {
  locations: "location", categories: "category", subcategories: "sub category", keywords: "keyword",
  expiry: "expiry option", "report-types": "report type", pages: "page", faqs: "FAQ",
};

function blankForm(): MasterForm {
  return {
    name: "", icon: "Tag", order: "0", isActive: true, category: "", slug: "",
    country: "", state: "", city: "", zip: "", lat: "0", lng: "0",
    word: "", label: "", days: "7", isDefault: false, key: "",
    title: "", content: "", question: "", answer: "", fields: [],
  };
}

function categoryId(item: Row) {
  const category = item.category;
  if (category && typeof category === "object" && "_id" in (category as object)) return String((category as { _id: unknown })._id);
  return String(category || "");
}

function formFrom(item: Row): MasterForm {
  const rawFields = Array.isArray(item.fields) ? item.fields as Record<string, unknown>[] : [];
  return {
    ...blankForm(),
    name: String(item.name || ""),
    icon: String(item.icon || "Tag"),
    order: String(item.order ?? 0),
    isActive: item.isActive !== false,
    category: categoryId(item),
    slug: String(item.slug || ""),
    country: String(item.country || ""),
    state: String(item.state || ""),
    city: String(item.city || ""),
    zip: String(item.zip || ""),
    lat: String(item.lat ?? 0),
    lng: String(item.lng ?? 0),
    word: String(item.word || ""),
    label: String(item.label || ""),
    days: String(item.days ?? 7),
    isDefault: Boolean(item.isDefault),
    key: String(item.key || ""),
    title: String(item.title || ""),
    content: String(item.content || ""),
    question: String(item.question || ""),
    answer: String(item.answer || ""),
    fields: rawFields.map((field) => ({
      key: String(field.key || ""),
      label: String(field.label || ""),
      type: (field.type === "number" || field.type === "select" ? field.type : "text") as CustomField["type"],
      options: Array.isArray(field.options) ? field.options.map(String).join(", ") : "",
      required: Boolean(field.required),
      filterable: Boolean(field.filterable),
    })),
  };
}

function payload(resource: string, form: MasterForm) {
  const order = Number(form.order || 0);
  const slug = form.slug.trim();
  const fields = form.fields
    .filter((field) => field.key.trim() && field.label.trim())
    .map((field) => ({
      key: field.key.trim(),
      label: field.label.trim(),
      type: field.type,
      options: field.type === "select" ? field.options.split(",").map((item) => item.trim()).filter(Boolean) : [],
      required: field.required,
      filterable: field.filterable,
    }));
  if (resource === "categories") return { name: form.name, icon: form.icon || "Tag", order, isActive: form.isActive, ...(slug ? { slug } : {}) };
  if (resource === "subcategories") return { category: form.category, name: form.name, order, isActive: form.isActive, fields, ...(slug ? { slug } : {}) };
  if (resource === "locations") return { country: form.country, state: form.state, city: form.city, zip: form.zip, lat: Number(form.lat || 0), lng: Number(form.lng || 0), isActive: form.isActive, ...(slug ? { slug } : {}) };
  if (resource === "keywords") return { word: form.word, isActive: form.isActive };
  if (resource === "expiry") return { label: form.label, days: Number(form.days || 0), order, isDefault: form.isDefault, isActive: form.isActive };
  if (resource === "report-types") return { key: form.key, label: form.label, order, isActive: form.isActive };
  if (resource === "pages") return { slug: form.slug, title: form.title, content: form.content, order, isActive: form.isActive };
  return { question: form.question, answer: form.answer, order, isActive: form.isActive };
}

function categoryName(item: Row) {
  const category = item.category;
  if (category && typeof category === "object" && "name" in (category as object)) return String((category as { name?: string }).name || "");
  return "—";
}

export function MasterPanel({ resource, title }: { resource: string; title: string; sample?: string }) {
  const [q, setQ] = useState("");
  const queryText = useDebounced(q);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editor, setEditor] = useState<{ id?: string; form: MasterForm } | null>(null);
  const [removeId, setRemoveId] = useState("");
  const [csvOpen, setCsvOpen] = useState(false);
  const [csv, setCsv] = useState("country,state,city,zip,lat,lng");
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const { data, loading, reload } = useLoad<{ items: Row[]; total: number; page: number; pages: number }>(
    `/api/admin/masters/${resource}?q=${encodeURIComponent(queryText)}&page=${page}&status=${status}&limit=${pageSize}`,
  );
  const items = data?.items || [];

  useEffect(() => {
    if (resource !== "subcategories") return;
    api<{ items: Row[] }>("/api/admin/masters/categories?limit=100").then((result) => {
      const rows = result.data?.items || [];
      setCategories(rows.map((row) => ({ id: String(row._id), name: String(row.name || "") })));
    });
  }, [resource]);

  async function save() {
    if (!editor) return;
    const body = payload(resource, editor.form);
    const result = editor.id
      ? await api(`/api/admin/masters/${resource}/${editor.id}`, { method: "PATCH", body: JSON.stringify(body) })
      : await api(`/api/admin/masters/${resource}`, { method: "POST", body: JSON.stringify(body) });
    if (!result.success) failToast(result);
    else {
      toast.success(result.message);
      setEditor(null);
      reload();
    }
  }

  async function toggle(item: Row) {
    const result = await api(`/api/admin/masters/${resource}/${item._id}`, { method: "PATCH", body: JSON.stringify({ isActive: item.isActive === false }) });
    if (!result.success) toast.error(result.message); else reload();
  }

  async function remove(id: string) {
    const result = await api(`/api/admin/masters/${resource}/${id}`, { method: "DELETE" });
    if (!result.success) toast.error(result.message);
    else {
      toast.success(result.message);
      setRemoveId("");
      reload();
    }
  }

  async function reorder(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const result = await api(`/api/admin/masters/${resource}`, { method: "POST", body: JSON.stringify({ action: "reorder", ids: next.map((item) => item._id) }) });
    if (!result.success) toast.error(result.message); else reload();
  }

  const noun = NOUNS[resource] || "record";
  const form = editor?.form;
  const setForm = (patch: Partial<MasterForm>) => setEditor((current) => current ? { ...current, form: { ...current.form, ...patch } } : current);

  const columns = masterColumns(resource);
  return (
    <div className="space-y-3">
      <PageHeader
        title={title}
        subtitle={`Manage ${title.toLowerCase()} used across the marketplace.`}
        actions={
          <>
            {resource === "locations" && <GhostButton type="button" onClick={() => setCsvOpen(true)}>Import CSV</GhostButton>}
            <AddButton onClick={() => setEditor({ form: blankForm() })}>Add {noun}</AddButton>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(value) => { setQ(value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}`} />
        <FilterSelect value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </FilterSelect>
      </div>
      <AdminTable
        columns={[
          ...columns,
          { key: "status", label: "Status", render: (item: Row) => <StatusSwitch on={item.isActive !== false} onChange={() => toggle(item)} /> },
        ]}
        rows={items}
        rowKey={(item) => String(item._id)}
        loading={loading && !data}
        actions={(item) => {
          const index = items.findIndex((row) => row._id === item._id);
          return (
            <>
              {ORDERED.has(resource) && (
                <>
                  <button type="button" aria-label="Move up" disabled={index <= 0} onClick={() => reorder(index, index - 1)} className="flex h-8 w-8 items-center justify-center text-brand disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" aria-label="Move down" disabled={index < 0 || index >= items.length - 1} onClick={() => reorder(index, index + 1)} className="flex h-8 w-8 items-center justify-center text-brand disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                </>
              )}
              <EditIconButton onClick={() => setEditor({ id: String(item._id), form: formFrom(item) })} />
              <DeleteIconButton onClick={() => setRemoveId(String(item._id))} />
            </>
          );
        }}
      />
      <Pager
        page={data?.page || page}
        pages={data?.pages || 1}
        total={data?.total || 0}
        pageSize={pageSize}
        onPage={setPage}
        onPageSize={(size) => { setPageSize(size); setPage(1); }}
      />
      <FormModal open={Boolean(editor)} title={editor?.id ? `Edit ${noun}` : `Add ${noun}`} onClose={() => setEditor(null)} onSubmit={save} submitLabel="Save" wide={resource === "subcategories" || resource === "pages"}>
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            {resource === "categories" && (
              <>
                <TextField label="Name" required value={form.name} onChange={(event) => setForm({ name: event.target.value })} />
                <TextField label="Icon" value={form.icon} onChange={(event) => setForm({ icon: event.target.value })} hint="Lucide icon name, for example Tag." />
                <TextField label="Order" type="number" value={form.order} onChange={(event) => setForm({ order: event.target.value })} />
                <CheckRow label="Active" checked={form.isActive} onChange={(checked) => setForm({ isActive: checked })} />
              </>
            )}
            {resource === "subcategories" && (
              <>
                <SelectField label="Category" required value={form.category} onChange={(event) => setForm({ category: event.target.value })}>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </SelectField>
                <TextField label="Name" required value={form.name} onChange={(event) => setForm({ name: event.target.value })} />
                <TextField label="Order" type="number" value={form.order} onChange={(event) => setForm({ order: event.target.value })} />
                <CheckRow label="Active" checked={form.isActive} onChange={(checked) => setForm({ isActive: checked })} />
                <div className="sm:col-span-2 space-y-3 rounded-lg border border-harbor-100 bg-harbor-50/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-brand">Custom fields</p>
                    <GhostButton type="button" className="px-3 py-1.5" onClick={() => setForm({ fields: [...form.fields, { key: "", label: "", type: "text", options: "", required: false, filterable: false }] })}>Add field</GhostButton>
                  </div>
                  {form.fields.length === 0 && <p className="text-[12.5px] text-inkmute">No extra fields. Buyers will only see the standard ad form.</p>}
                  {form.fields.map((field, index) => (
                    <div key={index} className="grid gap-3 rounded-lg border border-harbor-100 bg-surface p-3 sm:grid-cols-2">
                      <TextField label="Key" required value={field.key} onChange={(event) => setForm({ fields: form.fields.map((row, rowIndex) => rowIndex === index ? { ...row, key: event.target.value } : row) })} hint="Lowercase, for example year." />
                      <TextField label="Label" required value={field.label} onChange={(event) => setForm({ fields: form.fields.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row) })} />
                      <SelectField label="Type" value={field.type} onChange={(event) => setForm({ fields: form.fields.map((row, rowIndex) => rowIndex === index ? { ...row, type: event.target.value as CustomField["type"] } : row) })}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                      </SelectField>
                      {field.type === "select" && (
                        <TextField label="Options" value={field.options} onChange={(event) => setForm({ fields: form.fields.map((row, rowIndex) => rowIndex === index ? { ...row, options: event.target.value } : row) })} hint="Comma separated." />
                      )}
                      <CheckRow label="Required" checked={field.required} onChange={(checked) => setForm({ fields: form.fields.map((row, rowIndex) => rowIndex === index ? { ...row, required: checked } : row) })} />
                      <CheckRow label="Filterable" checked={field.filterable} onChange={(checked) => setForm({ fields: form.fields.map((row, rowIndex) => rowIndex === index ? { ...row, filterable: checked } : row) })} />
                      <div className="sm:col-span-2">
                        <GhostButton type="button" onClick={() => setForm({ fields: form.fields.filter((_, rowIndex) => rowIndex !== index) })}>Remove field</GhostButton>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {resource === "locations" && (
              <>
                <TextField label="Country" required value={form.country} onChange={(event) => setForm({ country: event.target.value })} />
                <TextField label="State" required value={form.state} onChange={(event) => setForm({ state: event.target.value })} />
                <TextField label="City" required value={form.city} onChange={(event) => setForm({ city: event.target.value })} />
                <TextField label="ZIP" value={form.zip} onChange={(event) => setForm({ zip: event.target.value })} />
                <TextField label="Latitude" type="number" step="any" value={form.lat} onChange={(event) => setForm({ lat: event.target.value })} />
                <TextField label="Longitude" type="number" step="any" value={form.lng} onChange={(event) => setForm({ lng: event.target.value })} />
                <div className="sm:col-span-2"><CheckRow label="Active" checked={form.isActive} onChange={(checked) => setForm({ isActive: checked })} /></div>
              </>
            )}
            {resource === "keywords" && (
              <>
                <TextField label="Word" required value={form.word} onChange={(event) => setForm({ word: event.target.value })} className="sm:col-span-2" />
                <div className="sm:col-span-2"><CheckRow label="Active" checked={form.isActive} onChange={(checked) => setForm({ isActive: checked })} /></div>
              </>
            )}
            {resource === "expiry" && (
              <>
                <TextField label="Label" required value={form.label} onChange={(event) => setForm({ label: event.target.value })} />
                <TextField label="Days" required type="number" value={form.days} onChange={(event) => setForm({ days: event.target.value })} />
                <TextField label="Order" type="number" value={form.order} onChange={(event) => setForm({ order: event.target.value })} />
                <CheckRow label="Default option" checked={form.isDefault} onChange={(checked) => setForm({ isDefault: checked })} />
                <div className="sm:col-span-2"><CheckRow label="Active" checked={form.isActive} onChange={(checked) => setForm({ isActive: checked })} /></div>
              </>
            )}
            {resource === "report-types" && (
              <>
                <TextField label="Key" required value={form.key} onChange={(event) => setForm({ key: event.target.value })} hint="Lowercase letters, numbers, and underscores." />
                <TextField label="Label" required value={form.label} onChange={(event) => setForm({ label: event.target.value })} />
                <TextField label="Order" type="number" value={form.order} onChange={(event) => setForm({ order: event.target.value })} />
                <CheckRow label="Active" checked={form.isActive} onChange={(checked) => setForm({ isActive: checked })} />
              </>
            )}
            {resource === "pages" && (
              <>
                <TextField label="Title" required value={form.title} onChange={(event) => setForm({ title: event.target.value })} />
                <TextField label="Slug" required value={form.slug} onChange={(event) => setForm({ slug: event.target.value })} />
                <TextAreaField label="Content" value={form.content} onChange={(event) => setForm({ content: event.target.value })} className="sm:col-span-2" />
                <TextField label="Order" type="number" value={form.order} onChange={(event) => setForm({ order: event.target.value })} />
                <CheckRow label="Active" checked={form.isActive} onChange={(checked) => setForm({ isActive: checked })} />
              </>
            )}
            {resource === "faqs" && (
              <>
                <TextAreaField label="Question" required value={form.question} onChange={(event) => setForm({ question: event.target.value })} className="sm:col-span-2" />
                <TextAreaField label="Answer" required value={form.answer} onChange={(event) => setForm({ answer: event.target.value })} className="sm:col-span-2" />
                <TextField label="Order" type="number" value={form.order} onChange={(event) => setForm({ order: event.target.value })} />
                <CheckRow label="Active" checked={form.isActive} onChange={(checked) => setForm({ isActive: checked })} />
              </>
            )}
          </div>
        )}
      </FormModal>
      <FormModal
        open={csvOpen}
        title="Import locations"
        onClose={() => setCsvOpen(false)}
        submitLabel="Import"
        onSubmit={async () => {
          const result = await api("/api/admin/import/locations", { method: "POST", body: JSON.stringify({ csv }) });
          if (!result.success) toast.error(result.message);
          else {
            toast.success(result.message);
            setCsvOpen(false);
            reload();
          }
        }}
      >
        <TextAreaField label="CSV" value={csv} onChange={(event) => setCsv(event.target.value)} hint="First row is the header: country, state, city, zip, lat, lng." className="font-mono" />
      </FormModal>
      <ConfirmDialog open={Boolean(removeId)} title={`Delete ${noun}`} body="Delete this record? If it is still in use, deactivate it instead." onClose={() => setRemoveId("")} onConfirm={() => remove(removeId)} />
    </div>
  );
}

function masterColumns(resource: string): { key: string; label: string; render: (item: Row) => React.ReactNode }[] {
  if (resource === "locations") {
    return [
      { key: "city", label: "City", render: (item) => <span className="font-semibold">{String(item.city || "")}</span> },
      { key: "state", label: "State", render: (item) => String(item.state || "") },
      { key: "country", label: "Country", render: (item) => String(item.country || "") },
      { key: "zip", label: "ZIP", render: (item) => String(item.zip || "—") },
    ];
  }
  if (resource === "categories") {
    return [
      { key: "name", label: "Name", render: (item) => <span className="font-semibold">{String(item.name || "")}</span> },
      { key: "icon", label: "Icon", render: (item) => String(item.icon || "") },
      { key: "order", label: "Order", render: (item) => String(item.order ?? 0) },
    ];
  }
  if (resource === "subcategories") {
    return [
      { key: "name", label: "Name", render: (item) => <span className="font-semibold">{String(item.name || "")}</span> },
      { key: "category", label: "Category", render: (item) => categoryName(item) },
      { key: "order", label: "Order", render: (item) => String(item.order ?? 0) },
    ];
  }
  if (resource === "keywords") {
    return [{ key: "word", label: "Word", render: (item) => <span className="font-semibold">{String(item.word || "")}</span> }];
  }
  if (resource === "expiry") {
    return [
      { key: "label", label: "Label", render: (item) => <span className="font-semibold">{String(item.label || "")}</span> },
      { key: "days", label: "Days", render: (item) => String(item.days ?? "") },
      { key: "default", label: "Default", render: (item) => item.isDefault ? "Yes" : "No" },
    ];
  }
  if (resource === "report-types") {
    return [
      { key: "label", label: "Label", render: (item) => <span className="font-semibold">{String(item.label || "")}</span> },
      { key: "key", label: "Key", render: (item) => String(item.key || "") },
      { key: "order", label: "Order", render: (item) => String(item.order ?? 0) },
    ];
  }
  if (resource === "pages") {
    return [
      { key: "title", label: "Title", render: (item) => <span className="font-semibold">{String(item.title || "")}</span> },
      { key: "slug", label: "Slug", render: (item) => String(item.slug || "") },
      { key: "order", label: "Order", render: (item) => String(item.order ?? 0) },
    ];
  }
  return [
    { key: "question", label: "Question", render: (item) => <span className="font-semibold">{String(item.question || "")}</span> },
    { key: "order", label: "Order", render: (item) => String(item.order ?? 0) },
  ];
}

export function SettingsPanel() {
  const { data, reload } = useLoad<Row>("/api/admin/settings");
  const [form, setForm] = useState<Row>({});
  useEffect(() => { if (data) setForm(data); }, [data]);
  return (
    <form
      className="max-w-2xl space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await api("/api/admin/settings", { method: "PUT", body: JSON.stringify(form) });
        if (!result.success) toast.error(result.message); else { toast.success(result.message); reload(); }
      }}
    >
      <PageHeader title="Settings" subtitle="Site name, contact, and listing rules." />
      <div className="grid gap-3 rounded-xl border border-harbor-200 bg-surface p-4 shadow-[0_8px_24px_-16px_rgba(30,27,75,0.4)] sm:grid-cols-2">
        <TextField label="Site name" value={String(form.siteName || "")} onChange={(event) => setForm({ ...form, siteName: event.target.value })} />
        <TextField label="Contact email" type="email" value={String(form.contactEmail || "")} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} />
        <TextField label="Logo URL" value={String(form.logoUrl || "")} onChange={(event) => setForm({ ...form, logoUrl: event.target.value })} className="sm:col-span-2" />
        <TextField label="Max images" type="number" min={1} max={5} value={Number(form.maxImages || 5)} onChange={(event) => setForm({ ...form, maxImages: Number(event.target.value) })} />
        <div className="sm:col-span-2"><CheckRow label="Moderation on" checked={Boolean(form.moderationEnabled)} onChange={(checked) => setForm({ ...form, moderationEnabled: checked })} /></div>
        <div className="sm:col-span-2 flex justify-end"><PrimaryButton type="submit">Save settings</PrimaryButton></div>
      </div>
    </form>
  );
}

export function AuditPanel() {
  const [action, setAction] = useState("");
  const queryText = useDebounced(action);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, loading } = useLoad<{ items: Row[]; total: number; page: number; pages: number }>(`/api/admin/audit?action=${encodeURIComponent(queryText)}&page=${page}&limit=${pageSize}`);
  return (
    <div className="space-y-3">
      <PageHeader title="Audit log" subtitle="Who changed what, and from where." />
      <SearchBox value={action} onChange={(value) => { setAction(value); setPage(1); }} placeholder="Filter by action" />
      <AdminTable
        columns={[
          { key: "action", label: "Action", render: (item) => <span className="font-semibold">{String(item.action || "")}</span> },
          { key: "target", label: "Target", render: (item) => String(item.target || "—") },
          { key: "actor", label: "Actor", render: (item) => (item.actor as { email?: string } | null)?.email || "system" },
          { key: "ip", label: "IP", render: (item) => String(item.ip || "—") },
        ]}
        rows={data?.items || []}
        rowKey={(item) => String(item._id)}
        loading={loading && !data}
        empty="No audit events match this filter."
      />
      <Pager page={data?.page || page} pages={data?.pages || 1} total={data?.total || 0} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
    </div>
  );
}

export function MessagesPanel() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, loading } = useLoad<{ items: Row[]; total: number; page: number; pages: number }>(`/api/admin/messages?page=${page}&limit=${pageSize}`);
  return (
    <div className="space-y-3">
      <PageHeader title="Messages" subtitle="Messages relayed between buyers and sellers." />
      <AdminTable
        columns={[
          { key: "ad", label: "Ad", render: (item) => <span className="font-semibold">{(item.ad as { title?: string } | null)?.title || "—"}</span> },
          { key: "from", label: "From", render: (item) => <span>{String(item.fromName || "")}<span className="mt-0.5 block text-[12px] text-inkmute">{String(item.fromEmail || "")}</span></span> },
          { key: "body", label: "Message", render: (item) => <span className="line-clamp-2 whitespace-pre-wrap">{String(item.body || "")}</span> },
        ]}
        rows={data?.items || []}
        rowKey={(item) => String(item._id)}
        loading={loading && !data}
        empty="No messages yet."
      />
      <Pager page={data?.page || page} pages={data?.pages || 1} total={data?.total || 0} pageSize={pageSize} onPage={setPage} onPageSize={(size) => { setPageSize(size); setPage(1); }} />
    </div>
  );
}

export function PasswordPanel() {
  return (
    <form
      className="max-w-xl space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const result = await api("/api/admin/auth/password", { method: "POST", body: JSON.stringify({ currentPassword: data.get("currentPassword"), password: data.get("password"), confirmPassword: data.get("confirmPassword") }) });
        if (!result.success) toast.error(result.message); else toast.success(result.message);
      }}
    >
      <PageHeader title="Change password" subtitle="Use a password you do not use anywhere else." />
      <div className="space-y-3 rounded-xl border border-harbor-200 bg-surface p-4 shadow-[0_8px_24px_-16px_rgba(30,27,75,0.4)]">
        <TextField label="Current password" name="currentPassword" type="password" required />
        <TextField label="New password" name="password" type="password" required />
        <TextField label="Confirm password" name="confirmPassword" type="password" required />
        <div className="flex justify-end"><PrimaryButton type="submit">Update password</PrimaryButton></div>
      </div>
    </form>
  );
}
