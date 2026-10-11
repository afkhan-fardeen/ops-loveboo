import ExcelJS from "exceljs";
import type { Row } from "./data";
import { aggLocations, aggProducts, byCountry } from "./aggregate";
import { time12 } from "./format";

export const STORE_NAME = "Love Boo Store";

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
  const tidy = (r: (string | number)[]) => r.map((v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v));
  const body = [...rows, total].map(tidy);
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
const round = (n: number) => Math.round(n * 100) / 100;

/** One report day. Sheet 1 is the simple report; "Breakdown" has gross/net/shipping/VAT per order and the by-country summary; plus Location Sales. */
export async function buildWorkbook(row: Row) {
  const tz = process.env.STORE_TIMEZONE ?? "Europe/London";
  const money = moneyFmt(row.currency);
  const wb = new ExcelJS.Workbook();
  const countries = byCountry(row.locations);

  const orders = row.order_list;

  // Sheet 1: the simple daily report. Amount = what the customer paid (matches the order in Shopify).
  const at = new Date(`${row.date}T12:00:00Z`);
  const long = `${at.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}, ${at.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`;
  const simple = wb.addWorksheet("Daily Report");
  simple.addRow([`${STORE_NAME} — ${long}`]).font = { bold: true, size: 14 };
  const kv: [string, number, string?][] = [["Orders", row.orders, "0"], ["Units sold", row.units, "0"], ["Total sales", row.total_sales, money], ["Discounts given", row.discounts, money]];
  for (const [label, value, fmt] of kv) {
    const r = simple.addRow([label, round(value)]);
    r.getCell(2).numFmt = fmt!; r.getCell(2).alignment = { horizontal: "right" };
    r.getCell(1).font = { bold: label === "Total sales" }; r.getCell(2).font = { bold: label === "Total sales" };
  }
  simple.addRow([]);
  const head = simple.addRow(["Order", "Time", "Amount", "Discount"]);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = fill(TEAL);
  orders.forEach((o) => {
    const r = simple.addRow([o.name, time12(o.time, tz), o.total ?? o.amount, o.discount]);
    r.getCell(3).numFmt = money; r.getCell(4).numFmt = money;
  });
  for (let n = head.number; n <= simple.rowCount; n++) [2, 3, 4].forEach((c) => (simple.getRow(n).getCell(c).alignment = { horizontal: "right" }));
  simple.columns = [{ width: 22 }, { width: 14 }, { width: 14 }, { width: 14 }];

  const sales = wb.addWorksheet("Breakdown");
  sales.addRow(["Order", "Time", "Country", "Units", "Gross", "Discount", "Net sales", "Shipping", "VAT", "Total paid", "Discount code"]);
  orders.forEach((o) => sales.addRow([
    o.name, time12(o.time, tz), o.country ?? "", o.units ?? 0,
    o.gross ?? o.amount + o.discount, o.discount, o.amount, o.shipping ?? 0, o.tax ?? 0, o.total ?? o.amount, (o.codes ?? []).join(", "),
  ]));
  const e = orders.length + 1;
  const col = (f: (o: Row["order_list"][number]) => number) => sum(orders, f);
  const colSum = (letter: string, result: number) => ({ formula: `SUM(${letter}2:${letter}${e})`, result });
  sales.addRow([`Total (${orders.length} orders)`, "", "", colSum("D", col((o) => o.units ?? 0)),
    colSum("E", col((o) => o.gross ?? o.amount + o.discount)), colSum("F", col((o) => o.discount)), colSum("G", col((o) => o.amount)),
    colSum("H", col((o) => o.shipping ?? 0)), colSum("I", col((o) => o.tax ?? 0)), colSum("J", col((o) => o.total ?? o.amount)), ""]);
  [5, 6, 7, 8, 9, 10].forEach((c) => (sales.getColumn(c).numFmt = money));
  finish(sales, [30, 12, 20, 8, 12, 12, 13, 12, 12, 13, 18], 4);
  sales.getColumn(11).alignment = { horizontal: "left" };

  // Reconciles to Shopify's Sales report: gross − discounts − returns = net; net + shipping + VAT = total.
  summary(sales, ["Sales summary", "Amount"],
    [["Gross sales", row.gross_sales], ["Discounts", -row.discounts], ["Returns", -row.returns], ["Net sales", row.net_sales], ["Shipping", row.shipping], ["VAT", row.taxes]],
    ["Total sales", row.total_sales], { 2: money });

  // By country, from the orders when they carry a country (newer data), else from the stored locations.
  const hasCountry = orders.length > 0 && orders.every((o) => o.country);
  const byC = new Map<string, { orders: number; units: number; net: number; shipping: number; total: number }>();
  if (hasCountry) {
    for (const o of orders) {
      const x = byC.get(o.country!) ?? { orders: 0, units: 0, net: 0, shipping: 0, total: 0 };
      x.orders++; x.units += o.units ?? 0; x.net += o.amount; x.shipping += o.shipping ?? 0; x.total += o.total ?? o.amount;
      byC.set(o.country!, x);
    }
  } else {
    for (const c of countries) byC.set(c.country, { orders: c.orders, units: c.units, net: c.net, shipping: 0, total: c.net });
  }
  const cRows = [...byC.entries()].sort((a, b) => b[1].net - a[1].net).map(([k, v]) => [k, v.orders, v.units, round(v.net), round(v.shipping), round(v.total)]);
  summary(sales, ["Summary by location", "Orders", "Units", "Net sales", "Shipping", "Total paid"], cRows,
    ["Total", sum(cRows, (r) => r[1] as number), sum(cRows, (r) => r[2] as number), round(sum(cRows, (r) => r[3] as number)), round(sum(cRows, (r) => r[4] as number)), round(sum(cRows, (r) => r[5] as number))],
    { 4: money, 5: money, 6: money });

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
  d.addRow(["Date", "Gross", "Discounts", "Returns", "Net sales", "Shipping", "VAT", "Total sales", "Orders", "Units", "AOV (net)"]);
  days.forEach((r, i) => d.addRow([new Date(`${r.date}T00:00:00Z`), r.gross_sales, r.discounts, r.returns, r.net_sales, r.shipping, r.taxes, r.total_sales, r.orders, r.units,
    { formula: `IF(I${i + 2}=0,0,E${i + 2}/I${i + 2})`, result: r.orders ? r.net_sales / r.orders : 0 }]));
  const last = days.length + 1, t = last + 1;
  const tot = (f: (r: Row) => number) => sum(days, f);
  const S = (letter: string, result: number) => ({ formula: `SUM(${letter}2:${letter}${last})`, result });
  d.addRow(["Total", S("B", tot((r) => r.gross_sales)), S("C", tot((r) => r.discounts)), S("D", tot((r) => r.returns)), S("E", tot((r) => r.net_sales)),
    S("F", tot((r) => r.shipping)), S("G", tot((r) => r.taxes)), S("H", tot((r) => r.total_sales)), S("I", tot((r) => r.orders)), S("J", tot((r) => r.units)),
    { formula: `IF(I${t}=0,0,E${t}/I${t})`, result: tot((r) => r.orders) ? tot((r) => r.net_sales) / tot((r) => r.orders) : 0 }]);
  d.getColumn(1).numFmt = "ddd d mmm yyyy";
  [2, 3, 4, 5, 6, 7, 8, 11].forEach((c) => (d.getColumn(c).numFmt = money));
  finish(d, [22, 12, 12, 11, 13, 12, 12, 13, 9, 9, 12], 2);
  summary(d, ["Sales summary", "Amount"],
    [["Gross sales", tot((r) => r.gross_sales)], ["Discounts", -tot((r) => r.discounts)], ["Returns", -tot((r) => r.returns)], ["Net sales", tot((r) => r.net_sales)], ["Shipping", tot((r) => r.shipping)], ["VAT", tot((r) => r.taxes)]],
    ["Total sales", tot((r) => r.total_sales)], { 2: money });
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
