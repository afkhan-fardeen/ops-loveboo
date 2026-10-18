import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dayRange } from "../lib/format";
import { lineAmounts, refundAmounts } from "../lib/lines";
import { norm, type Row } from "../lib/data";

const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} !== ${b}`);

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
});

test("dayRange uses Bahrain time (GMT+3, no daylight saving)", () => {
  assert.deepEqual(dayRange("2026-10-10", "Asia/Bahrain"), { from: "2026-10-09T21:00:00.000Z", to: "2026-10-10T21:00:00.000Z" });
  // A Bahrain day is 24 hours all year, including the days other regions change their clocks.
  for (const day of ["2026-03-29", "2026-10-25", "2026-07-01"]) {
    const d = dayRange(day, "Asia/Bahrain");
    assert.equal((Date.parse(d.to) - Date.parse(d.from)) / 3.6e6, 24);
  }
  // An order processed 00:03 Bahrain time belongs to the new day, not the one before.
  const nextDay = dayRange("2026-10-13", "Asia/Bahrain");
  assert.ok("2026-10-12T21:03:00.000Z" >= nextDay.from && "2026-10-12T21:03:00.000Z" < nextDay.to);
});

test("lineAmounts: discount, VAT and returns", () => {
  let r = lineAmounts({ quantity: 1, currentQuantity: 1, original: 12, allocated: 0, vat: 0 });
  close(r.net, 12); close(r.discount, 0); close(r.returned, 0);
  r = lineAmounts({ quantity: 1, currentQuantity: 1, original: 12, allocated: 2, vat: 0 });
  close(r.net, 10); close(r.discount, 2);
  // VAT-inclusive: £12 with £2 discount and £1.67 VAT inside -> net 8.33; discount ex VAT = 2 x (8.33 / 10)
  r = lineAmounts({ quantity: 1, currentQuantity: 1, original: 12, allocated: 2, vat: 1.67 });
  close(r.net, 8.33); close(r.discount, 2 * (8.33 / 10));
  r = lineAmounts({ quantity: 2, currentQuantity: 1, original: 20, allocated: 0, vat: 0 }); // 2 bought, 1 left
  close(r.net, 10); close(r.returned, 10);
  r = lineAmounts({ quantity: 1, currentQuantity: 1, original: 5, allocated: 5, vat: 0 }); // fully discounted
  close(r.net, 0); close(r.discount, 5);
});

test("refundAmounts matches Shopify's Sales report for real refunds", () => {
  // LB2778: one item returned, £7.29 incl. £1.22 VAT. Shopify showed sales reversals of -£6.07 that day.
  let r = refundAmounts({ taxesIncluded: true, items: [{ quantity: 1, subtotal: 7.29, tax: 1.22 }], shipping: [] });
  close(r.returnsEx, 6.07); close(r.tax, 1.22); close(r.total, 7.29); close(r.shippingEx, 0); assert.equal(r.units, 1);
  // LB2866: shipping-only refund of £18.52. Shopify showed shipping -£18.52 on 7 Oct.
  r = refundAmounts({ taxesIncluded: true, items: [], shipping: [{ subtotal: 18.52, tax: 0 }] });
  close(r.shippingEx, 18.52); close(r.total, 18.52); close(r.returnsEx, 0);
  // Prices excluding VAT: subtotal is already ex VAT, tax comes on top.
  r = refundAmounts({ taxesIncluded: false, items: [{ quantity: 2, subtotal: 20, tax: 4 }], shipping: [{ subtotal: 5, tax: 1 }] });
  close(r.returnsEx, 20); close(r.shippingEx, 5); close(r.tax, 5); close(r.total, 30);
});

test("norm converts numeric columns and fills missing fields", () => {
  const stored = { date: "2026-10-10", net_sales: "82.86", orders: 6, units: 9, currency: "GBP", emailed_at: null } as unknown as Row;
  const r = norm(stored);
  assert.equal(r.net_sales, 82.86);
  assert.equal(r.total_sales, 0);
  assert.deepEqual(r.order_list, []);
  assert.deepEqual(r.locations, []);
});
