import assert from "node:assert/strict";
import { test } from "node:test";
import { addDays, dayRange, pct, pctChange } from "../lib/format";
import { summarise, type Row } from "../lib/data";

const row = (date: string, net: number, orders = 1): Row => ({
  date, net_sales: net, discounts: 0, orders, units: orders, currency: "GBP", emailed_at: null, top_products: [], locations: [], order_list: [],
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
