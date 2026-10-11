import { notFound } from "next/navigation";
import { SimpleGrid, Stack, Text } from "@mantine/core";
import { DownloadButton, TextLink } from "@/components/Links";
import { DataTable, Kpi, PageHeader, Section } from "@/components/ui";
import { buildEmail } from "@/lib/email";
import { rowsUpTo, summarise, tz as storeTz } from "@/lib/data";
import { dateLabel, int, money, num2, timeIn } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Day({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const s = summarise(await rowsUpTo(date, 40));
  if (!s || s.row.date !== date) notFound();

  const { row } = s, cur = row.currency, tz = storeTz();
  const email = buildEmail(s, process.env.APP_URL ?? "");

  return (
    <Stack gap="lg">
      <div>
        <TextLink href="/sales/reports">← All reports</TextLink>
        <PageHeader title={dateLabel(date, true)}>
          <DownloadButton href={`/sales/export?date=${date}`}>Download Excel</DownloadButton>
        </PageHeader>
      </div>

      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <Kpi label="Net sales" value={money(row.net_sales, cur)} deltas={[{ label: "vs prev day", value: s.vsPrev }, { label: "vs last week", value: s.vsWeek }]} />
        <Kpi label="Orders" value={int(row.orders)} note={`${int(row.units)} units`} />
        <Kpi label="Average order" value={money(s.aov, cur, 2)} />
        <Kpi label="Discounts" value={money(row.discounts, cur, 2)} />
      </SimpleGrid>

      <Section title="Orders" subtitle="Draft orders excluded. Amounts are net of VAT." flush>
        {row.order_list.length === 0 ? <Text c="dimmed" p="md">No orders on this day.</Text> : (
          <DataTable rows={row.order_list} rowKey={(o) => o.name} cols={[
            { label: "Order", render: (o) => <Text fw={600} size="sm">{o.name}</Text> },
            { label: "Time", render: (o) => timeIn(o.time, tz) },
            { label: "Amount", align: "right", render: (o) => num2(o.amount) },
            { label: "Discount", align: "right", render: (o) => num2(o.discount) },
          ]} />
        )}
      </Section>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Section title="Top products" flush>
          <DataTable rows={row.top_products} rowKey={(p) => p.name} cols={[
            { label: "Product", render: (p) => p.name },
            { label: "Units", align: "right", render: (p) => int(p.units) },
            { label: "Net sales", align: "right", render: (p) => money(p.net, cur) },
          ]} />
        </Section>
        <Section title="Locations" flush>
          <DataTable rows={row.locations.slice(0, 5)} rowKey={(l) => `${l.country}|${l.city}`} cols={[
            { label: "Location", render: (l) => (l.city === "Unknown" ? l.country : `${l.city}, ${l.country}`) },
            { label: "Orders", align: "right", render: (l) => int(l.orders) },
            { label: "Net sales", align: "right", render: (l) => money(l.net, cur) },
          ]} />
        </Section>
      </SimpleGrid>

      <Section title="Email preview" subtitle={`Subject: ${email.subject}`}>
        <iframe title="Email preview" sandbox="" srcDoc={email.html} style={{ width: "100%", height: 720, border: "1px solid var(--mantine-color-default-border)", borderRadius: 8, background: "#fff" }} />
      </Section>
    </Stack>
  );
}
