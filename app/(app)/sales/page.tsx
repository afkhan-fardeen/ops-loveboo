import { Accordion, AccordionControl, AccordionItem, AccordionPanel, SimpleGrid, Stack, Text } from "@mantine/core";
import { IconCalendarStats, IconCurrencyPound, IconReceipt2, IconSend, IconShoppingBag } from "@tabler/icons-react";
import { DownloadButton } from "@/components/Links";
import DateSwitcher from "@/components/DateSwitcher";
import LiveToday from "@/components/LiveToday";
import SalesChart from "@/components/SalesChart";
import SubmitButton from "@/components/SubmitButton";
import { DataTable, EmptyState, Kpi, PageHeader, Section } from "@/components/ui";
import { dateBounds, rowsForSummary, summarise, tz as storeTz } from "@/lib/data";
import { buildEmail } from "@/lib/email";
import { dateLabel, int, money, num2, timeIn } from "@/lib/format";
import { firstName } from "@/lib/names";
import { requireModule } from "@/lib/auth";
import { sendTestEmail } from "../actions";
import { sendReportNow } from "./actions";
import { activeRecipients, getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function Overview({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireModule("sales");
  const { date: raw } = await searchParams;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  const isAdmin = user.role === "admin";
  const [bounds, rows, cfg] = await Promise.all([dateBounds(), rowsForSummary(date), isAdmin ? getSettings() : Promise.resolve(null)]);

  if (!bounds) return <EmptyState title="No sales yet">The first report appears after the daily job runs.</EmptyState>;

  const s = summarise(rows);
  const shown = date ?? bounds.max;

  if (!s || s.row.date !== shown)
    return (
      <Stack gap="lg">
        <PageHeader title="Sales"><DateSwitcher value={shown} min={bounds.min} max={bounds.max} /></PageHeader>
        <EmptyState title={`No report for ${dateLabel(shown, true)}`}>Pick another day. Reports exist from {dateLabel(bounds.min)} to {dateLabel(bounds.max)}.</EmptyState>
      </Stack>
    );

  const { row } = s, cur = row.currency, tz = storeTz();
  const trend = rows.slice(0, 14).reverse().map((r) => ({ date: dateLabel(r.date), "Net sales": r.net_sales }));
  const email = buildEmail(s, process.env.APP_URL ?? "", firstName(user.email, user.name));

  return (
    <Stack gap="lg">
      <PageHeader eyebrow={row.date === bounds.max ? "Latest report" : "Sales report"} title={dateLabel(row.date, true)}>
        <DateSwitcher value={row.date} min={bounds.min} max={bounds.max} />
      </PageHeader>

      {row.date === bounds.max && <LiveToday currency={cur} />}

      <SimpleGrid cols={{ base: 2, md: 4 }}>
        <Kpi icon={<IconCurrencyPound size={16} />} label="Net sales" value={money(row.net_sales, cur)} note={`${money(row.discounts, cur, 2)} discounts`} deltas={[{ label: "vs yesterday", value: s.vsPrev }, { label: "vs last week", value: s.vsWeek }]} />
        <Kpi icon={<IconShoppingBag size={16} />} label="Orders" value={int(row.orders)} note={`${int(row.units)} units`} />
        <Kpi icon={<IconReceipt2 size={16} />} label="Average order" value={money(s.aov, cur, 2)} />
        <Kpi icon={<IconCalendarStats size={16} />} label="Month to date" value={money(s.mtdNet, cur)} note={`${int(s.mtdOrders)} orders`} />
      </SimpleGrid>

      <Section title="Last 14 days" subtitle={`Net sales per day, up to ${dateLabel(row.date)}`}>
        <SalesChart data={trend} currency={cur} />
      </Section>

      <Section title="Orders" subtitle="Draft orders excluded. Amounts are net of VAT." flush>
        {row.order_list.length === 0 ? <Text c="dimmed" p="md">No orders on this day.</Text> : (
          <DataTable minWidth={320} rows={row.order_list} rowKey={(o) => o.name} cols={[
            { label: "Order", render: (o) => <Text fw={600} size="sm">{o.name}</Text> },
            { label: "Time", render: (o) => timeIn(o.time, tz) },
            { label: "Amount", align: "right", render: (o) => num2(o.amount) },
            { label: "Discount", align: "right", render: (o) => num2(o.discount) },
          ]} />
        )}
      </Section>

      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Section title="Top products" flush>
          <DataTable rows={row.top_products.slice(0, 5)} rowKey={(p) => p.name} cols={[
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
              <input type="hidden" name="returnTo" value={`/sales?date=${row.date}`} />
              <SubmitButton fullWidth leftSection={<IconSend size={16} />}
                confirm={`Send the report for ${dateLabel(row.date, true)} to ${activeRecipients(cfg).length} ${activeRecipients(cfg).length === 1 ? "recipient" : "recipients"} now?\n\n${activeRecipients(cfg).map((r) => r.email).join("\n") || "No active recipients."}`}>
                Send now to {activeRecipients(cfg).length} {activeRecipients(cfg).length === 1 ? "recipient" : "recipients"}
              </SubmitButton>
            </form>
          )}
          <form action={sendTestEmail}>
            <input type="hidden" name="date" value={row.date} />
            <SimpleGrid cols={{ base: 1, xs: 2 }}>
              <DownloadButton href={`/sales/export?date=${row.date}`}>Download Excel</DownloadButton>
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
