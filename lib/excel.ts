import ExcelJS from "exceljs";
import type { Location, Row } from "./data";
import { timeIn } from "./format";

const TEAL = "FF006D68", MEADOW = "FFE3EABA";

function style(ws: ExcelJS.Worksheet, widths: number[], numericFrom: number) {
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

/** rows: newest-first stored rows; the workbook covers the month of `date`. */
export async function buildWorkbook(rows: Row[], date: string) {
  const month = rows.filter((r) => r.date.startsWith(date.slice(0, 7))).sort((a, b) => a.date.localeCompare(b.date));
  const cur = month[0]?.currency ?? "GBP";
  const money = `[$${cur === "GBP" ? "£" : cur + " "}]#,##0.00`;
  const wb = new ExcelJS.Workbook();

  const daily = wb.addWorksheet("Daily Sales");
  daily.addRow(["Date", "Net sales", "Orders", "Units", "AOV", "Discounts"]);
  month.forEach((r, i) => daily.addRow([new Date(`${r.date}T00:00:00Z`), r.net_sales, r.orders, r.units, { formula: `IF(C${i + 2}=0,0,B${i + 2}/C${i + 2})`, result: r.orders ? r.net_sales / r.orders : 0 }, r.discounts]));
  const sum = (f: (r: Row) => number) => month.reduce((a, r) => a + f(r), 0);
  const last = month.length + 1, t = last + 1;
  daily.addRow(["Total", { formula: `SUM(B2:B${last})`, result: sum((r) => r.net_sales) }, { formula: `SUM(C2:C${last})`, result: sum((r) => r.orders) }, { formula: `SUM(D2:D${last})`, result: sum((r) => r.units) }, { formula: `IF(C${t}=0,0,B${t}/C${t})`, result: sum((r) => r.orders) ? sum((r) => r.net_sales) / sum((r) => r.orders) : 0 }, { formula: `SUM(F2:F${last})`, result: sum((r) => r.discounts) }]);
  daily.getColumn(1).numFmt = "ddd d mmm yyyy";
  [2, 5, 6].forEach((c) => (daily.getColumn(c).numFmt = money));
  style(daily, [18, 16, 10, 10, 14, 14], 2);

  const agg = new Map<string, Location & { yday: number }>();
  for (const r of month) for (const l of r.locations) {
    const k = `${l.country}|${l.city}`;
    const a = agg.get(k) ?? { ...l, orders: 0, units: 0, net: 0, yday: 0 };
    a.orders += l.orders; a.units += l.units; a.net += l.net;
    if (r.date === date) a.yday += l.net;
    agg.set(k, a);
  }
  const places = [...agg.values()].sort((a, b) => b.net - a.net);
  const loc = wb.addWorksheet("Location Sales");
  loc.addRow(["Country", "City", "Orders", "Units", "Net sales (MTD)", "Net sales (yesterday)", "% of MTD"]);
  const tot = (f: (p: (typeof places)[number]) => number) => places.reduce((a, p) => a + f(p), 0);
  const totNet = tot((p) => p.net);
  places.forEach((p, i) => loc.addRow([p.country, p.city, p.orders, p.units, p.net, p.yday, { formula: `IF(E$${places.length + 2}=0,0,E${i + 2}/E$${places.length + 2})`, result: totNet ? p.net / totNet : 0 }]));
  const e = places.length + 1;
  loc.addRow(["Total", "", { formula: `SUM(C2:C${e})`, result: tot((p) => p.orders) }, { formula: `SUM(D2:D${e})`, result: tot((p) => p.units) }, { formula: `SUM(E2:E${e})`, result: totNet }, { formula: `SUM(F2:F${e})`, result: tot((p) => p.yday) }, { formula: `SUM(G2:G${e})`, result: totNet ? 1 : 0 }]);
  [5, 6].forEach((c) => (loc.getColumn(c).numFmt = money));
  loc.getColumn(7).numFmt = "0.0%";
  style(loc, [18, 20, 10, 10, 18, 22, 11], 3);

  const ord = wb.addWorksheet("Orders");
  ord.addRow(["Date", "Order", "Time", "Amount", "Discount"]);
  [...month].reverse().forEach((r) => r.order_list.forEach((o) =>
    ord.addRow([new Date(`${r.date}T00:00:00Z`), o.name, timeIn(o.time, process.env.STORE_TIMEZONE ?? "Europe/London"), o.amount, o.discount])));
  ord.getColumn(1).numFmt = "ddd d mmm yyyy";
  [4, 5].forEach((c) => (ord.getColumn(c).numFmt = money));
  ord.columns.forEach((c, i) => (c.width = [18, 16, 10, 14, 14][i]));
  ord.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ord.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
  ord.views = [{ state: "frozen", ySplit: 1 }];

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const workbookName = (date: string) => `loveboo-sales-${date}.xlsx`;
