import { Suspense } from "react";
import { Group, Paper, Stack, Text } from "@mantine/core";
import DateSwitcher from "@/components/DateSwitcher";
import { SettingsLink } from "@/components/Links";
import SendEmailDialog from "@/components/SendEmailDialog";
import { BodySkeleton } from "@/components/Skeletons";
import { DataTable, EmptyState, PageHeader } from "@/components/ui";
import { requireModule } from "@/lib/auth";
import { dateBounds, dayRow } from "@/lib/data";
import { TZ } from "@/lib/timezone";
import { dateLabel, int, money, num2, time12 } from "@/lib/format";
import { activeRecipients, getSettings } from "@/lib/settings";
import LoadMissing from "@/components/LoadMissing";
import { missingDays } from "@/lib/missing";
import { loadMissingDays, sendDayEmail } from "./actions";

export const metadata = { title: "Daily Sales" };
export const dynamic = "force-dynamic";

export default async function DailySales({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireModule("reports");
  const isAdmin = user.role === "admin";
  const { date: raw } = await searchParams;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  const bounds = await dateBounds();
  if (!bounds) return <EmptyState title="No reports yet">The first report appears after the daily job has run.</EmptyState>;

  const shown = date ?? bounds.max;
  const missing = await missingDays();
  const recipients = isAdmin ? activeRecipients(await getSettings()).map(({ name, email }) => ({ name, email })) : [];

  return (
    <Stack gap="lg">
      <PageHeader eyebrow="Daily Sales" title={dateLabel(shown, true)}>
        <DateSwitcher value={shown} min={bounds.min} max={bounds.max} />
        {isAdmin && <SendEmailDialog date={shown} label={dateLabel(shown, true)} recipients={recipients} action={sendDayEmail} />}
        {isAdmin && <SettingsLink href="/reports/daily-sales/settings" />}
      </PageHeader>
      {missing.length > 0 && <LoadMissing action={loadMissingDays} />}
      {/* Keyed Suspense: switching days shows the skeleton at once while the numbers load. */}
      <Suspense key={shown} fallback={<BodySkeleton />}>
        <Day date={shown} min={bounds.min} max={bounds.max} />
      </Suspense>
    </Stack>
  );
}

async function Day({ date, min, max }: { date: string; min: string; max: string }) {
  const row = await dayRow(date);
  if (!row) return <EmptyState title={`No report for ${dateLabel(date, true)}`}>Pick another day. Reports exist from {dateLabel(min)} to {dateLabel(max)}.</EmptyState>;
  const cur = row.currency, tz = TZ;
  const lines: [string, string, boolean?][] = [
    ["Orders", int(row.orders)],
    ["Units sold", int(row.units)],
    ["Total sales", money(row.total_sales, cur, 2), true],
    ["Discounts given", money(row.discounts, cur, 2)],
  ];

  return (
    <Stack gap="lg">
      <Paper withBorder p="lg">
        <Text fw={700} mb="xs">Love Boo Store — {dateLabel(date, true)}</Text>
        <Stack gap={0}>
          {lines.map(([label, value, strong]) => (
            <Group key={label} justify="space-between" py={10} style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}>
              <Text size="sm" c={strong ? undefined : "dimmed"} fw={strong ? 700 : 400}>{label}</Text>
              <Text size="sm" fw={strong ? 700 : 600} c={strong ? "brand" : undefined} style={{ fontVariantNumeric: "tabular-nums" }}>{value}</Text>
            </Group>
          ))}
        </Stack>
        <Text size="xs" c="dimmed" mt="sm">
          Total sales is what customers paid: net sales {money(row.net_sales, cur, 2)} + shipping {money(row.shipping, cur, 2)} + VAT {money(row.taxes, cur, 2)}. Draft orders excluded.
        </Text>
      </Paper>

      <Paper withBorder p={0}>
        {row.order_list.length === 0 ? <Text c="dimmed" p="md">No orders on this day.</Text> : (
          <DataTable minWidth={320} rows={row.order_list} rowKey={(o) => `${o.name}${o.time}`} cols={[
            { label: "Order", render: (o) => <Text fw={600} size="sm">{o.name}</Text> },
            { label: "Time", render: (o) => time12(o.time, tz) },
            { label: "Amount", align: "right", render: (o) => num2(o.total ?? o.amount) },
            { label: "Discount", align: "right", render: (o) => num2(o.discount) },
          ]} />
        )}
      </Paper>
    </Stack>
  );
}
