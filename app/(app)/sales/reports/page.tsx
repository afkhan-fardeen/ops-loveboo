import { Badge, Paper, Stack } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { TextLink } from "@/components/Links";
import { DataTable, EmptyState, PageHeader } from "@/components/ui";
import { rowsUpTo } from "@/lib/data";
import { dateLabel, int, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Reports() {
  const rows = await rowsUpTo(undefined, 60, true);
  return (
    <Stack gap="lg">
      <PageHeader title="Reports" eyebrow="Daily sales, newest first" />
      {rows.length === 0 ? (
        <EmptyState title="No reports yet">Past days will be listed here once the daily job has run.</EmptyState>
      ) : (
        <Paper withBorder radius="md" shadow="xs">
          <DataTable minWidth={620} rows={rows} rowKey={(r) => r.date} cols={[
            { label: "Date", render: (r) => <TextLink href={`/sales/reports/${r.date}`}>{dateLabel(r.date, true)}</TextLink> },
            { label: "Net sales", align: "right", render: (r) => money(r.net_sales, r.currency) },
            { label: "Orders", align: "right", render: (r) => int(r.orders) },
            { label: "AOV", align: "right", render: (r) => money(r.orders ? r.net_sales / r.orders : 0, r.currency, 2) },
            { label: "Emailed", align: "right", render: (r) => (r.emailed_at ? <Badge color="brand" variant="light" leftSection={<IconCheck size={12} />}>Sent</Badge> : <Badge color="gray" variant="light">Not sent</Badge>) },
          ]} />
        </Paper>
      )}
    </Stack>
  );
}
