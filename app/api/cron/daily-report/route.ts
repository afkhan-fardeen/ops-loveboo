import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { addDays, yesterdayIn } from "@/lib/format";
import { run, sendFailure } from "@/lib/report";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Constant-time check of "Authorization: Bearer <CRON_SECRET>". */
function authorised(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const a = Buffer.from(req.headers.get("authorization") ?? ""), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!authorised(req)) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  // ?backfill=60 loops the last N days through the same function (no emails)
  const backfill = Number(url.searchParams.get("backfill") ?? 0);
  try {
    const end = yesterdayIn(process.env.STORE_TIMEZONE ?? "Europe/London");
    if (backfill > 0) {
      for (let i = backfill; i >= 1; i--) await run(addDays(end, -i), { email: false }).catch(() => null);
    }
    const result = await run(url.searchParams.get("date") ?? end, { resend: url.searchParams.has("resend") });
    revalidateTag("sales");
    return NextResponse.json(result);
  } catch (e) {
    await sendFailure(e).catch(() => null);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
