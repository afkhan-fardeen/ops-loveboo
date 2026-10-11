import { Alert, Button, SimpleGrid, Stack } from "@mantine/core";
import { IconCheck, IconInfoCircle } from "@tabler/icons-react";
import { DownloadButton } from "@/components/Links";
import SalesChart from "@/components/SalesChart";
import { DataTable, EmptyState, Kpi, PageHeader, Section } from "@/components/ui";
import { rowsUpTo, summarise } from "@/lib/data";
import { dateLabel, int, money } from "@/lib/format";
import { sendTestEmail } from "../actions";

export const dynamic = "force-dynamic";

const NOTICE: Record<string, { text: string; ok: boolean }> = {
  sent: { text: "Test email sent to your inbox.", ok: true },
  unconfigured: { text: "Email isn’t configured yet. Add RESEND_API_KEY to send a test.", ok: false },
  failed: { text: "The test email couldn’t be sent. Check your email settings and try again.", ok: false },
};

export default async function Overview({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const { test } = await searchParams;
  const rows = await rowsUpTo(undefined, 40);
  const s = summarise(rows);

  if (!s) return <EmptyState title="No sales yet">The first report appears after the daily job runs.</EmptyState>;

  const { row } = s, cur = row.currency;
  const trend = rows.slice(0, 14).reverse().map((r) => ({ date: dateLabel(r.date), "Net sales": r.net_sales }));
  const notice = test ? NOTICE[test] : undefined;

  return (
    <Stack gap="lg">
      <PageHeader eyebrow="Latest report" title={dateLabel(row.date, true)}>
        <DownloadButton href={`/sales/export?date=${row.date}`}>Download Excel</DownloadButton>
        <form action={sendTestEmail}><Button type="submit" variant="default">Email me this</Button></form>
      </PageHeader>

      {notice && (
        <Alert color={notice.ok ? "teal" : "red"} icon={notice.ok ? <IconCheck size={18} /> : <IconInfoCircle size={18} />}>{notice.text}</Alert>
      )}

      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <Kpi label="Net sales" value={money(row.net_sales, cur)} deltas={[{ label: "vs yesterday", value: s.vsPrev }, { label: "vs last week", value: s.vsWeek }]} />
        <Kpi label="Orders" value={int(row.orders)} note={`${int(row.units)} units`} />
        <Kpi label="Average order" value={money(s.aov, cur, 2)} />
        <Kpi label="Month to date" value={money(s.mtdNet, cur)} note={`${int(s.mtdOrders)} orders`} />
      </SimpleGrid>

      <Section title="Last 14 days" subtitle="Net sales per day">
        <SalesChart data={trend} currency={cur} />
      </Section>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Section title="Top products" flush>
          <DataTable rows={row.top_products} rowKey={(p) => p.name} cols={[
            { label: "Product", render: (p) => p.name },
            { label: "Units", align: "right", render: (p) => int(p.units) },
            { label: "Net sales", align: "right", render: (p) => money(p.net, cur) },
          ]} />
        </Section>
        <Section title="Top locations" flush>
          <DataTable rows={row.locations.slice(0, 5)} rowKey={(l) => `${l.country}|${l.city}`} cols={[
            { label: "Location", render: (l) => (l.city === "Unknown" ? l.country : `${l.city}, ${l.country}`) },
            { label: "Orders", align: "right", render: (l) => int(l.orders) },
            { label: "Net sales", align: "right", render: (l) => money(l.net, cur) },
          ]} />
        </Section>
      </SimpleGrid>
    </Stack>
  );
}
