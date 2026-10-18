import { unstable_cache } from "next/cache";

/**
 * The store's timezone, read from Shopify so "a day" always means the same midnight Shopify's own reports use.
 * STORE_TIMEZONE is only a fallback if Shopify can't be reached. Cached for a day.
 */
const fromShopify = unstable_cache(async (): Promise<string | null> => {
  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION ?? "2025-07"}/graphql.json`, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN! },
    body: JSON.stringify({ query: "{ shop { ianaTimezone } }" }),
  });
  const json = (await res.json()) as { data?: { shop: { ianaTimezone: string } } };
  return json.data?.shop.ianaTimezone ?? null;
}, ["store-tz", "v1"], { revalidate: 86400 });

let memo: { tz: string; at: number } | null = null;

export async function getStoreTz(): Promise<string> {
  if (memo && Date.now() - memo.at < 3600_000) return memo.tz;
  let tz: string | null = null;
  try { tz = await fromShopify(); } catch { /* fall back below */ }
  tz = tz ?? process.env.STORE_TIMEZONE ?? "Europe/London";
  memo = { tz, at: Date.now() };
  return tz;
}
