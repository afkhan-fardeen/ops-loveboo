import { Button, Card, DataTable, EmptyState, Kpi, Sparkline } from "@/components/ui";
import { rowsUpTo, summarise } from "@/lib/data";
import { dateLabel, int, money } from "@/lib/format";
import { sendTestEmail } from "./actions";

export const dynamic = "force-dynamic";

const NOTICE: Record<string, string> = {
  sent: "Test email sent to your inbox.",
  unconfigured: "Email isn’t configured yet. Add RESEND_API_KEY and Supabase to send a test.",
  failed: "The test email couldn’t be sent. Check your email settings and try again.",
};

export default async function Overview({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const { test } = await searchParams;
  const rows = await rowsUpTo(undefined, 40);
  const s = summarise(rows);

  if (!s)
    return (
      <EmptyState title="No sales yet">
        The first report appears after the daily job runs. You can backfill the last 60 days from the cron route.
      </EmptyState>
    );

  const { row } = s, cur = row.currency;
  const trend = rows.slice(0, 14).reverse();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-ink/70">Yesterday</p>
          <h1 className="font-display text-3xl font-semibold">{dateLabel(row.date, true)}</h1>
        </div>
        <form action={sendTestEmail}><Button variant="ghost" type="submit">Send test email</Button></form>
      </div>

      {test && NOTICE[test] && <p role="status" className="rounded-xl bg-meadow px-4 py-2 text-ink">{NOTICE[test]}</p>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <Kpi label="Net sales" value={money(row.net_sales, cur)} deltas={[{ label: "vs yesterday", value: s.vsPrev }, { label: "vs last week", value: s.vsWeek }]} />
        <Kpi label="Orders" value={int(row.orders)} note={`${int(row.units)} units`} />
        <Kpi label="Average order" value={money(s.aov, cur, 2)} />
        <Kpi label="Month to date" value={money(s.mtdNet, cur)} note={`${int(s.mtdOrders)} orders`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <h2 className="font-display text-lg font-semibold">Last 14 days</h2>
          <p className="mb-3 text-sm text-ink/70">Net sales per day</p>
          <Sparkline values={trend.map((r) => r.net_sales)} label={`Net sales, ${trend.length} days, latest ${money(row.net_sales, cur)}`} />
        </Card>
        <Card className="p-0 xl:col-span-3">
          <h2 className="px-5 pt-5 font-display text-lg font-semibold">Top products</h2>
          <DataTable
            label="Top 5 products by net sales"
            rows={row.top_products}
            rowKey={(p) => p.name}
            cols={[
              { label: "Product", render: (p) => p.name },
              { label: "Units", align: "right", render: (p) => int(p.units) },
              { label: "Net sales", align: "right", render: (p) => money(p.net, cur) },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
