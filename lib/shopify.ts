import { dayRange } from "./format";
import { TZ } from "./timezone";
import type { Location, Order } from "./data";
import { lineAmounts, refundAmounts } from "./lines";

const REFUNDS = `refunds {
  createdAt
  refundLineItems(first: 100) { nodes { quantity lineItem { id name } subtotalSet { shopMoney { amount } } totalTaxSet { shopMoney { amount } } } }
  refundShippingLines(first: 10) { nodes { subtotalAmountSet { shopMoney { amount } } taxAmountSet { shopMoney { amount } } } }
}`;

const ORDERS = `query($q: String!, $after: String) {
  orders(first: 100, after: $after, query: $q) {
    pageInfo { hasNextPage endCursor }
    nodes {
      name createdAt processedAt taxesIncluded sourceName
      currentTotalPriceSet { shopMoney { amount } }
      currentTotalTaxSet { shopMoney { amount } }
      currentSubtotalPriceSet { shopMoney { currencyCode } }
      shippingAddress { country city }
      lineItems(first: 100) {
        nodes {
          id name quantity currentQuantity
          originalTotalSet { shopMoney { amount } }
          discountAllocations { allocatedAmountSet { shopMoney { amount } } }
          taxLines { priceSet { shopMoney { amount } } }
        }
      }
      ${REFUNDS}
    }
  }
}`;

const REFUND_ORDERS = `query($q: String!, $after: String) {
  orders(first: 100, after: $after, query: $q) {
    pageInfo { hasNextPage endCursor }
    nodes { name taxesIncluded sourceName shippingAddress { country city } ${REFUNDS} }
  }
}`;

type Money = { shopMoney: { amount: string } };
type RefundNode = {
  createdAt: string;
  refundLineItems: { nodes: { quantity: number; lineItem: { id: string; name: string } | null; subtotalSet: Money; totalTaxSet: Money }[] };
  refundShippingLines: { nodes: { subtotalAmountSet: Money; taxAmountSet: Money }[] };
};
type Address = { country: string | null; city: string | null } | null;
type ShopifyOrder = {
  name: string; createdAt: string; processedAt: string | null; taxesIncluded: boolean; sourceName: string | null;
  currentTotalPriceSet: Money; currentTotalTaxSet: Money; currentSubtotalPriceSet: { shopMoney: { currencyCode: string } };
  shippingAddress: Address;
  lineItems: { nodes: { id: string; name: string; quantity: number; currentQuantity: number; originalTotalSet: Money; discountAllocations: { allocatedAmountSet: Money }[]; taxLines: { priceSet: Money }[] }[] };
  refunds: RefundNode[];
};
type RefundOrder = { name: string; taxesIncluded: boolean; sourceName: string | null; shippingAddress: Address; refunds: RefundNode[] };
type Page<T> = { data?: { orders: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: T[] } }; errors?: unknown };

const amount = (m: Money) => Number(m.shopMoney.amount);
const round2 = (n: number) => Math.round(n * 100) / 100;
const tidyCity = (c: string | null | undefined) =>
  (c ?? "").trim().toLowerCase().replace(/(^|[\s-])\p{L}/gu, (m) => m.toUpperCase()) || "Unknown";
const refundInput = (taxesIncluded: boolean, r: RefundNode) => ({
  taxesIncluded,
  items: r.refundLineItems.nodes.map((i) => ({ quantity: i.quantity, subtotal: amount(i.subtotalSet), tax: amount(i.totalTaxSet) })),
  shipping: r.refundShippingLines.nodes.map((s) => ({ subtotal: amount(s.subtotalAmountSet), tax: amount(s.taxAmountSet) })),
});

async function paginate<T>(query: string, q: string): Promise<T[]> {
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION ?? "2025-07"}/graphql.json`;
  const out: T[] = [];
  let after: string | null = null;
  do {
    const res: Response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN! },
      body: JSON.stringify({ query, variables: { q, after } }),
      cache: "no-store",
    });
    const json = (await res.json()) as Page<T>;
    if (!res.ok || json.errors || !json.data) throw new Error(`Shopify: ${JSON.stringify(json.errors ?? res.status)}`);
    out.push(...json.data.orders.nodes);
    after = json.data.orders.pageInfo.hasNextPage ? json.data.orders.pageInfo.endCursor : null;
  } while (after);
  return out;
}

/** One refund or return that happened on some day, on any order. Orders from drafts and test orders are skipped. */
export type RefundEvent = ReturnType<typeof refundAmounts> & { order: string; at: string; country: string; city: string };

/** Every refund booked since `sinceIso`, across all orders. Fetch once and reuse when loading many days. */
export async function fetchRefunds(sinceIso: string): Promise<RefundEvent[]> {
  const orders = await paginate<RefundOrder>(REFUND_ORDERS, `updated_at:>='${sinceIso}' -status:cancelled -test:true`);
  const events: RefundEvent[] = [];
  for (const o of orders) {
    if (o.sourceName === "shopify_draft_order") continue;
    for (const r of o.refunds) {
      if (r.createdAt < sinceIso) continue;
      const a = refundAmounts(refundInput(o.taxesIncluded, r));
      events.push({
        ...a, order: o.name, at: r.createdAt, country: o.shippingAddress?.country ?? "Unknown", city: tidyCity(o.shippingAddress?.city)
      });
    }
  }
  return events;
}

/**
 * One day of sales in the store timezone, booked the way Shopify's Sales report books it:
 * an order counts on the day it was processed (Shopify dates sales by processed time; items after every discount, ex VAT when prices include it, ex shipping),
 * and each refund or return counts as a negative line on the day it happened, even for older orders.
 * Draft orders are skipped. The day total, locations and the order list are all built from the same lines.
 */
export async function fetchDay(date: string, opts: { refunds?: RefundEvent[] } = {}) {
  const tz = TZ;
  const { from, to } = dayRange(date, tz);
  const orders = await paginate<ShopifyOrder>(ORDERS, `processed_at:>='${from}' processed_at:<'${to}' -status:cancelled -test:true`);
  const refunds = (opts.refunds ?? (await fetchRefunds(from))).filter((e) => e.at >= from && e.at < to);

  let net = 0, discounts = 0, shipping = 0, taxes = 0, totalSales = 0, count = 0, units = 0, currency = "GBP";
  const places = new Map<string, Location>();
  const orderList: Order[] = [];
  const place = (country: string, city: string) => {
    const k = `${country}|${city}`;
    const p = places.get(k) ?? { country, city, orders: 0, units: 0, net: 0 };
    places.set(k, p);
    return p;
  };

  for (const o of orders) {
    if (o.sourceName === "shopify_draft_order") continue;
    count++;
    currency = o.currentSubtotalPriceSet.shopMoney.currencyCode;
    const country = o.shippingAddress?.country ?? "Unknown", city = tidyCity(o.shippingAddress?.city);
    const p = place(country, city);
    p.orders++;
    const entry: Order = { name: o.name, time: o.processedAt ?? o.createdAt, units: 0, amount: 0, discount: 0, country };

    // Quantity taken out by refunds is booked on the refund day; only order *edits* reduce the order's own day.
    const refundedQty = new Map<string, number>();
    for (const r of o.refunds) for (const i of r.refundLineItems.nodes) if (i.lineItem) refundedQty.set(i.lineItem.id, (refundedQty.get(i.lineItem.id) ?? 0) + i.quantity);

    for (const li of o.lineItems.nodes) {
      const edited = Math.max(0, li.quantity - li.currentQuantity - (refundedQty.get(li.id) ?? 0));
      const standing = li.quantity - edited;
      const allocated = li.discountAllocations.reduce((t, d) => t + amount(d.allocatedAmountSet), 0);
      const vat = o.taxesIncluded ? li.taxLines.reduce((t, x) => t + amount(x.priceSet), 0) : 0;
      const { net: lineNet, discount: lineDiscount } = lineAmounts({ quantity: li.quantity, currentQuantity: standing, original: amount(li.originalTotalSet), allocated, vat });

      entry.amount += lineNet; entry.discount += lineDiscount; entry.units! += standing;
      p.units += standing; units += standing;
    }

    // What the customer paid before any refund, and the VAT inside it. Shipping (ex VAT) is what remains after items and VAT.
    const back = o.refunds.reduce((t, r) => { const a = refundAmounts(refundInput(o.taxesIncluded, r)); return { total: t.total + a.total, tax: t.tax + a.tax }; }, { total: 0, tax: 0 });
    const total = amount(o.currentTotalPriceSet) + back.total, tax = amount(o.currentTotalTaxSet) + back.tax;
    const ship = Math.max(0, total - entry.amount - tax);

    p.net += entry.amount;
    net += entry.amount; discounts += entry.discount; shipping += ship; taxes += tax; totalSales += total;
    orderList.push({ ...entry, amount: round2(entry.amount), discount: round2(entry.discount), shipping: round2(ship), tax: round2(tax), total: round2(total) });
  }

  for (const e of refunds) {
    net -= e.returnsEx; shipping -= e.shippingEx; taxes -= e.tax; totalSales -= e.total; units -= e.units;
    place(e.country, e.city).net -= e.returnsEx;
    orderList.push({ name: `${e.order} · refund`, time: e.at, units: -e.units, amount: -round2(e.returnsEx), discount: 0, shipping: -round2(e.shippingEx), tax: -round2(e.tax), total: -round2(e.total), country: e.country });
  }

  const locations = [...places.values()].sort((a, b) => b.net - a.net).map((l) => ({ ...l, net: round2(l.net) }));
  return {
    net_sales: round2(net), discounts: round2(discounts), shipping: round2(shipping), taxes: round2(taxes), total_sales: round2(totalSales),
    orders: count, units, locations, order_list: orderList.sort((a, b) => b.time.localeCompare(a.time)), currency,
  };
}
