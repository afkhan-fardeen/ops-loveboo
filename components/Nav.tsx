"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

const I = {
  overview: "M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  reports: "M5 3h14v18H5zM9 8h6M9 12h6M9 16h4",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.4-2.7a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.2-.8.2-1.2z",
};
const items = [
  { href: "/", label: "Overview", icon: I.overview },
  { href: "/reports", label: "Reports", icon: I.reports },
  { href: "/settings", label: "Settings", icon: I.settings },
];

const Icon = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
);

export default function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <>
      {/* Bottom tab bar < 768px */}
      <nav aria-label="Main" className="glass fixed inset-x-0 bottom-0 z-20 grid grid-cols-3 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined}
            className={cx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-sm", active(i.href) ? "font-semibold text-teal" : "text-ink/70")}>
            <Icon d={i.icon} />{i.label}
          </Link>
        ))}
      </nav>
      {/* Rail (768–1199) / sidebar (≥1200) */}
      <nav aria-label="Main" className="glass fixed inset-y-0 left-0 z-20 hidden w-16 flex-col gap-1 border-y-0 border-l-0 p-2 md:flex xl:w-58 xl:p-4">
        <Link href="/" className="mb-4 flex min-h-11 items-center justify-center gap-2 font-display text-xl font-semibold text-teal xl:justify-start xl:px-2">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-base text-white">B</span>
          <span className="hidden xl:inline">Love Boo</span>
        </Link>
        {items.map((i) => (
          <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined} title={i.label}
            className={cx("flex min-h-11 items-center justify-center gap-3 rounded-xl px-3 xl:justify-start", active(i.href) ? "bg-teal text-white" : "text-ink hover:bg-meadow/50")}>
            <Icon d={i.icon} /><span className="hidden xl:inline">{i.label}</span><span className="sr-only xl:hidden">{i.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
