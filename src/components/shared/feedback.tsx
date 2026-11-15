"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Send, X } from "lucide-react";
import { toast as sonner } from "sonner";

type Kind = "success" | "error" | "send";
export type FeedbackAction = { label: string; onClick?: () => void; primary?: boolean };
export type FeedbackOptions = {
  title?: string;
  actions?: FeedbackAction[];
  /** Runs whenever the popup closes (button, backdrop, Esc or timeout). */
  onClose?: () => void;
  /** Milliseconds before it closes by itself. Errors never close by themselves. */
  duration?: number;
};
type Item = FeedbackOptions & { id: number; kind: Kind; message: string };

let emit: (item: Item) => void = () => {};
let counter = 0;

function fire(kind: Kind, message: string, options: FeedbackOptions = {}) {
  emit({ id: ++counter, kind, message, ...options });
}

/**
 * Centered, animated confirmation popups.
 *  - success: quick check-mark popup that closes by itself and never blocks the page
 *  - send: "paper plane" animation for submissions, with optional follow-up buttons
 *  - error: shows what to fix and waits for the user
 *  - quiet: a small corner toast for minor things (copy link, favorites)
 */
export const toast = {
  success: (message: string, options?: FeedbackOptions) => fire("success", message, options),
  error: (message: string, options?: FeedbackOptions) => fire("error", message, options),
  send: (message: string, options?: FeedbackOptions) => fire("send", message, options),
  quiet: (message: string) => sonner.success(message),
};

function parseMessage(message: string) {
  const parts = message.split(" · ");
  if (parts.length < 2) return { head: "", items: [] as string[], text: message };
  const colon = parts[0].indexOf(": ");
  const head = colon > -1 ? parts[0].slice(0, colon) : "";
  const first = colon > -1 ? parts[0].slice(colon + 2) : parts[0];
  return { head, items: [first, ...parts.slice(1)], text: "" };
}

function CheckBadge({ tone = "emerald" }: { tone?: "emerald" | "indigo" }) {
  const ring = tone === "emerald" ? "bg-emerald-500/25" : "bg-indigo-500/25";
  const fill = tone === "emerald" ? "from-emerald-400 to-emerald-600 shadow-emerald-500/40" : "from-indigo-400 to-violet-600 shadow-indigo-500/40";
  return (
    <div className="relative mx-auto h-24 w-24">
      {[0, 1].map((index) => (
        <motion.span key={index} className={`absolute inset-0 rounded-full ${ring}`} initial={{ scale: 0.6, opacity: 0.9 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 1.3, delay: 0.2 + index * 0.35, repeat: 1, ease: "easeOut" }} />
      ))}
      <motion.div className={`absolute inset-0 grid place-items-center rounded-full bg-gradient-to-br shadow-lg ${fill}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 15 }}>
        <svg viewBox="0 0 52 52" className="h-11 w-11" aria-hidden>
          <motion.path d="M14 27 l8 8 l16 -18" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }} />
        </svg>
      </motion.div>
      {Array.from({ length: 10 }).map((_, index) => {
        const angle = (index / 10) * Math.PI * 2;
        const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9"];
        return (
          <motion.span
            key={`dot-${index}`}
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full"
            style={{ background: colors[index % colors.length] }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{ x: Math.cos(angle) * 58, y: Math.sin(angle) * 58, scale: [0, 1, 0.5], opacity: [1, 1, 0] }}
            transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

function SendBadge() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 1250);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="mx-auto h-24 w-24">
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="plane" className="relative h-24 w-24" exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.18 }}>
            <motion.div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/40" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} />
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="absolute left-1/2 top-1/2 h-1.5 rounded-full bg-white/70"
                style={{ width: 16 - index * 3 }}
                initial={{ x: -42, y: 34, opacity: 0 }}
                animate={{ x: [-42, 0, 40], y: [34, 0, -40], opacity: [0, 0.8, 0] }}
                transition={{ duration: 1.05, delay: 0.12 + index * 0.07, ease: "easeInOut" }}
              />
            ))}
            <motion.div className="absolute inset-0 grid place-items-center text-white" initial={{ x: -42, y: 34, opacity: 0, scale: 0.7, rotate: -8 }} animate={{ x: [-42, 0, 46], y: [34, 0, -46], opacity: [0, 1, 0], scale: [0.7, 1.1, 0.8] }} transition={{ duration: 1.1, delay: 0.1, ease: "easeInOut" }}>
              <Send className="h-9 w-9" strokeWidth={1.8} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div key="check" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <CheckBadge tone="indigo" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ErrorBadge() {
  return (
    <div className="relative mx-auto h-24 w-24">
      <motion.span className="absolute inset-0 rounded-full bg-rose-500/25" initial={{ scale: 0.7, opacity: 0.9 }} animate={{ scale: 1.7, opacity: 0 }} transition={{ duration: 1.2, repeat: 1, ease: "easeOut" }} />
      <motion.div className="absolute inset-0 grid place-items-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-lg shadow-rose-500/40" initial={{ scale: 0 }} animate={{ scale: 1, x: [0, -7, 7, -5, 5, 0] }} transition={{ scale: { type: "spring", stiffness: 280, damping: 14 }, x: { delay: 0.25, duration: 0.5 } }}>
        <AlertTriangle className="h-11 w-11" strokeWidth={2} />
      </motion.div>
    </div>
  );
}

/** Mounted once in Providers. */
export function FeedbackHost() {
  const [item, setItem] = useState<Item | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef<Item | null>(null);

  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    const closing = current.current;
    current.current = null;
    setItem(null);
    closing?.onClose?.();
  }, []);

  useEffect(() => {
    emit = (next) => {
      if (timer.current) clearTimeout(timer.current);
      current.current = next;
      setItem(next);
      const auto = next.kind === "error" ? next.duration : (next.duration ?? (next.kind === "send" ? 8000 : 2300));
      if (auto) timer.current = setTimeout(close, auto);
    };
    return () => {
      emit = () => {};
    };
  }, [close]);

  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [item, close]);

  const blocking = item?.kind !== "success";
  const parsed = item ? parseMessage(item.message) : null;
  const title = item ? item.title || (item.kind === "error" ? "Please check this" : item.kind === "send" ? "Submitted!" : "Success") : "";
  const auto = item ? (item.kind === "error" ? item.duration : (item.duration ?? (item.kind === "send" ? 8000 : 2300))) : 0;
  const actions: FeedbackAction[] = item ? (item.actions?.length ? item.actions : item.kind === "error" ? [{ label: "Got it", primary: true }] : []) : [];

  return (
    <AnimatePresence>
      {item && parsed && (
        <div key={item.id} className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
          <motion.div
            className={`absolute inset-0 ${blocking ? "bg-slate-950/55 backdrop-blur-[3px]" : "pointer-events-none bg-slate-950/20"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={blocking ? close : undefined}
          />
          <motion.div
            role="alertdialog"
            aria-live={item.kind === "error" ? "assertive" : "polite"}
            aria-label={title}
            initial={{ opacity: 0, scale: 0.82, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            onClick={item.kind === "success" ? close : undefined}
            className={`relative w-full max-w-[400px] overflow-hidden rounded-3xl border bg-card px-7 pb-7 pt-8 text-center shadow-[0_30px_80px_-20px_rgba(30,27,75,0.6)] ${item.kind === "success" ? "cursor-pointer" : ""}`}
          >
            <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-28 opacity-70 ${item.kind === "error" ? "bg-gradient-to-b from-rose-500/15" : item.kind === "send" ? "bg-gradient-to-b from-indigo-500/20" : "bg-gradient-to-b from-emerald-500/15"} to-transparent`} />
            {blocking && (
              <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="relative">
              {item.kind === "success" && <CheckBadge />}
              {item.kind === "send" && <SendBadge />}
              {item.kind === "error" && <ErrorBadge />}
              <motion.h2 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-5 font-display text-xl font-extrabold tracking-tight">{title}</motion.h2>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {parsed.items.length ? (
                  <>
                    {parsed.head && <p className="mb-2">{parsed.head}</p>}
                    <ul className="space-y-1.5 text-left">
                      {parsed.items.map((line) => (
                        <li key={line} className="flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-foreground">
                          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.kind === "error" ? "bg-rose-500" : "bg-primary"}`} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p>{parsed.text}</p>
                )}
              </motion.div>
              {actions.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }} className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {actions.map((action, index) => (
                    <button
                      key={action.label}
                      type="button"
                      autoFocus={index === 0}
                      onClick={() => {
                        action.onClick?.();
                        // the action decides where to go, so skip the generic onClose
                        if (timer.current) clearTimeout(timer.current);
                        current.current = null;
                        setItem(null);
                      }}
                      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${action.primary || (index === 0 && actions.length === 1) ? (item.kind === "error" ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-primary text-primary-foreground hover:brightness-110") : "border hover:bg-muted"}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            {auto ? (
              <motion.div aria-hidden className={`absolute bottom-0 left-0 h-1 ${item.kind === "send" ? "bg-indigo-500" : "bg-emerald-500"}`} initial={{ width: "100%" }} animate={{ width: 0 }} transition={{ duration: auto / 1000, ease: "linear" }} />
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

