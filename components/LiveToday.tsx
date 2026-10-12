"use client";
import { useCallback, useEffect, useState } from "react";
import { ActionIcon, Group, Paper, Skeleton, Text, Tooltip } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";

type Live = { date: string; net_sales: number; orders: number; units: number; discounts: number; updatedAt: string };

/** "Today so far": polls every minute while the tab is visible. */
export default function LiveToday({ currency }: { currency: string }) {
  const [data, setData] = useState<Live | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch("/reports/daily-sales/live", { cache: "no-store" });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(() => document.visibilityState === "visible" && load(), 60_000);
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    const onVisible = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(poll); clearInterval(tick); document.removeEventListener("visibilitychange", onVisible); };
  }, [load]);

  const money = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const ago = data ? Math.max(0, Math.round((now - new Date(data.updatedAt).getTime()) / 1000)) : 0;
  const agoText = ago < 20 ? "just now" : ago < 90 ? `${ago}s ago` : `${Math.round(ago / 60)} min ago`;

  return (
    <Paper withBorder p="sm" px="md" aria-live="polite">
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Group gap="sm" wrap="nowrap">
          <span className="live-dot" data-stale={failed || undefined} aria-hidden />
          <Text size="sm" fw={600}>Today so far</Text>
          {!data && !failed && <Skeleton h={16} w={160} />}
          {data && <Text size="sm">{data.orders} {data.orders === 1 ? "order" : "orders"} · <Text span fw={600}>{money(data.net_sales)}</Text> net</Text>}
          {failed && <Text size="sm" c="dimmed">Couldn’t refresh{data ? ", showing the last update" : ""}</Text>}
        </Group>
        <Group gap={6} wrap="nowrap">
          {data && <Text size="xs" c="dimmed">Updated {agoText}</Text>}
          <Tooltip label="Refresh now"><ActionIcon variant="subtle" color="gray" size="sm" onClick={load} loading={busy} aria-label="Refresh today’s numbers"><IconRefresh size={16} /></ActionIcon></Tooltip>
        </Group>
      </Group>
    </Paper>
  );
}
