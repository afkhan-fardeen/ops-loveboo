import Link from "next/link";
import { Badge, Card, DataTable, EmptyState } from "@/components/ui";
import { rowsUpTo } from "@/lib/data";
import { dateLabel, int, money } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Reports() {
  const rows = await rowsUpTo(undefined, 60);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold">Reports</h1>
      {rows.length === 0 ? (
        <EmptyState title="No reports yet">Past days will be listed here once the daily job has run.</EmptyState>
      ) : (
        <Card className="p-0">
          <DataTable
            label="Daily sales reports, newest first"
            rows={rows}
            rowKey={(r) => r.date}
            cols={[
              { label: "Date", render: (r) => <Link href={`/sales/reports/${r.date}`} className="font-medium text-teal underline-offset-4 hover:underline after:absolute after:inset-0">{dateLabel(r.date, true)}</Link> },
              { label: "Net sales", align: "right", render: (r) => money(r.net_sales, r.currency) },
              { label: "Orders", align: "right", render: (r) => int(r.orders) },
              { label: "AOV", align: "right", render: (r) => money(r.orders ? r.net_sales / r.orders : 0, r.currency, 2) },
              { label: "Emailed", align: "right", render: (r) => (r.emailed_at ? <Badge>✓ Sent</Badge> : <Badge tone="muted">Not sent</Badge>) },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
