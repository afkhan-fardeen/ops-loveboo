import ExcelJS from "exceljs";
import type { Row } from "./data";
import { aggLocations, aggProducts } from "./aggregate";
import { timeIn } from "./format";

const TEAL = "FF006D68", MEADOW = "FFE6F4F3";

function finish(ws: ExcelJS.Worksheet, widths: number[], numericFrom: number) {
  ws.columns.forEach((c, i) => (c.width = widths[i]));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
  ws.views = [{ state: "frozen", ySplit: 1 }];
  const total = ws.lastRow!;
  total.font = { bold: true };
  total.fill = { type: "pattern", pattern: "solid", fgColor: { argb: MEADOW } };
  ws.eachRow((r) => r.eachCell((c) => { if (Number(c.col) >= numericFrom) c.alignment = { horizontal: "right" }; }));
}

/** One report day: orders with totals, and sales by location. */
export async function buildWorkbook(row: Row) {
  const tz = process.env.STORE_TIMEZONE ?? "Europe/London";
  const money = `[$${row.currency === "GBP" ? "£" : row.currency + " "}]#,##0.00`;
  const wb = new ExcelJS.Workbook();

  const sales = wb.addWorksheet("Daily Sales");
  sales.addRow(["Order", "Time", "Units", "Amount", "Discount"]);
  row.order_list.forEach((o) => sales.addRow([o.name, timeIn(o.time, tz), o.units ?? 0, o.amount, o.discount]));
  const e = row.order_list.length + 1;
  const sum = (f: (o: Row["order_list"][number]) => number) => row.order_list.reduce((a, o) => a + f(o), 0);
  sales.addRow([`Total (${row.order_list.length} orders)`, "",
    { formula: `SUM(C2:C${e})`, result: sum((o) => o.units ?? 0) },
    { formula: `SUM(D2:D${e})`, result: sum((o) => o.amount) },
    { formula: `SUM(E2:E${e})`, result: sum((o) => o.discount) }]);
  [4, 5].forEach((c) => (sales.getColumn(c).numFmt = money));
  finish(sales, [26, 10, 10, 16, 16], 3);

  const loc = wb.addWorksheet("Location Sales");
  loc.addRow(["Country", "City", "Orders", "Units", "Net sales", "% of total"]);
  const total = row.locations.reduce((a, l) => a + l.net, 0);
  row.locations.forEach((l, i) => loc.addRow([l.country, l.city, l.orders, l.units, l.net,
    { formula: `IF(E$${row.locations.length + 2}=0,0,E${i + 2}/E$${row.locations.length + 2})`, result: total ? l.net / total : 0 }]));
  const le = row.locations.length + 1;
  loc.addRow(["Total", "",
    { formula: `SUM(C2:C${le})`, result: row.locations.reduce((a, l) => a + l.orders, 0) },
    { formula: `SUM(D2:D${le})`, result: row.locations.reduce((a, l) => a + l.units, 0) },
    { formula: `SUM(E2:E${le})`, result: total },
    { formula: `SUM(F2:F${le})`, result: total ? 1 : 0 }]);
  loc.getColumn(5).numFmt = money;
  loc.getColumn(6).numFmt = "0.0%";
  finish(loc, [20, 22, 10, 10, 16, 12], 3);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const workbookName = (date: string) => `loveboo-sales-${date}.xlsx`;

/** A period: daily totals, products and locations. `rows` may be in any order. */
export async function buildRangeWorkbook(rows: Row[]) {
  const days = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const cur = days[0]?.currency ?? "GBP";
  const money = `[$${cur === "GBP" ? "£" : cur + " "}]#,##0.00`;
  const wb = new ExcelJS.Workbook();
  const sum = (f: (r: Row) => number) => days.reduce((a, r) => a + f(r), 0);

  const d = wb.addWorksheet("Daily Sales");
  d.addRow(["Date", "Net sales", "Orders", "Units", "AOV", "Discounts"]);
  days.forEach((r, i) => d.addRow([new Date(`${r.date}T00:00:00Z`), r.net_sales, r.orders, r.units, { formula: `IF(C${i + 2}=0,0,B${i + 2}/C${i + 2})`, result: r.orders ? r.net_sales / r.orders : 0 }, r.discounts]));
  const last = days.length + 1, t = last + 1;
  d.addRow(["Total", { formula: `SUM(B2:B${last})`, result: sum((r) => r.net_sales) }, { formula: `SUM(C2:C${last})`, result: sum((r) => r.orders) }, { formula: `SUM(D2:D${last})`, result: sum((r) => r.units) },
    { formula: `IF(C${t}=0,0,B${t}/C${t})`, result: sum((r) => r.orders) ? sum((r) => r.net_sales) / sum((r) => r.orders) : 0 }, { formula: `SUM(F2:F${last})`, result: sum((r) => r.discounts) }]);
  d.getColumn(1).numFmt = "ddd d mmm yyyy";
  [2, 5, 6].forEach((c) => (d.getColumn(c).numFmt = money));
  finish(d, [18, 16, 10, 10, 14, 14], 2);

  const prods = aggProducts(days), pTotal = prods.reduce((a, p) => a + p.net, 0);
  const p = wb.addWorksheet("Products");
  p.addRow(["Product", "Units", "Net sales", "% of listed"]);
  prods.forEach((x, i) => p.addRow([x.name, x.units, x.net, { formula: `IF(C$${prods.length + 2}=0,0,C${i + 2}/C$${prods.length + 2})`, result: pTotal ? x.net / pTotal : 0 }]));
  p.addRow(["Total (top products per day)", { formula: `SUM(B2:B${prods.length + 1})`, result: prods.reduce((a, x) => a + x.units, 0) }, { formula: `SUM(C2:C${prods.length + 1})`, result: pTotal }, { formula: `SUM(D2:D${prods.length + 1})`, result: pTotal ? 1 : 0 }]);
  p.getColumn(3).numFmt = money; p.getColumn(4).numFmt = "0.0%";
  finish(p, [44, 10, 16, 12], 2);

  const locs = aggLocations(days), lTotal = locs.reduce((a, l) => a + l.net, 0);
  const l = wb.addWorksheet("Location Sales");
  l.addRow(["Country", "City", "Orders", "Units", "Net sales", "% of total"]);
  locs.forEach((x, i) => l.addRow([x.country, x.city, x.orders, x.units, x.net, { formula: `IF(E$${locs.length + 2}=0,0,E${i + 2}/E$${locs.length + 2})`, result: lTotal ? x.net / lTotal : 0 }]));
  const le = locs.length + 1;
  l.addRow(["Total", "", { formula: `SUM(C2:C${le})`, result: locs.reduce((a, x) => a + x.orders, 0) }, { formula: `SUM(D2:D${le})`, result: locs.reduce((a, x) => a + x.units, 0) }, { formula: `SUM(E2:E${le})`, result: lTotal }, { formula: `SUM(F2:F${le})`, result: lTotal ? 1 : 0 }]);
  l.getColumn(5).numFmt = money; l.getColumn(6).numFmt = "0.0%";
  finish(l, [20, 22, 10, 10, 16, 12], 3);

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const rangeName = (from: string, to: string) => `loveboo-sales-${from}_to_${to}.xlsx`;
