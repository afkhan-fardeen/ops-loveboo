import { NextRequest } from "next/server";
import { requireModule } from "@/lib/auth";
import { rowsUpTo } from "@/lib/data";
import { buildWorkbook, workbookName } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireModule("sales");
  const date = req.nextUrl.searchParams.get("date") ?? undefined;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Bad date", { status: 400 });
  const rows = await rowsUpTo(date, 60);
  if (!rows.length) return new Response("No data", { status: 404 });
  return new Response(new Uint8Array(await buildWorkbook(rows, rows[0].date)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${workbookName(rows[0].date)}"`,
    },
  });
}
