import { NextRequest } from "next/server";
import { requireModule } from "@/lib/auth";
import { rowsUpTo } from "@/lib/data";
import { buildWorkbook, workbookName } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  await requireModule("sales");
  const date = req.nextUrl.searchParams.get("date") ?? undefined;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Bad date", { status: 400 });
  const row = (await rowsUpTo(date, 1))[0];
  if (!row || (date && row.date !== date)) return new Response("No data", { status: 404 });
  return new Response(new Uint8Array(await buildWorkbook(row)), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${workbookName(row.date)}"`,
    },
  });
}
