"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "./ui";

const items = [
  { href: "/", label: "Overview" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  return (
    <header className="glass sticky top-0 z-20 rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-x-6 px-4 md:px-8">
        <Link href="/" className="flex min-h-14 items-center gap-2 font-display text-xl font-semibold text-teal">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-teal text-base text-white">B</span>
          Love Boo
        </Link>
        <nav aria-label="Main" className="-mx-1 flex w-full gap-1 pb-2 md:mx-0 md:w-auto md:pb-0">
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
