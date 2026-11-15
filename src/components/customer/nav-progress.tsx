"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function Bar() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);

  function stopTimers() {
    if (timer.current) clearInterval(timer.current);
    if (safety.current) clearTimeout(safety.current);
    timer.current = null;
    safety.current = null;
  }

  function finish() {
    if (!running.current) return;
    running.current = false;
    stopTimers();
    setWidth(100);
    setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 260);
  }

  function start() {
    if (running.current) return;
    running.current = true;
    setVisible(true);
    setWidth(10);
    timer.current = setInterval(() => setWidth((value) => value + (90 - value) * 0.14), 140);
    safety.current = setTimeout(finish, 10000);
  }

  // the page changed: complete the bar
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  // a link was clicked: start the bar right away, before the next page arrives
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      stopTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px]">
      <div
        style={{ width: `${width}%`, opacity: visible ? 1 : 0 }}
        className="h-full rounded-r-full bg-gradient-to-r from-primary via-violet-500 to-accent shadow-[0_0_10px_hsl(var(--primary)/0.6)] transition-[width,opacity] duration-200 ease-out"
      />
    </div>
  );
}

/** Thin progress line at the top of the page: starts on the click, ends when the new page is shown. */
export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <Bar />
    </Suspense>
  );
}
