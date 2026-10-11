import ExcelJS from "exceljs";
import type { Row } from "./data";
import { aggLocations, aggProducts, byCountry } from "./aggregate";
import { time12 } from "./format";

const TEAL = "FF006D68", MEADOW = "FFE6F4F3";
const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });

/** Header styling, widths, frozen header, and a highlighted Total row (the sheet's current last row). */
function finish(ws: ExcelJS.Worksheet, widths: number[], numericFrom: number) {
  ws.columns.forEach((c, i) => (c.width = widths[i]));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = fill(TEAL);
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const total = ws.lastRow!;
  total.font = { bold: true };
  total.fill = fill(MEADOW);
  ws.eachRow((r) => r.eachCell((c) => { if (Number(c.col) >= numericFrom) c.alignment = { horizontal: "right" }; }));
}

/** A summary table under the main data: blank line, header, rows, and a bold total. Columns >= 2 are right-aligned. */
function summary(ws: ExcelJS.Worksheet, headers: (string | number)[], rows: (string | number)[][], total: (string | number)[], fmt: Record<number, string>) {
  ws.addRow([]);
  const h = ws.addRow(headers);
  h.font = { bold: true, color: { argb: "FFFFFFFF" } };
  h.fill = fill(TEAL);
  const body = [...rows, total];
  body.forEach((values, i) => {
    const r = ws.addRow(values);
    if (i === body.length - 1) { r.font = { bold: true }; r.fill = fill(MEADOW); }
  });
  for (let n = h.number; n <= ws.rowCount; n++)
    ws.getRow(n).eachCell({ includeEmpty: true }, (c) => {
      if (Number(c.col) >= 2) c.alignment = { horizontal: "right" };
      if (n > h.number && fmt[Number(c.col)]) c.numFmt = fmt[Number(c.col)];
    });
}

const moneyFmt = (currency: string) => `[$${currency === "GBP" ? "£" : currency + " "}]#,##0.00`;
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

/** One report day: orders with totals, then a by-country summary; plus a Location Sales sheet. */
export async function buildWorkbook(row: Row) {
  const tz = process.env.STORE_TIMEZONE ?? "Europe/London";
  const money = moneyFmt(row.currency);
  const wb = new ExcelJS.Workbook();
  const countries = byCountry(row.locations);

  const sales = wb.addWorksheet("Daily Sales");
  sales.addRow(["Order", "Time", "Units", "Amount", "Discount"]);
  row.order_list.forEach((o) => sales.addRow([o.name, time12(o.time, tz), o.units ?? 0, o.amount, o.discount]));
  const e = row.order_list.length + 1;
  sales.addRow([`Total (${row.order_list.length} orders)`, "",
    { formula: `SUM(C2:C${e})`, result: sum(row.order_list, (o) => o.units ?? 0) },
    { formula: `SUM(D2:D${e})`, result: sum(row.order_list, (o) => o.amount) },
    { formula: `SUM(E2:E${e})`, result: sum(row.order_list, (o) => o.discount) }]);
  [4, 5].forEach((c) => (sales.getColumn(c).numFmt = money));
  finish(sales, [30, 12, 10, 16, 16], 3);
  summary(sales, ["Summary by location", "Orders", "Units", "Net sales"],
    countries.map((c) => [c.country, c.orders, c.units, c.net]),
    ["Total", sum(countries, (c) => c.orders), sum(countries, (c) => c.units), sum(countries, (c) => c.net)], { 4: money });

  const loc = wb.addWorksheet("Location Sales");
  loc.addRow(["Country", "City", "Orders", "Units", "Net sales", "% of total"]);
  const total = sum(row.locations, (l) => l.net);
  row.locations.forEach((l, i) => loc.addRow([l.country, l.city, l.orders, l.units, l.net,
    { formula: `IF(E$${row.locations.length + 2}=0,0,E${i + 2}/E$${row.locations.length + 2})`, result: total ? l.net / total : 0 }]));
  const le = row.locations.length + 1;
  loc.addRow(["Total", "",
    { formula: `SUM(C2:C${le})`, result: sum(row.locations, (l) => l.orders) },
    { formula: `SUM(D2:D${le})`, result: sum(row.locations, (l) => l.units) },
    { formula: `SUM(E2:E${le})`, result: total },
    { formula: `SUM(F2:F${le})`, result: total ? 1 : 0 }]);
  loc.getColumn(5).numFmt = money;
  loc.getColumn(6).numFmt = "0.0%";
  finish(loc, [22, 24, 10, 10, 16, 12], 3);
  summary(loc, ["Summary by country", "", "Orders", "Units", "Net sales", "% of total"],
    countries.map((c) => [c.country, "", c.orders, c.units, c.net, total ? c.net / total : 0]),
    ["Total", "", sum(countries, (c) => c.orders), sum(countries, (c) => c.units), total, total ? 1 : 0], { 5: money, 6: "0.0%" });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const workbookName = (date: string) => `loveboo-sales-${date}.xlsx`;

/** A period: daily totals with a by-country summary, products, and locations. `rows` may be in any order. */
export async function buildRangeWorkbook(rows: Row[]) {
  const days = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const cur = days[0]?.currency ?? "GBP";
  const money = moneyFmt(cur);
  const wb = new ExcelJS.Workbook();
  const locs = aggLocations(days), lTotal = sum(locs, (x) => x.net);
  const countries = byCountry(locs);

  const d = wb.addWorksheet("Daily Sales");
  d.addRow(["Date", "Net sales", "Orders", "Units", "AOV", "Discounts"]);
  days.forEach((r, i) => d.addRow([new Date(`${r.date}T00:00:00Z`), r.net_sales, r.orders, r.units, { formula: `IF(C${i + 2}=0,0,B${i + 2}/C${i + 2})`, result: r.orders ? r.net_sales / r.orders : 0 }, r.discounts]));
  const last = days.length + 1, t = last + 1;
  d.addRow(["Total", { formula: `SUM(B2:B${last})`, result: sum(days, (r) => r.net_sales) }, { formula: `SUM(C2:C${last})`, result: sum(days, (r) => r.orders) }, { formula: `SUM(D2:D${last})`, result: sum(days, (r) => r.units) },
    { formula: `IF(C${t}=0,0,B${t}/C${t})`, result: sum(days, (r) => r.orders) ? sum(days, (r) => r.net_sales) / sum(days, (r) => r.orders) : 0 }, { formula: `SUM(F2:F${last})`, result: sum(days, (r) => r.discounts) }]);
  d.getColumn(1).numFmt = "ddd d mmm yyyy";
  [2, 5, 6].forEach((c) => (d.getColumn(c).numFmt = money));
  finish(d, [22, 16, 10, 10, 14, 14], 2);
  summary(d, ["Summary by location", "Net sales", "Orders", "Units"],
    countries.map((c) => [c.country, c.net, c.orders, c.units]),
    ["Total", sum(countries, (c) => c.net), sum(countries, (c) => c.orders), sum(countries, (c) => c.units)], { 2: money });

  const prods = aggProducts(days), pTotal = sum(prods, (p) => p.net);
  const p = wb.addWorksheet("Products");
  p.addRow(["Product", "Units", "Net sales", "% of listed"]);
  prods.forEach((x, i) => p.addRow([x.name, x.units, x.net, { formula: `IF(C$${prods.length + 2}=0,0,C${i + 2}/C$${prods.length + 2})`, result: pTotal ? x.net / pTotal : 0 }]));
  p.addRow(["Total (top products per day)", { formula: `SUM(B2:B${prods.length + 1})`, result: sum(prods, (x) => x.units) }, { formula: `SUM(C2:C${prods.length + 1})`, result: pTotal }, { formula: `SUM(D2:D${prods.length + 1})`, result: pTotal ? 1 : 0 }]);
  p.getColumn(3).numFmt = money; p.getColumn(4).numFmt = "0.0%";
  finish(p, [44, 10, 16, 12], 2);

  const l = wb.addWorksheet("Location Sales");
  l.addRow(["Country", "City", "Orders", "Units", "Net sales", "% of total"]);
  locs.forEach((x, i) => l.addRow([x.country, x.city, x.orders, x.units, x.net, { formula: `IF(E$${locs.length + 2}=0,0,E${i + 2}/E$${locs.length + 2})`, result: lTotal ? x.net / lTotal : 0 }]));
  const le = locs.length + 1;
  l.addRow(["Total", "", { formula: `SUM(C2:C${le})`, result: sum(locs, (x) => x.orders) }, { formula: `SUM(D2:D${le})`, result: sum(locs, (x) => x.units) }, { formula: `SUM(E2:E${le})`, result: lTotal }, { formula: `SUM(F2:F${le})`, result: lTotal ? 1 : 0 }]);
  l.getColumn(5).numFmt = money; l.getColumn(6).numFmt = "0.0%";
  finish(l, [22, 24, 10, 10, 16, 12], 3);
  summary(l, ["Summary by country", "", "Orders", "Units", "Net sales", "% of total"],
    countries.map((c) => [c.country, "", c.orders, c.units, c.net, lTotal ? c.net / lTotal : 0]),
    ["Total", "", sum(countries, (c) => c.orders), sum(countries, (c) => c.units), lTotal, lTotal ? 1 : 0], { 5: money, 6: "0.0%" });

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const rangeName = (from: string, to: string) => `loveboo-sales-${from}_to_${to}.xlsx`;
