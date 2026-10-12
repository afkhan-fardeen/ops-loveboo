"use client";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTab } from "@mantine/core";
import { startProgress } from "@/lib/progress";

type Item = { href: string; label: string };

/** Tabs inside a single report (for example Daily Sales: Day / Period / Email settings). */
export default function ReportTabs({ items }: { items: Item[] }) {
  const router = useRouter();
  const path = usePathname();
  // The first tab is the report's own page; the others match by prefix.
  const current = items.find((i, n) => (n === 0 ? path === i.href : path.startsWith(i.href)))?.href ?? items[0].href;
  return (
    <Tabs value={current} onChange={(v) => { if (v && v !== current) { startProgress(); router.push(v); } }} mb="lg">
      <TabsList style={{ flexWrap: "nowrap", overflowX: "auto" }}>
        {items.map((i) => <TabsTab key={i.href} value={i.href}>{i.label}</TabsTab>)}
      </TabsList>
    </Tabs>
  );
}
