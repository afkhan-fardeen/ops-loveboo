import { fetchDay } from "./shopify";
import { todayIn } from "./format";

type Live = Awaited<ReturnType<typeof fetchDay>> & { date: string; updatedAt: string };
let cache: { at: number; data: Live } | null = null;

/** Today's partial numbers, straight from Shopify. Not stored; cached 60 s per server instance. */
export async function liveToday(): Promise<Live> {
  if (cache && Date.now() - cache.at < 60_000) return cache.data;
  const date = todayIn(process.env.STORE_TIMEZONE ?? "Europe/London");
  const day = await fetchDay(date);
  const data: Live = { ...day, date, updatedAt: new Date().toISOString() };
  cache = { at: Date.now(), data };
  return data;
}
