import ExcelJS from "exceljs";
import type { Row } from "./data";
import { time12 } from "./format";
import { TZ } from "./timezone";

export const STORE_NAME = "Love Boo Store";
const TEAL = "FF006D68", MEADOW = "FFE6F4F3";
const fill = (argb: string): ExcelJS.Fill => ({ type: "pattern", pattern: "solid", fgColor: { argb } });
const round = (n: number) => Math.round(n * 100) / 100;
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);

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
  const tidy = (r: (string | number)[]) => r.map((v) => (typeof v === "number" ? round(v) : v));
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

/** The daily report workbook: "Daily Report" (summary + orders) and "Location Sales" (cities, with a by-country summary). */
export async function buildWorkbook(row: Row) {
  const tz = TZ;
  const money = `[$${row.currency === "GBP" ? "£" : row.currency + " "}]#,##0.00`;
  const wb = new ExcelJS.Workbook();

  const at = new Date(`${row.date}T12:00:00Z`);
  const long = `${at.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}, ${at.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`;
  const simple = wb.addWorksheet("Daily Report");
  simple.addRow([`${STORE_NAME} — ${long}`]).font = { bold: true, size: 14 };
  const kv: [string, number, string][] = [["Orders", row.orders, "0"], ["Units sold", row.units, "0"], ["Total sales", row.total_sales, money], ["Discounts given", row.discounts, money]];
  for (const [label, value, fmt] of kv) {
    const r = simple.addRow([label, round(value)]);
    r.getCell(2).numFmt = fmt; r.getCell(2).alignment = { horizontal: "right" };
    r.getCell(1).font = { bold: label === "Total sales" }; r.getCell(2).font = { bold: label === "Total sales" };
  }
  simple.addRow([]);
  const head = simple.addRow(["Order", "Time", "Amount", "Discount"]);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = fill(TEAL);
  row.order_list.forEach((o) => {
    const r = simple.addRow([o.name, time12(o.time, tz), o.total ?? o.amount, o.discount]);
    r.getCell(3).numFmt = money; r.getCell(4).numFmt = money;
  });
  for (let n = head.number; n <= simple.rowCount; n++) [2, 3, 4].forEach((c) => (simple.getRow(n).getCell(c).alignment = { horizontal: "right" }));
  simple.columns = [{ width: 22 }, { width: 14 }, { width: 14 }, { width: 14 }];

  const byCountry = new Map<string, { orders: number; units: number; net: number }>();
  for (const l of row.locations) {
    const c = byCountry.get(l.country) ?? { orders: 0, units: 0, net: 0 };
    c.orders += l.orders; c.units += l.units; c.net += l.net;
    byCountry.set(l.country, c);
  }
  const countries = [...byCountry.entries()].map(([country, v]) => ({ country, ...v })).sort((a, b) => b.net - a.net);

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
