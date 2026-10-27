"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, Group } from "@mantine/core";

const TABS = [
  { href: "/marketing", label: "What’s on", match: (p: string) => p === "/marketing" || p.startsWith("/marketing/campaigns") },
  { href: "/marketing/calendar", label: "Calendar", match: (p: string) => p.startsWith("/marketing/calendar") },
  { href: "/marketing/tasks", label: "My tasks", match: (p: string) => p.startsWith("/marketing/tasks"), admin: false },
  { href: "/marketing/team", label: "Team", match: (p: string) => p.startsWith("/marketing/team"), admin: true },
  { href: "/marketing/guide", label: "Guide", match: (p: string) => p.startsWith("/marketing/guide"), admin: false },
];

export default function MarketingNav({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  return (
    <Group gap={6} wrap="nowrap" style={{ overflowX: "auto" }}>
      {TABS.filter((t) => !("admin" in t && t.admin) || isAdmin).map((t) => {
        const on = t.match(path);
        return <Button key={t.href} component={Link} href={t.href} size="sm" radius="xl" variant={on ? "filled" : "default"} aria-current={on ? "page" : undefined}>{t.label}</Button>;
      })}
    </Group>
  );
}
