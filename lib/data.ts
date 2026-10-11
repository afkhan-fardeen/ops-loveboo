import { addDays, pctChange } from "./format";
import { adminClient } from "./supabase";

export type Product = { name: string; units: number; net: number };
export type Order = { name: string; time: string; units?: number; amount: number; discount: number };
export type Location = { country: string; city: string; orders: number; units: number; net: number };
export type Row = {
  date: string; net_sales: number; discounts: number; orders: number; units: number;
  top_products: Product[]; locations: Location[]; order_list: Order[]; currency: string; emailed_at: string | null;
};

export const tz = () => process.env.STORE_TIMEZONE ?? "Europe/London";

const norm = (r: Row): Row => ({ ...r, net_sales: Number(r.net_sales), discounts: Number(r.discounts ?? 0), top_products: r.top_products ?? [], locations: r.locations ?? [], order_list: r.order_list ?? [] });

/** Newest-first rows on or before `upTo` (default: everything). One query, ≤ limit rows. */
const LIGHT = "date,net_sales,discounts,orders,units,currency,emailed_at";

export async function rowsUpTo(upTo?: string, limit = 60, light = false): Promise<Row[]> {
  const db = adminClient();
  let q = db.from("daily_sales").select((light ? LIGHT : "*") as "*").order("date", { ascending: false }).limit(limit);
  if (upTo) q = q.lte("date", upTo);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as Row[]).map(norm);
}

/** Oldest and newest stored dates, for the date switcher limits. */
export async function dateBounds(): Promise<{ min: string; max: string } | null> {
  const db = adminClient();
  const [a, b] = await Promise.all([
    db.from("daily_sales").select("date").order("date", { ascending: true }).limit(1),
    db.from("daily_sales").select("date").order("date", { ascending: false }).limit(1),
  ]);
  return a.data?.[0] && b.data?.[0] ? { min: a.data[0].date, max: b.data[0].date } : null;
}

/** Newest day in full plus lighter rows behind it (for deltas and month-to-date): smaller payload, parallel queries. */
export async function rowsForSummary(upTo?: string, limit = 40): Promise<Row[]> {
  const [head, rest] = await Promise.all([rowsUpTo(upTo, 1), rowsUpTo(upTo, limit, true)]);
  return head.length ? [head[0], ...rest.filter((r) => r.date !== head[0].date)] : [];
}

/** Everything the UI and the email need about one day, derived from stored rows. */
export function summarise(rows: Row[]) {
  const row = rows[0];
  if (!row) return null;
  const find = (d: string) => rows.find((r) => r.date === d);
  const month = row.date.slice(0, 7);
  const mtd = rows.filter((r) => r.date.startsWith(month));
  const prev = find(addDays(row.date, -1));
  const week = find(addDays(row.date, -7));
  return {
    row,
    aov: row.orders ? row.net_sales / row.orders : 0,
    vsPrev: pctChange(row.net_sales, prev?.net_sales),
    vsWeek: pctChange(row.net_sales, week?.net_sales),
    mtdNet: mtd.reduce((s, r) => s + r.net_sales, 0),
    mtdOrders: mtd.reduce((s, r) => s + r.orders, 0),
  };
}
export type Summary = NonNullable<ReturnType<typeof summarise>>;
