import ExcelJS from "exceljs";
import type { Row } from "./data";
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
