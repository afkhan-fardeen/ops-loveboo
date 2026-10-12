"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/** Thin progress bar at the top: starts on internal link clicks and router pushes, finishes when the new page arrives. */
export default function TopProgress() {
  const path = usePathname();
  const search = useSearchParams().toString();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const hide = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTrickle = () => { if (timer.current) clearInterval(timer.current); timer.current = null; };
  const start = () => {
    if (hide.current) clearTimeout(hide.current);
    stopTrickle();
    setVisible(true); setWidth(12);
    // Ease towards 90% and wait there until the page actually arrives.
    timer.current = setInterval(() => setWidth((w) => (w < 90 ? w + (90 - w) * 0.12 : w)), 250);
  };

  // New page arrived: complete the bar, then fade it out.
  useEffect(() => {
    stopTrickle();
    setWidth((w) => (w > 0 ? 100 : 0));
    hide.current = setTimeout(() => { setVisible(false); setWidth(0); }, 350);
    return () => { if (hide.current) clearTimeout(hide.current); };
  }, [path, search]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target || a.hasAttribute("download") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname + url.search === location.pathname + location.search) return;
      start();
    };
    document.addEventListener("click", onClick);
    window.addEventListener("nav-start", start);
    return () => { document.removeEventListener("click", onClick); window.removeEventListener("nav-start", start); stopTrickle(); };
  }, []);

  return (
    <div aria-hidden className="top-progress" style={{ opacity: visible ? 1 : 0 }}>
      <div style={{ width: `${width}%` }} />
    </div>
  );
}
