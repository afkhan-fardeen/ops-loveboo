import { Badge, SimpleGrid, Stack, Tabs, TabsList, TabsPanel, TabsTab, Text } from "@mantine/core";
import { IconCheck, IconCurrencyPound, IconDiscount2, IconReceipt2, IconShoppingBag } from "@tabler/icons-react";
import { DownloadButton, TextLink } from "@/components/Links";
import RangePicker from "@/components/RangePicker";
import SalesChart from "@/components/SalesChart";
import SubmitButton from "@/components/SubmitButton";
import { DataTable, EmptyState, Kpi, PageHeader, Section } from "@/components/ui";
import { activeRecipients, getSettings } from "@/lib/settings";
import { sendReportNow } from "../actions";
import { aggLocations, aggProducts, byCountry, totals } from "@/lib/aggregate";
import { requireModule } from "@/lib/auth";
import { dateBounds, rowsBetween } from "@/lib/data";
import { addDays, dateLabel, int, money, pctChange } from "@/lib/format";

export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const share = (n: number, total: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : "—");

export default async function Reports({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const user = await requireModule("sales");
  const isAdmin = user.role === "admin";
  const q = await searchParams;
  const bounds = await dateBounds();
  if (!bounds) return <EmptyState title="No reports yet">Reports appear once the daily job has run.</EmptyState>;

  // Validate and clamp the range: within stored data, ordered, at most a year.
  let to = q.to && ISO.test(q.to) ? q.to : bounds.max;
  if (to > bounds.max) to = bounds.max;
  let from = q.from && ISO.test(q.from) ? q.from : addDays(to, -6);
  if (from < bounds.min) from = bounds.min;
  if (from > to) from = to;
  if (from < addDays(to, -365)) from = addDays(to, -365);

  const n = Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 864e5) + 1;
  const prevTo = addDays(from, -1), prevFrom = addDays(prevTo, -(n - 1));
  const hasPrev = prevTo >= bounds.min;
  const [rows, prevRows] = await Promise.all([rowsBetween(from, to), hasPrev ? rowsBetween(prevFrom, prevTo) : Promise.resolve([])]);

  const cur = rows[0]?.currency ?? "GBP";
  const recipients = isAdmin ? activeRecipients(await getSettings()) : [];
  const here = `/sales/reports?from=${from}&to=${to}`;
  const t = totals(rows), p = totals(prevRows);
  const vs = (a: number, b: number) => (hasPrev && prevRows.length ? pctChange(a, b) : null);
  const label = `vs previous ${n} ${n === 1 ? "day" : "days"}`;

  const byDate = new Map(rows.map((r) => [r.date, r.net_sales]));
  const prevByDate = new Map(prevRows.map((r) => [r.date, r.net_sales]));
  const chart = Array.from({ length: n }, (_, i) => {
    const d = addDays(from, i);
    return { date: dateLabel(d), "Net sales": byDate.get(d) ?? 0, "Previous period": prevByDate.get(addDays(prevFrom, i)) ?? 0 };
  });

  const products = aggProducts(rows), pTotal = products.reduce((a, x) => a + x.net, 0);
  const locs = aggLocations(rows), countries = byCountry(locs), lTotal = locs.reduce((a, x) => a + x.net, 0);

  return (
    <Stack gap="lg">
      <PageHeader eyebrow="Period report" title={n === 1 ? dateLabel(from, true) : `${dateLabel(from)} – ${dateLabel(to, true)}`}>
        <DownloadButton href={`/sales/export?from=${from}&to=${to}`}>Download Excel</DownloadButton>
      </PageHeader>

      <RangePicker from={from} to={to} min={bounds.min} max={bounds.max} />

      {rows.length === 0 ? (
        <EmptyState title="No data in this range">Pick a different period. Reports exist from {dateLabel(bounds.min)} to {dateLabel(bounds.max)}.</EmptyState>
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }}>
            <Kpi icon={<IconCurrencyPound size={16} />} label="Net sales" value={money(t.net, cur)} deltas={[{ label, value: vs(t.net, p.net) }]} />
            <Kpi icon={<IconShoppingBag size={16} />} label="Orders" value={int(t.orders)} note={`${int(t.units)} units`} deltas={[{ label, value: vs(t.orders, p.orders) }]} />
            <Kpi icon={<IconReceipt2 size={16} />} label="Average order" value={money(t.aov, cur, 2)} deltas={[{ label, value: vs(t.aov, p.aov) }]} />
            <Kpi icon={<IconDiscount2 size={16} />} label="Discounts" value={money(t.discounts, cur)} note={`${share(t.discounts, t.net + t.discounts)} of pre-discount sales`} />
          </SimpleGrid>

          <Section title="Daily net sales" subtitle={hasPrev && prevRows.length ? "Compared with the previous period of the same length" : "No earlier data to compare with"}>
            <SalesChart data={chart} currency={cur} compare={hasPrev && prevRows.length > 0} />
          </Section>

          <Tabs defaultValue="days" keepMounted={false}>
            <TabsList mb="md" style={{ flexWrap: "nowrap", overflowX: "auto" }}>
              <TabsTab value="days">Days</TabsTab>
              <TabsTab value="products">Products</TabsTab>
              <TabsTab value="locations">Locations</TabsTab>
            </TabsList>

            <TabsPanel value="days">
              <Section title={`${rows.length} days`} flush>
                <DataTable minWidth={0} rows={rows} rowKey={(r) => r.date} cols={[
                  { label: "Date", render: (r) => <TextLink href={`/sales?date=${r.date}`}>{dateLabel(r.date, true)}</TextLink> },
                  { label: "Net sales", align: "right", render: (r) => money(r.net_sales, cur) },
                  { label: "Orders", align: "right", render: (r) => int(r.orders) },
                  { label: "AOV", align: "right", hideBelow: "sm", render: (r) => money(r.orders ? r.net_sales / r.orders : 0, cur, 2) },
                  { label: "Discounts", align: "right", hideBelow: "md", render: (r) => money(r.discounts, cur, 2) },
                  ...(isAdmin ? [{ label: "Send", align: "right" as const, render: (r: { date: string }) => (
                    <form action={sendReportNow}>
                      <input type="hidden" name="date" value={r.date} />
                      <input type="hidden" name="returnTo" value={here} />
                      <SubmitButton variant="subtle" size="compact-sm" aria-label={`Send the ${r.date} report now`}
                        confirm={`Send the report for ${dateLabel(r.date, true)} to ${recipients.length} ${recipients.length === 1 ? "recipient" : "recipients"} now?\n\n${recipients.map((x) => x.email).join("\n") || "No active recipients."}`}>Send now</SubmitButton>
                    </form>
                  ) }] : []),
                  { label: "Emailed", align: "right", hideBelow: "md", render: (r) => (r.emailed_at ? <Badge color="brand" variant="light" leftSection={<IconCheck size={12} />}>Sent</Badge> : <Badge color="gray" variant="light">Not sent</Badge>) },
                ]} />
              </Section>
            </TabsPanel>

            <TabsPanel value="products">
              <Section title="Top products" subtitle="Based on each day’s top 15 products, so very small sellers aren’t listed." flush>
                <DataTable rows={products.slice(0, 20)} rowKey={(x) => x.name} cols={[
                  { label: "Product", render: (x) => x.name },
                  { label: "Units", align: "right", render: (x) => int(x.units) },
                  { label: "Net sales", align: "right", render: (x) => money(x.net, cur) },
                  { label: "Share", align: "right", hideBelow: "sm", render: (x) => share(x.net, pTotal) },
                ]} />
              </Section>
            </TabsPanel>

            <TabsPanel value="locations">
              <SimpleGrid cols={{ base: 1, lg: 2 }}>
                <Section title="By country" flush>
                  <DataTable minWidth={320} rows={countries.slice(0, 15)} rowKey={(x) => x.country} cols={[
                    { label: "Country", render: (x) => x.country },
                    { label: "Orders", align: "right", render: (x) => int(x.orders) },
                    { label: "Net sales", align: "right", render: (x) => money(x.net, cur) },
                    { label: "Share", align: "right", render: (x) => share(x.net, lTotal) },
                  ]} />
                </Section>
                <Section title="Top cities" flush>
                  <DataTable minWidth={320} rows={locs.slice(0, 15)} rowKey={(x) => `${x.country}|${x.city}`} cols={[
                    { label: "City", render: (x) => (x.city === "Unknown" ? `Unknown, ${x.country}` : `${x.city}, ${x.country}`) },
                    { label: "Orders", align: "right", render: (x) => int(x.orders) },
                    { label: "Net sales", align: "right", render: (x) => money(x.net, cur) },
                  ]} />
                </Section>
              </SimpleGrid>
            </TabsPanel>
          </Tabs>
          <Text size="xs" c="dimmed">Amounts are net of VAT and exclude draft orders.</Text>
        </>
      )}
    </Stack>
  );
}
