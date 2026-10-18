import { unstable_cache } from "next/cache";
import { adminClient } from "./supabase";

export type Order = { name: string; time: string; units?: number; amount: number; discount: number; shipping?: number; tax?: number; total?: number; country?: string };
export type Location = { country: string; city: string; orders: number; units: number; net: number };
export type Row = {
  date: string; orders: number; units: number; net_sales: number; discounts: number; shipping: number; taxes: number; total_sales: number;
  currency: string; emailed_at: string | null; locations: Location[]; order_list: Order[];
};

const COLUMNS = "date,orders,units,net_sales,discounts,shipping,taxes,total_sales,currency,emailed_at,locations,order_list";

/** Fills in defaults and converts numeric columns (Postgres returns numerics as strings). */
export const norm = (r: Row): Row => ({
  ...r, net_sales: Number(r.net_sales), discounts: Number(r.discounts ?? 0), shipping: Number(r.shipping ?? 0),
  taxes: Number(r.taxes ?? 0), total_sales: Number(r.total_sales ?? 0), locations: r.locations ?? [], order_list: r.order_list ?? [],
});

/** One stored day, or the newest day when `date` is omitted. Uncached: use right after writing (cron, send now) so emails never use stale numbers. */
export async function fetchRow(date?: string): Promise<Row | null> {
  let q = adminClient().from("daily_sales").select(COLUMNS as "*");
  q = date ? q.eq("date", date) : q.order("date", { ascending: false }).limit(1);
  const { data, error } = await q.maybeSingle();
  if (error) throw error;
  return data ? norm(data as unknown as Row) : null;
}

/** The newest stored date. Uncached, so the page can notice a missing day immediately. */
export async function latestDate(): Promise<string | null> {
  const { data } = await adminClient().from("daily_sales").select("date").order("date", { ascending: false }).limit(1).maybeSingle();
  return data?.date ?? null;
}

// Stored days change once a day (cron) or on "Send email now", both of which call revalidateTag("sales").
const CACHE = { revalidate: 300, tags: ["sales"] };
const cachedRow = unstable_cache(async (date: string | null) => fetchRow(date ?? undefined), ["day-row", "v3"], CACHE);
export const dayRow = async (date?: string) => {
  const r = await cachedRow(date ?? null);
  return r ? norm(r) : null;
};

async function queryBounds(): Promise<{ min: string; max: string } | null> {
  const db = adminClient();
  const [a, b] = await Promise.all([
    db.from("daily_sales").select("date").order("date", { ascending: true }).limit(1),
    db.from("daily_sales").select("date").order("date", { ascending: false }).limit(1),
  ]);
  return a.data?.[0] && b.data?.[0] ? { min: a.data[0].date, max: b.data[0].date } : null;
}
/** Oldest and newest stored dates, for the date switcher limits. */
export const dateBounds = unstable_cache(queryBounds, ["date-bounds", "v3"], CACHE);
