"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "./ui";

type Item = { href: string; label: string };
const useActive = () => {
  const path = usePathname();
  return (href: string, exact = false) => (exact || href === "/" ? path === href : path.startsWith(href));
};

/** Global header: logo, section links, user slot. */
export default function Nav({ items, children }: { items: Item[]; children?: ReactNode }) {
  const active = useActive();
  return (
    <header className="glass sticky top-0 z-20 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-6 px-4 md:px-8">
        <Link href="/" className="flex min-h-14 items-center gap-2 font-display text-xl font-semibold text-teal">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-base text-white">B</span>
          Love Boo
        </Link>
        <div className="order-2 ml-auto md:order-3">{children}</div>
        <nav aria-label="Main" className="order-3 flex w-full gap-1 pb-2 md:order-2 md:w-auto md:flex-1 md:pb-0">
          {items.map((i) => (
            <Link key={i.href} href={i.href} aria-current={active(i.href) ? "page" : undefined}
              className={cx("flex min-h-11 flex-1 items-center justify-center rounded-xl px-4 text-base md:flex-none",
                active(i.href) ? "bg-teal font-medium text-white" : "text-ink hover:bg-meadow/60")}>
              {i.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

/** Module-level tabs (underline style). */
export function Tabs({ items }: { items: Item[] }) {
  const active = useActive();
  return (
    <nav aria-label="Module" className="-mt-2 mb-6 flex gap-1 overflow-x-auto border-b border-ink/10">
      {items.map((i) => {
        const on = active(i.href, i.href === items[0].href);
        return (
          <Link key={i.href} href={i.href} aria-current={on ? "page" : undefined}
            className={cx("flex min-h-11 items-center border-b-2 px-4 text-base whitespace-nowrap", on ? "border-teal font-medium text-teal" : "border-transparent text-ink/70 hover:text-ink")}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
