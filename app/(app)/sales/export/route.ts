import { NextRequest } from "next/server";
import { requireModule } from "@/lib/auth";
import { rowsBetween, rowsUpTo } from "@/lib/data";
import { buildRangeWorkbook, buildWorkbook, rangeName, workbookName } from "@/lib/excel";

export const dynamic = "force-dynamic";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function GET(req: NextRequest) {
  await requireModule("sales");
  const q = req.nextUrl.searchParams;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const from = q.get("from"), to = q.get("to");
  if (from && to) {
    if (!iso.test(from) || !iso.test(to) || from > to) return new Response("Bad range", { status: 400 });
    const rows = (await rowsBetween(from, to));
    if (!rows.length) return new Response("No data", { status: 404 });
    return new Response(new Uint8Array(await buildRangeWorkbook(rows)), {
      headers: { "Content-Type": XLSX, "Content-Disposition": `attachment; filename="${rangeName(from, to)}"` },
    });
  }
  const date = q.get("date") ?? undefined;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Bad date", { status: 400 });
  const row = (await rowsUpTo(date, 1))[0];
  if (!row || (date && row.date !== date)) return new Response("No data", { status: 404 });
  return new Response(new Uint8Array(await buildWorkbook(row)), {
    headers: {
      "Content-Type": XLSX,
      "Content-Disposition": `attachment; filename="${workbookName(row.date)}"`,
    },
  });
}
