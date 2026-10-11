import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Kpi } from "@/components/ui";
import { DataTable } from "@/components/ui";
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
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/sales/reports" className="inline-flex min-h-11 items-center text-teal underline-offset-4 hover:underline">← All reports</Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold">{dateLabel(date, true)}</h1>
          <a href={`/sales/export?date=${date}`} className="inline-flex min-h-11 items-center rounded-xl border border-ink/15 bg-white/60 px-5 font-medium hover:bg-meadow/50">Download Excel</a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
        <Kpi label="Net sales" value={money(row.net_sales, cur)} deltas={[{ label: "vs prev day", value: s.vsPrev }, { label: "vs last week", value: s.vsWeek }]} />
        <Kpi label="Orders" value={int(row.orders)} note={`${int(row.units)} units`} />
        <Kpi label="Average order" value={money(s.aov, cur, 2)} />
        <Kpi label="Month to date" value={money(s.mtdNet, cur)} note={`${int(s.mtdOrders)} orders`} />
      </div>

      <Card className="p-0">
        <h2 className="px-5 pt-5 font-display text-lg font-semibold">Orders</h2>
        <p className="px-5 text-sm text-ink/70">Draft orders excluded. Amounts are net of VAT.</p>
        {row.order_list.length === 0 ? <p className="px-5 py-6 text-ink/70">No orders on this day.</p> : (
          <DataTable label="Orders on this day" rows={row.order_list} rowKey={(o) => o.name} cols={[
            { label: "Order", render: (o) => <span className="font-medium">{o.name}</span> },
            { label: "Time", render: (o) => timeIn(o.time, tz) },
            { label: "Amount", align: "right", render: (o) => num2(o.amount) },
            { label: "Discount", align: "right", render: (o) => num2(o.discount) },
          ]} />
        )}
      </Card>

      <Card className="p-0">
        <h2 className="px-5 pt-5 font-display text-lg font-semibold">Top products</h2>
        <DataTable label="Top 5 products" rows={row.top_products} rowKey={(p) => p.name} cols={[
          { label: "Product", render: (p) => p.name },
          { label: "Units", align: "right", render: (p) => int(p.units) },
          { label: "Net sales", align: "right", render: (p) => money(p.net, cur) },
        ]} />
      </Card>

      <Card className="p-0">
        <h2 className="px-5 pt-5 font-display text-lg font-semibold">Top locations</h2>
        <DataTable label="Top 5 locations" rows={row.locations.slice(0, 5)} rowKey={(l) => `${l.country}|${l.city}`} cols={[
          { label: "Location", render: (l) => (l.city === "Unknown" ? l.country : `${l.city}, ${l.country}`) },
          { label: "Orders", align: "right", render: (l) => int(l.orders) },
          { label: "Net sales", align: "right", render: (l) => money(l.net, cur) },
        ]} />
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">Email preview</h2>
        <p className="mb-3 text-sm text-ink/70">Subject: {email.subject}</p>
        <iframe title="Email preview" sandbox="" srcDoc={email.html} className="h-[640px] w-full rounded-xl border border-ink/10 bg-white" />
      </Card>
    </div>
  );
}
