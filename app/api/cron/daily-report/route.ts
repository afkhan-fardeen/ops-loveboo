import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { addDays, yesterdayIn } from "@/lib/format";
import { run, sendFailure } from "@/lib/report";
import { isDue, SEND_TZ } from "@/lib/schedule";
import { activeRecipients, getSettings, touchScheduler } from "@/lib/settings";

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
  if (!authorised(req)) return new NextResponse("Unauthorised", { status: 401 });

  const url = new URL(req.url);
  const tz = process.env.STORE_TIMEZONE ?? "Europe/London";
  const end = yesterdayIn(tz);

  try {
    // Manual modes. ?backfill=60 loads the last N days without emails; ?date=…&resend=1 re-runs a specific day.
    const backfill = Number(url.searchParams.get("backfill") ?? 0);
    if (backfill > 0 || url.searchParams.has("date")) {
      if (backfill > 0) {
        const { fetchRefunds } = await import("@/lib/shopify");
        const { dayRange } = await import("@/lib/format");
        const refunds = await fetchRefunds(dayRange(addDays(end, -backfill), tz).from);
        for (let i = backfill; i >= 1; i--) await run(addDays(end, -i), { email: false, refunds }).catch(() => null);
      }
      const result = await run(url.searchParams.get("date") ?? end, { resend: url.searchParams.has("resend") });
      revalidateTag("sales");
      return NextResponse.json(result);
    }

    // Scheduled mode (called every ~15 minutes, or once a day by Vercel Cron): send yesterday's report once the admin's send time has passed.
    await touchScheduler();
    const cfg = await getSettings();
    if (!cfg.emailEnabled) return NextResponse.json({ skipped: "daily email is switched off" });
    if (!activeRecipients(cfg).length) return NextResponse.json({ skipped: "no active recipients" });
    if (!isDue(cfg.sendTime)) return NextResponse.json({ skipped: "not due yet", sendTime: cfg.sendTime, tz: SEND_TZ });

    const { data } = await adminClient().from("daily_sales").select("emailed_at").eq("date", end).maybeSingle();
    if (data?.emailed_at) return NextResponse.json({ skipped: "already sent", date: end });

    const result = await run(end);
    revalidateTag("sales");
    return NextResponse.json(result);
  } catch (e) {
    // At most one failure alert per day, even though the scheduler retries every 15 minutes.
    const { data } = await adminClient().from("settings").select("value").eq("key", "last_alert").maybeSingle();
    if ((data?.value as { date?: string } | null)?.date !== end) {
      await sendFailure(e).catch(() => null);
      await adminClient().from("settings").upsert({ key: "last_alert", value: { date: end } });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
