import { dayRange } from "./format";
import type { Location, Order, Product } from "./data";

const QUERY = `query($q: String!, $after: String) {
  orders(first: 100, after: $after, query: $q) {
    pageInfo { hasNextPage endCursor }
    nodes {
      name
      createdAt
      taxesIncluded
      sourceName
      currentSubtotalPriceSet { shopMoney { currencyCode } }
      shippingAddress { country city }
      lineItems(first: 100) {
        nodes {
          name quantity currentQuantity
          originalTotalSet { shopMoney { amount } }
          discountAllocations { allocatedAmountSet { shopMoney { amount } } }
          taxLines { priceSet { shopMoney { amount } } }
        }
      }
    }
  }
}`;

type Money = { shopMoney: { amount: string } };
type LineItem = {
  name: string; quantity: number; currentQuantity: number; originalTotalSet: Money;
  discountAllocations: { allocatedAmountSet: Money }[]; taxLines: { priceSet: Money }[];
};
type ShopifyOrder = {
  name: string; createdAt: string; taxesIncluded: boolean; sourceName: string | null;
  currentSubtotalPriceSet: { shopMoney: { currencyCode: string } };
  shippingAddress: { country: string | null; city: string | null } | null;
  lineItems: { nodes: LineItem[] };
};

const amount = (m: Money) => Number(m.shopMoney.amount);
const round2 = (n: number) => Math.round(n * 100) / 100;
const tidyCity = (c: string | null | undefined) =>
  (c ?? "").trim().toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase()) || "Unknown";

/**
 * One day of sales, in the store timezone. Net sales = items sold after every discount (line and order level),
 * excluding VAT when prices include it, excluding shipping, adjusted for returns. Draft orders are skipped.
 * Everything (day total, products, locations, per-order amounts) is summed from the same line items.
 */
export async function fetchDay(date: string) {
  const { from, to } = dayRange(date, process.env.STORE_TIMEZONE ?? "Europe/London");
  const q = `created_at:>='${from}' created_at:<'${to}' -status:cancelled -test:true`;
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION ?? "2025-07"}/graphql.json`;

  let net = 0, discounts = 0, orders = 0, units = 0, currency = "GBP", after: string | null = null;
  const products = new Map<string, Product>();
  const places = new Map<string, Location>();
  const orderList: Order[] = [];

  do {
    const res: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN! },
      body: JSON.stringify({ query: QUERY, variables: { q, after } }),
      cache: "no-store",
    });
    const json = (await res.json()) as { data?: { orders: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: ShopifyOrder[] } }; errors?: unknown };
    if (!res.ok || json.errors || !json.data) throw new Error(`Shopify: ${JSON.stringify(json.errors ?? res.status)}`);
    const page = json.data.orders;

    for (const o of page.nodes) {
      if (o.sourceName === "shopify_draft_order") continue;
      orders++;
      currency = o.currentSubtotalPriceSet.shopMoney.currencyCode;

      const country = o.shippingAddress?.country ?? "Unknown", city = tidyCity(o.shippingAddress?.city);
      const place = places.get(`${country}|${city}`) ?? { country, city, orders: 0, units: 0, net: 0 };
      place.orders++;
      const entry: Order = { name: o.name, time: o.createdAt, units: 0, amount: 0, discount: 0 };

      for (const li of o.lineItems.nodes) {
        const kept = li.quantity ? li.currentQuantity / li.quantity : 1; // quantity left after returns
        const allocated = li.discountAllocations.reduce((t, d) => t + amount(d.allocatedAmountSet), 0);
        const afterDiscount = amount(li.originalTotalSet) - allocated;
        const vat = o.taxesIncluded ? li.taxLines.reduce((t, x) => t + amount(x.priceSet), 0) : 0;
        const lineNet = (afterDiscount - vat) * kept;
        // Express the discount ex-VAT as well, so net + discount ties back to pre-discount sales.
        const lineDiscount = (afterDiscount > 0 ? allocated * ((afterDiscount - vat) / afterDiscount) : allocated) * kept;

        entry.amount += lineNet;
        entry.discount += lineDiscount;
        entry.units! += li.currentQuantity;
        place.units += li.currentQuantity;
        units += li.currentQuantity;

        const p = products.get(li.name) ?? { name: li.name, units: 0, net: 0 };
        p.units += li.currentQuantity;
        p.net += lineNet;
        products.set(li.name, p);
      }

      place.net += entry.amount;
      places.set(`${country}|${city}`, place);
      net += entry.amount;
      discounts += entry.discount;
      orderList.push({ ...entry, amount: round2(entry.amount), discount: round2(entry.discount) });
    }
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);

  const top = [...products.values()].sort((a, b) => b.net - a.net).slice(0, 15).map((p) => ({ ...p, net: round2(p.net) }));
  const locations = [...places.values()].sort((a, b) => b.net - a.net).map((l) => ({ ...l, net: round2(l.net) }));
  return {
    net_sales: round2(net), discounts: round2(discounts), orders, units, top_products: top, locations,
    order_list: orderList.sort((a, b) => b.time.localeCompare(a.time)), currency,
  };
}
