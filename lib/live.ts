import { fetchDay } from "./shopify";
import { todayIn } from "./format";

type Live = Awaited<ReturnType<typeof fetchDay>> & { date: string; updatedAt: string };
let cache: { at: number; data: Promise<Live> } | null = null;

/** Today's partial numbers, straight from Shopify. Not stored; cached 60 s per server instance. */
export async function liveToday(): Promise<Live> {
  if (cache && Date.now() - cache.at < 60_000) return cache.data;
  const date = todayIn(process.env.STORE_TIMEZONE ?? "Europe/London");
  // Cache the promise so simultaneous viewers share one Shopify call; drop it on failure.
  const data = fetchDay(date).then((day): Live => ({ ...day, date, updatedAt: new Date().toISOString() }));
  cache = { at: Date.now(), data };
  data.catch(() => { if (cache?.data === data) cache = null; });
  return data;
}
