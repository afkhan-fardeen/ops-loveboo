import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dayRange, pct, pctChange } from "../lib/format";
import { summarise, type Row } from "../lib/data";

const row = (date: string, net: number, orders = 1): Row => ({
  date, net_sales: net, discounts: 0, gross_sales: net, returns: 0, shipping: 0, taxes: 0, total_sales: net, sessions: 0, conversion: 0, sources: [], discount_codes: [], orders, units: orders, currency: "GBP", emailed_at: null, top_products: [], locations: [], order_list: [],
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("dayRange follows the store timezone, including DST", () => {
  assert.deepEqual(dayRange("2026-10-10", "Asia/Kuwait"), { from: "2026-10-09T21:00:00.000Z", to: "2026-10-10T21:00:00.000Z" });
  assert.equal(dayRange("2026-07-01", "Europe/London").from, "2026-06-30T23:00:00.000Z"); // BST
  assert.equal(dayRange("2026-01-15", "Europe/London").from, "2026-01-15T00:00:00.000Z"); // GMT
  // 25-hour day when clocks go back
  const d = dayRange("2026-10-25", "Europe/London");
  assert.equal((Date.parse(d.to) - Date.parse(d.from)) / 3.6e6, 25);
});

test("pctChange handles empty baselines", () => {
  assert.equal(pctChange(110, 100), 10);
  assert.equal(pctChange(5, 0), null);
  assert.equal(pctChange(5, undefined), null);
  assert.equal(pct(-4.25), "−4.3%");
});

test("summarise derives deltas and month-to-date from stored rows", () => {
  const rows = [row("2026-10-10", 120, 4), row("2026-10-09", 100), row("2026-10-03", 60), row("2026-09-30", 999)];
  const s = summarise(rows)!;
  assert.equal(s.vsPrev, 20);
  assert.equal(s.vsWeek, 100); // 3 Oct is exactly 7 days before 10 Oct (60 → 120)
  assert.equal(s.mtdNet, 280);
  assert.equal(s.mtdOrders, 6);
  assert.equal(s.aov, 30);
});

test("lineAmounts: discount, VAT and returns", async () => {
  const { lineAmounts } = await import("../lib/lines");
  const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);
  // £12 item, no discount, no VAT
  let r = lineAmounts({ quantity: 1, currentQuantity: 1, original: 12, allocated: 0, vat: 0 });
  close(r.net, 12); close(r.discount, 0); close(r.returned, 0);
  // £12 with £2 discount: net 10, discount 2
  r = lineAmounts({ quantity: 1, currentQuantity: 1, original: 12, allocated: 2, vat: 0 });
  close(r.net, 10); close(r.discount, 2);
  // VAT-inclusive: £12 with £2 discount, £1.67 VAT inside → net 8.33; discount ex VAT = 2 × (8.33/10)
  r = lineAmounts({ quantity: 1, currentQuantity: 1, original: 12, allocated: 2, vat: 1.67 });
  close(r.net, 8.33); close(r.discount, 2 * (8.33 / 10));
  // 2 bought, 1 returned: half stays, half is returned
  r = lineAmounts({ quantity: 2, currentQuantity: 1, original: 20, allocated: 0, vat: 0 });
  close(r.net, 10); close(r.returned, 10);
  // fully discounted line has no division by zero
  r = lineAmounts({ quantity: 1, currentQuantity: 1, original: 5, allocated: 5, vat: 0 });
  close(r.net, 0); close(r.discount, 5);
});

test("norm fills fields missing from older cached rows, so totals are never NaN", async () => {
  const { norm } = await import("../lib/data");
  const old = { date: "2026-10-10", net_sales: "82.86", orders: 6, units: 9, currency: "GBP", emailed_at: null } as unknown as Row;
  const r = norm(old);
  assert.equal(r.total_sales, 0);
  assert.equal(r.shipping, 0);
  assert.equal(r.net_sales, 82.86);
  assert.ok([r.gross_sales, r.returns, r.taxes, r.discounts].every((n) => Number.isFinite(n)));
});

test("refundAmounts matches Shopify's Sales report for real refunds", async () => {
  const { refundAmounts } = await import("../lib/lines");
  const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);
  // LB2778: one item returned, £7.29 incl. £1.22 VAT. Shopify showed sales reversals of −£6.07 on that day.
  let r = refundAmounts({ taxesIncluded: true, items: [{ quantity: 1, subtotal: 7.29, tax: 1.22 }], shipping: [] });
  close(r.returnsEx, 6.07); close(r.tax, 1.22); close(r.total, 7.29); close(r.shippingEx, 0); assert.equal(r.units, 1);
  // LB2866: shipping-only refund of £18.52 (no VAT). Shopify showed shipping −£18.52 on 7 Oct.
  r = refundAmounts({ taxesIncluded: true, items: [], shipping: [{ subtotal: 18.52, tax: 0 }] });
  close(r.shippingEx, 18.52); close(r.total, 18.52); close(r.returnsEx, 0);
  // Prices excluding VAT: subtotal is already ex VAT, tax comes on top.
  r = refundAmounts({ taxesIncluded: false, items: [{ quantity: 2, subtotal: 20, tax: 4 }], shipping: [{ subtotal: 5, tax: 1 }] });
  close(r.returnsEx, 20); close(r.shippingEx, 5); close(r.tax, 5); close(r.total, 30);
});

test("traffic and discount-code aggregation", async () => {
  const { aggCodes, aggSources, totals } = await import("../lib/aggregate");
  const a = { ...row("2026-10-09", 100), sessions: 1000, conversion: 0.01, sources: [{ source: "social", sessions: 800 }, { source: "direct", sessions: 200 }], discount_codes: [{ code: "HELLO", orders: 2, discount: 5 }] };
  const b = { ...row("2026-10-10", 100), sessions: 3000, conversion: 0.03, sources: [{ source: "social", sessions: 2000 }, { source: "search", sessions: 1000 }], discount_codes: [{ code: "HELLO", orders: 1, discount: 2.5 }, { code: "VIP", orders: 5, discount: 9 }] };
  const t = totals([a, b]);
  assert.equal(t.sessions, 4000);
  assert.ok(Math.abs(t.conversion - 0.025) < 1e-12); // (10 + 90) / 4000, not the plain average 0.02
  assert.deepEqual(aggSources([a, b]).map((s) => [s.source, s.sessions]), [["social", 2800], ["search", 1000], ["direct", 200]]);
  assert.deepEqual(aggCodes([a, b]).map((c) => [c.code, c.orders, c.discount]), [["VIP", 5, 9], ["HELLO", 3, 7.5]]);
});
