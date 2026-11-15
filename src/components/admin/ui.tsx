"use client";

import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dropdown } from "@/components/shared/dropdown";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

export const fieldLabel = "mb-1 block text-[12.5px] font-semibold leading-none text-brand";
export const fieldControl =
  "h-9 w-full rounded-lg border border-harbor-200 bg-surface px-3 text-[14px] leading-5 text-inkstone outline-none transition-colors placeholder:text-slate-400 hover:border-harbor-300 focus:border-harbor-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.18)]";
export const filterInput =
  "h-9 w-40 rounded-lg border border-harbor-200 bg-surface px-3 text-[13.5px] text-inkstone outline-none transition-colors placeholder:text-inkmute hover:border-harbor-300 focus:border-harbor-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.18)]";
export const fieldArea =
  "min-h-[88px] w-full resize-y rounded-lg border border-harbor-200 bg-surface px-3 py-2 text-[14px] leading-5 text-inkstone outline-none transition-colors placeholder:text-slate-400 hover:border-harbor-300 focus:border-harbor-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.18)]";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-sans text-[22px] font-bold leading-tight text-inkstone">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-inkmute">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search…" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full max-w-[16rem]">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-inkmute" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-harbor-200 bg-surface pl-9 pr-3 text-[13.5px] text-inkstone outline-none transition-colors placeholder:text-inkmute hover:border-harbor-300 focus:border-harbor-600 focus:shadow-[0_0_0_3px_rgba(79,70,229,0.18)]"
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, children, className = "w-40" }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <Dropdown value={value as string | number | undefined} onChange={onChange} className={className}>
      {children}
    </Dropdown>
  );
}

export function PrimaryButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-harbor-900/15 bg-harbor-600 px-3.5 py-2 text-[13px] font-semibold text-white shadow-[0_2px_6px_-1px_rgba(0,0,0,0.15)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-harbor-700 hover:shadow-[0_8px_18px_-8px_rgba(30,27,75,0.5)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-harbor-300 bg-surface px-3.5 py-[7px] text-[13px] font-medium text-brand transition-colors hover:bg-harbor-50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function AddButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <PrimaryButton type="button" onClick={onClick}>
      <Plus className="h-4 w-4" />
      {children}
    </PrimaryButton>
  );
}

export function TextField({ label, required, hint, className = "", placeholder, ...props }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className={fieldLabel}>
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      <input {...props} required={required} placeholder={placeholder ?? `Enter ${label.toLowerCase()}`} className={fieldControl} />
      {hint && <p className="mt-1.5 pl-1 text-[12.5px] text-inkmute">{hint}</p>}
    </div>
  );
}

export function TextAreaField({ label, required, hint, className = "", placeholder, ...props }: { label: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label className={fieldLabel}>
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      <textarea {...props} required={required} placeholder={placeholder ?? `Enter ${label.toLowerCase()}...`} className={fieldArea} />
      {hint && <p className="mt-1.5 pl-1 text-[12.5px] text-inkmute">{hint}</p>}
    </div>
  );
}

export function SelectField({ label, required, children, className = "", value, onChange, disabled, name }: { label: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className={className}>
      <label className={fieldLabel}>
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      <Dropdown value={value as string | number | undefined} onChange={onChange} required={required} disabled={disabled} name={name} placeholder={`Select ${label.toLowerCase()}`}>
        {children}
      </Dropdown>
    </div>
  );
}

export function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-harbor-200 bg-surface px-3 py-2.5" onClick={() => onChange(!checked)}>
      <span className="text-[13px] font-semibold text-brand">{label}</span>
      <span onClick={(event) => event.stopPropagation()}>
        <StatusSwitch on={checked} onChange={() => onChange(!checked)} />
      </span>
    </div>
  );
}

export function StatusSwitch({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-harbor-600" : "bg-harbor-200"} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-transform ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

export function StatusPill({ active, activeLabel = "Active", inactiveLabel = "Inactive" }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return active ? (
    <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11.5px] font-medium text-emerald-700 dark:text-emerald-300">{activeLabel}</span>
  ) : (
    <span className="inline-flex items-center rounded-md border border-harbor-200 bg-harbor-50 px-2 py-0.5 text-[11.5px] font-medium text-inkmute">{inactiveLabel}</span>
  );
}

export function TonePill({ tone, children }: { tone: "good" | "wait" | "bad" | "muted"; children: ReactNode }) {
  const styles = {
    good: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    wait: "border-amber-400/40 bg-amber-400/10 text-amber-800 dark:text-amber-300",
    bad: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    muted: "border-harbor-200 bg-harbor-50 text-inkmute",
  };
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11.5px] font-medium capitalize ${styles[tone]}`}>{children}</span>;
}

export function EditIconButton({ onClick, label = "Edit" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="flex h-8 w-8 items-center justify-center text-blue-600 transition-transform duration-200 hover:scale-110 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
      <Pencil className="h-[18px] w-[18px]" />
    </button>
  );
}

export function DeleteIconButton({ onClick, label = "Delete" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="flex h-8 w-8 items-center justify-center text-rose-600 transition-transform duration-200 hover:scale-110 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 dark:text-rose-300">
      <Trash2 className="h-[18px] w-[18px]" />
    </button>
  );
}

export type TableColumn<T> = {
  key: string;
  label: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  empty = "Nothing here yet.",
  actions,
}: {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  empty?: string;
  actions?: (row: T) => ReactNode;
}) {
  const span = columns.length + (actions ? 1 : 0);
  return (
    <div className="rounded-xl border border-harbor-200 bg-surface shadow-[0_10px_30px_-18px_rgba(30,27,75,0.35)]">
      <div className="overflow-hidden rounded-xl bg-surface">
        <div className="admin-scroll max-h-[max(22rem,calc(100dvh-14rem))] overflow-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-harbor-100 bg-harbor-50 text-[11px] uppercase tracking-wide text-brand">
                {columns.map((column, index) => (
                  <th key={column.key} className={`sticky top-0 z-10 bg-harbor-50 px-4 py-2.5 font-semibold ${index > 0 ? "border-l border-harbor-100" : ""} ${column.className || ""}`}>
                    {column.label}
                  </th>
                ))}
                {actions && <th className="sticky top-0 z-10 border-l border-harbor-100 bg-harbor-50 px-4 py-2.5 text-right font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={span} className="px-4 py-8 text-center text-inkmute">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={span} className="px-4 py-8 text-center text-inkmute">{empty}</td>
                </tr>
              ) : (
                rows.map((row, rowIndex) => (
                  <tr key={rowKey(row)} className={`border-b border-harbor-100 text-inkstone transition-colors hover:bg-harbor-50 ${rowIndex % 2 === 1 ? "bg-harbor-50/40" : "bg-surface"}`}>
                    {columns.map((column, columnIndex) => (
                      <td key={column.key} className={`px-4 py-2.5 ${columnIndex > 0 ? "border-l border-harbor-100" : ""} ${column.className || ""}`}>
                        {column.render(row)}
                      </td>
                    ))}
                    {actions && <td className="border-l border-harbor-100 px-4 py-2.5 text-right"><div className="flex flex-wrap items-center justify-end gap-1">{actions(row)}</div></td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Pager({
  page,
  pages,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize?: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
}) {
  if (total <= 0 && !onPageSize) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-inkmute">
      <span>Showing page {page} of {pages} · {total} total records</span>
      <div className="flex flex-wrap items-center gap-3">
        {pages > 1 && (
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => onPage(Math.max(1, page - 1))} className="rounded-lg bg-harbor-600 px-3 py-1.5 font-medium text-white transition hover:bg-harbor-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">Prev</button>
            <button type="button" disabled={page >= pages} onClick={() => onPage(Math.min(pages, page + 1))} className="rounded-lg bg-harbor-600 px-3 py-1.5 font-medium text-white transition hover:bg-harbor-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">Next</button>
          </div>
        )}
        {onPageSize && pageSize && (
          <div className="flex items-center gap-2">
            <span>Show</span>
<Dropdown value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))} className="w-[4.5rem]">
              {[10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </Dropdown>
            <span>records per page</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function FormModal({
  open,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel = "Save",
  busy,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  children: ReactNode;
  submitLabel?: string;
  busy?: boolean;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-harbor-950/70 backdrop-blur-sm" />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`pointer-events-auto flex max-h-[calc(100dvh-1.5rem)] w-full ${wide ? "max-w-3xl" : "max-w-2xl"} flex-col overflow-hidden rounded-2xl border border-harbor-300/40 bg-surface shadow-[0_30px_80px_-20px_rgba(12,14,34,0.55)]`}
            >
              <div className="flex shrink-0 items-center justify-between bg-harbor-600 px-4 py-2.5 sm:px-5 sm:py-3">
                <h2 className="truncate text-[16px] font-bold text-white sm:text-[17px]">{title}</h2>
                <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30">
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSubmit?.();
                }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="admin-scroll flex-1 space-y-3 overflow-y-auto bg-surface px-4 py-3.5 sm:px-5 sm:py-4">{children}</div>
                <div className="flex shrink-0 justify-end gap-2 border-t border-harbor-100 bg-surface px-4 py-2.5 sm:px-5">
                  <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
                  <PrimaryButton type="submit" disabled={busy} className="py-1.5">{submitLabel}</PrimaryButton>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-harbor-950/70 backdrop-blur-sm" />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-auto w-full max-w-md overflow-hidden rounded-2xl border border-harbor-200 bg-surface shadow-[0_30px_80px_-20px_rgba(12,14,34,0.55)]"
            >
              <div className="bg-harbor-600 px-5 py-3">
                <h2 className="text-[17px] font-bold text-white">{title}</h2>
              </div>
              <p className="px-5 py-5 text-[14px] leading-relaxed text-inkstone">{body}</p>
              <div className="flex justify-end gap-2 border-t border-harbor-100 px-5 py-3">
                <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
                <button type="button" onClick={onConfirm} className="rounded-md bg-rose-600 px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-rose-700">{confirmLabel}</button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export function PanelCard({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-harbor-200 bg-surface p-3.5 shadow-[0_8px_24px_-16px_rgba(30,27,75,0.4)] ${className}`}>
      {title && <h2 className="text-[15px] font-bold text-inkstone">{title}</h2>}
      {children}
    </section>
  );
}
