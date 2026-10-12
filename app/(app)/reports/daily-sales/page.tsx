import { Suspense } from "react";
import { Accordion, AccordionControl, AccordionItem, AccordionPanel, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconCalendarStats, IconCurrencyPound, IconEye, IconPercentage, IconReceipt2, IconSend, IconShoppingBag } from "@tabler/icons-react";
import { DownloadButton } from "@/components/Links";
import DateSwitcher from "@/components/DateSwitcher";
import LiveToday from "@/components/LiveToday";
import SalesChart from "@/components/SalesChart";
import { BodySkeleton } from "@/components/Skeletons";
import SubmitButton from "@/components/SubmitButton";
import { DataTable, EmptyState, Kpi, PageHeader, Section } from "@/components/ui";
import { dateBounds, rowsForSummary, summarise, tz as storeTz } from "@/lib/data";
import { buildEmail } from "@/lib/email";
import { dateLabel, int, money, num2, timeIn } from "@/lib/format";
import { firstName } from "@/lib/names";
import { requireModule } from "@/lib/auth";
import { sendTestEmail } from "../../actions";
import { sendReportNow } from "./actions";
import { activeRecipients, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Daily Sales" };

export default async function Overview({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireModule("reports");
  const { date: raw } = await searchParams;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  const bounds = await dateBounds();
  if (!bounds) return <EmptyState title="No sales yet">The first report appears after the daily job runs.</EmptyState>;

  const shown = date ?? bounds.max;
  return (
    <Stack gap="lg">
      <PageHeader eyebrow={shown === bounds.max ? "Daily Sales · latest report" : "Daily Sales"} title={dateLabel(shown, true)}>
        <DateSwitcher value={shown} min={bounds.min} max={bounds.max} />
      </PageHeader>
      {/* Keyed Suspense: switching days shows the skeleton at once while the numbers load. */}
      <Suspense key={shown} fallback={<BodySkeleton />}>
        <DayBody shown={shown} date={date} min={bounds.min} max={bounds.max} user={{ email: user.email, name: user.name, admin: user.role === "admin" }} />
      </Suspense>
    </Stack>
  );
}

async function DayBody({ shown, date, min, max, user }: { shown: string; date?: string; min: string; max: string; user: { email: string; name: string | null; admin: boolean } }) {
  const isAdmin = user.admin;
  const [rows, cfg] = await Promise.all([rowsForSummary(date), isAdmin ? getSettings() : Promise.resolve(null)]);
  const s = summarise(rows);

  if (!s || s.row.date !== shown)
    return <EmptyState title={`No report for ${dateLabel(shown, true)}`}>Pick another day. Reports exist from {dateLabel(min)} to {dateLabel(max)}.</EmptyState>;

  const { row } = s, cur = row.currency, tz = storeTz();
  const trend = rows.slice(0, 14).reverse().map((r) => ({ date: dateLabel(r.date), "Net sales": r.net_sales }));
  const email = buildEmail(s, process.env.APP_URL ?? "", firstName(user.email, user.name));

  return (
    <Stack gap="lg">
      {row.date === max && <LiveToday currency={cur} />}

      <SimpleGrid cols={{ base: 2, md: 3 }}>
        <Kpi icon={<IconCurrencyPound size={16} />} label="Net sales" value={money(row.net_sales, cur)} note={`Total sales ${money(row.total_sales, cur)} incl. shipping & VAT`} deltas={[{ label: "vs yesterday", value: s.vsPrev }, { label: "vs last week", value: s.vsWeek }]} />
        <Kpi icon={<IconShoppingBag size={16} />} label="Orders" value={int(row.orders)} note={`${int(row.units)} units`} />
        <Kpi icon={<IconReceipt2 size={16} />} label="Average order" value={money(s.aov, cur, 2)} />
        <Kpi icon={<IconEye size={16} />} label="Sessions" value={row.sessions ? int(row.sessions) : "—"} note={row.sources[0] ? `${row.sources[0].source} is ${Math.round((row.sources[0].sessions / row.sessions) * 100)}% of visits` : undefined} />
        <Kpi icon={<IconPercentage size={16} />} label="Conversion rate" value={row.sessions ? `${(row.conversion * 100).toFixed(2)}%` : "—"} note={row.sessions ? `${int(row.orders)} orders from ${int(row.sessions)} sessions` : undefined} />
        <Kpi icon={<IconCalendarStats size={16} />} label="Month to date" value={money(s.mtdNet, cur)} note={`${int(s.mtdOrders)} orders`} />
      </SimpleGrid>

      <Section title="Last 14 days" subtitle={`Net sales per day, up to ${dateLabel(row.date)}`}>
        <SalesChart data={trend} currency={cur} />
      </Section>

      <Section title="Sales breakdown" subtitle="Same layout as Shopify’s Sales report, so every line can be checked there." flush>
        <DataTable minWidth={0} rows={[
          { label: "Gross sales", value: row.gross_sales, kind: "" },
          { label: "Discounts", value: -row.discounts, kind: "" },
          { label: "Returns", value: -row.returns, kind: "" },
          { label: "Net sales", value: row.net_sales, kind: "sub" },
          { label: "Shipping", value: row.shipping, kind: "" },
          { label: "VAT", value: row.taxes, kind: "" },
          { label: "Total sales", value: row.total_sales, kind: "total" },
        ]} rowKey={(r) => r.label} cols={[
          { label: "Line", render: (r) => <Text size="sm" fw={r.kind ? 700 : 400}>{r.label}</Text> },
          { label: "Amount", align: "right", render: (r) => <Text size="sm" fw={r.kind ? 700 : 400} c={r.kind === "total" ? "brand" : undefined}>{r.value < 0 ? "−" : ""}{money(Math.abs(r.value), cur, 2)}</Text> },
        ]} />
      </Section>

      <Section title="Orders" subtitle="Draft orders excluded. Net sales excludes VAT and shipping; Total paid is what the customer paid, matching the order in Shopify." flush>
        {row.order_list.length === 0 ? <Text c="dimmed" p="md">No orders on this day.</Text> : (
          <DataTable minWidth={340} rows={row.order_list} rowKey={(o) => o.name} cols={[
            { label: "Order", render: (o) => <Text fw={600} size="sm">{o.name}</Text> },
            { label: "Time", render: (o) => timeIn(o.time, tz) },
            { label: "Net sales", align: "right", render: (o) => num2(o.amount) },
            { label: "Discount", align: "right", render: (o) => num2(o.discount) },
            { label: "Shipping", align: "right", hideBelow: "sm", render: (o) => num2(o.shipping ?? 0) },
            { label: "Total paid", align: "right", render: (o) => num2(o.total ?? o.amount) },
          ]} />
        )}
      </Section>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Section title="Where visitors came from" subtitle="Online store sessions" flush>
          {row.sources.length === 0 ? <Text c="dimmed" p="md">No traffic data for this day.</Text> : (
            <DataTable minWidth={300} rows={row.sources} rowKey={(x) => x.source} cols={[
              { label: "Source", render: (x) => <Text size="sm" tt="capitalize">{x.source}</Text> },
              { label: "Sessions", align: "right", render: (x) => int(x.sessions) },
              { label: "Share", align: "right", render: (x) => `${Math.round((x.sessions / row.sessions) * 100)}%` },
            ]} />
          )}
        </Section>
        <Section title="Discount codes" subtitle="Used on this day’s orders" flush>
          {row.discount_codes.length === 0 ? <Text c="dimmed" p="md">No discount codes were used.</Text> : (
            <DataTable minWidth={300} rows={row.discount_codes} rowKey={(c) => c.code} cols={[
              { label: "Code", render: (c) => <Text size="sm" fw={600}>{c.code}</Text> },
              { label: "Orders", align: "right", render: (c) => int(c.orders) },
              { label: "Discount", align: "right", render: (c) => money(c.discount, cur, 2) },
            ]} />
          )}
        </Section>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Section title="Top products" flush>
          <DataTable rows={row.top_products.slice(0, 8)} rowKey={(p) => p.name} cols={[
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

      <Section title="Share this day" subtitle={isAdmin ? "Send it to your recipients, email it to yourself, or download the Excel." : "Email this day’s summary to yourself or download the Excel."}>
        <Stack gap="sm">
          {isAdmin && cfg && (
            <form action={sendReportNow}>
              <input type="hidden" name="date" value={row.date} />
              <input type="hidden" name="returnTo" value={`/reports/daily-sales?date=${row.date}`} />
              <SubmitButton fullWidth leftSection={<IconSend size={16} />}
                confirm={`Send the report for ${dateLabel(row.date, true)} to ${activeRecipients(cfg).length} ${activeRecipients(cfg).length === 1 ? "recipient" : "recipients"} now?\n\n${activeRecipients(cfg).map((r) => r.email).join("\n") || "No active recipients."}`}>
                Send now to {activeRecipients(cfg).length} {activeRecipients(cfg).length === 1 ? "recipient" : "recipients"}
              </SubmitButton>
            </form>
          )}
          <form action={sendTestEmail}>
            <input type="hidden" name="date" value={row.date} />
            <SimpleGrid cols={{ base: 1, xs: 2 }}>
              <DownloadButton href={`/reports/daily-sales/export?date=${row.date}`}>Download Excel</DownloadButton>
              <SubmitButton variant="default">Email me this day</SubmitButton>
            </SimpleGrid>
          </form>
        </Stack>
      </Section>

      <Accordion variant="contained" radius="lg" chevronPosition="right">
        <AccordionItem value="email">
          <AccordionControl>Email preview</AccordionControl>
          <AccordionPanel>
            <Text size="sm" c="dimmed" mb="sm">Subject: {email.subject}</Text>
            <iframe title="Email preview" sandbox="" srcDoc={email.html} style={{ width: "100%", height: 460, border: "1px solid var(--mantine-color-default-border)", borderRadius: 8, background: "#fff" }} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Stack>
  );
}
