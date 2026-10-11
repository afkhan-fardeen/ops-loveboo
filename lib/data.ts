import { addDays, pctChange, yesterdayIn } from "./format";
import { adminClient, hasSupabase, serverClient } from "./supabase";

export type Product = { name: string; units: number; net: number };
export type Row = {
  date: string; net_sales: number; orders: number; units: number;
  top_products: Product[]; currency: string; emailed_at: string | null;
};

export const tz = () => process.env.STORE_TIMEZONE ?? "Europe/London";
export const isDemo = () => !hasSupabase();

/** Deterministic sample data so the UI is usable before Supabase is connected. */
function demoRows(): Row[] {
  const names = ["Calm Body Wash", "Oat Milk Cleanser", "Rose Hand Cream", "Sleep Pillow Mist", "Bath Soak"];
  const end = yesterdayIn(tz());
  return Array.from({ length: 60 }, (_, i) => {
    const date = addDays(end, -i);
    const wave = 1 + 0.25 * Math.sin(i / 2.3) + ((i * 37) % 11) / 60;
    const orders = Math.round(34 * wave);
    const net = Math.round(orders * (31 + ((i * 13) % 9)) * 100) / 100;
    return {
      date, net_sales: net, orders, units: Math.round(orders * 1.6), currency: "GBP",
      emailed_at: i === 0 ? null : date,
      top_products: names.map((name, k) => ({ name, units: Math.max(1, Math.round(orders * (0.5 - k * 0.08))), net: Math.round(net * (0.3 - k * 0.05) * 100) / 100 })),
    };
  });
}

const norm = (r: Row): Row => ({ ...r, net_sales: Number(r.net_sales), top_products: r.top_products ?? [] });

/** Newest-first rows on or before `upTo` (default: everything). One query, ≤ limit rows. */
export async function rowsUpTo(upTo?: string, limit = 60, admin = false): Promise<Row[]> {
  if (isDemo()) return demoRows().filter((r) => !upTo || r.date <= upTo).slice(0, limit);
  const db = admin ? adminClient() : await serverClient();
  let q = db.from("daily_sales").select("*").order("date", { ascending: false }).limit(limit);
  if (upTo) q = q.lte("date", upTo);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Row[]).map(norm);
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
