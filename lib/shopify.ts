import { dayRange } from "./format";
import type { Product } from "./data";

const QUERY = `query($q: String!, $after: String) {
  orders(first: 100, after: $after, query: $q) {
    pageInfo { hasNextPage endCursor }
    nodes {
      currentSubtotalPriceSet { shopMoney { amount currencyCode } }
      lineItems(first: 100) { nodes { name currentQuantity discountedTotalSet { shopMoney { amount } } } }
    }
  }
}`;

/** Net sales ≈ order subtotal after discounts and returns (excludes shipping/tax). Paginated orders fallback; swap for ShopifyQL if enabled. */
export async function fetchDay(date: string) {
  const { from, to } = dayRange(date, process.env.STORE_TIMEZONE ?? "Europe/London");
  const q = `created_at:>='${from}' created_at:<'${to}' -status:cancelled -test:true`;
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION ?? "2025-07"}/graphql.json`;

  let net = 0, orders = 0, units = 0, currency = "GBP", after: string | null = null;
  const products = new Map<string, Product>();

  do {
    const res: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN! },
      body: JSON.stringify({ query: QUERY, variables: { q, after } }),
      cache: "no-store",
    });
    const json: any = await res.json();
    if (!res.ok || json.errors) throw new Error(`Shopify: ${JSON.stringify(json.errors ?? res.status)}`);
    const page: any = json.data.orders;
    for (const o of page.nodes as any[]) {
      orders++;
      net += Number(o.currentSubtotalPriceSet.shopMoney.amount);
      currency = o.currentSubtotalPriceSet.shopMoney.currencyCode;
      for (const li of o.lineItems.nodes) {
        units += li.currentQuantity;
        const p = products.get(li.name) ?? { name: li.name, units: 0, net: 0 };
        p.units += li.currentQuantity;
        p.net += Number(li.discountedTotalSet.shopMoney.amount);
        products.set(li.name, p);
      }
    }
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  const top = [...products.values()].sort((a, b) => b.net - a.net).slice(0, 5)
    .map((p) => ({ ...p, net: Math.round(p.net * 100) / 100 }));
  return { net_sales: Math.round(net * 100) / 100, orders, units, top_products: top, currency };
}
