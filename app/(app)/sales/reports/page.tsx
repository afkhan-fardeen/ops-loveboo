import { Badge, Paper, SimpleGrid, Stack } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { TextLink } from "@/components/Links";
import { DataTable, EmptyState, Kpi, PageHeader } from "@/components/ui";
import { rowsUpTo } from "@/lib/data";
import { dateLabel, int, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Reports() {
  const rows = await rowsUpTo(undefined, 60, true);
  const last30 = rows.slice(0, 30);
  const net = last30.reduce((a, r) => a + r.net_sales, 0), orders = last30.reduce((a, r) => a + r.orders, 0);
  const best = last30.reduce((b, r) => (r.net_sales > (b?.net_sales ?? -1) ? r : b), last30[0]);
  const cur = rows[0]?.currency ?? "GBP";
  return (
    <Stack gap="lg">
      <PageHeader title="Reports" eyebrow="Daily sales, newest first" />
      {rows.length === 0 ? (
        <EmptyState title="No reports yet">Past days will be listed here once the daily job has run.</EmptyState>
      ) : (
        <>
        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Kpi label={`Net sales · ${last30.length} days`} value={money(net, cur)} />
          <Kpi label="Orders" value={int(orders)} />
          <Kpi label="Average per day" value={money(net / Math.max(last30.length, 1), cur)} />
          <Kpi label="Best day" value={money(best?.net_sales ?? 0, cur)} note={best ? dateLabel(best.date) : undefined} />
        </SimpleGrid>
        <Paper withBorder radius="lg" shadow="xs">
          <DataTable minWidth={0} rows={rows} rowKey={(r) => r.date} cols={[
            { label: "Date", render: (r) => <TextLink href={`/sales?date=${r.date}`}>{dateLabel(r.date, true)}</TextLink> },
            { label: "Net sales", align: "right", render: (r) => money(r.net_sales, r.currency) },
            { label: "Orders", align: "right", render: (r) => int(r.orders) },
            { label: "AOV", align: "right", hideBelow: "sm", render: (r) => money(r.orders ? r.net_sales / r.orders : 0, r.currency, 2) },
            { label: "Emailed", align: "right", hideBelow: "sm", render: (r) => (r.emailed_at ? <Badge color="brand" variant="light" leftSection={<IconCheck size={12} />}>Sent</Badge> : <Badge color="gray" variant="light">Not sent</Badge>) },
          ]} />
        </Paper>
        </>
      )}
    </Stack>
  );
}
