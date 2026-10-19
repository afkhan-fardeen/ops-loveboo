import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { addDays, yesterdayIn } from "@/lib/format";
import { run, sendFailure } from "@/lib/report";
import { logRun, sourceFrom } from "@/lib/jobs";
import { runScheduled } from "@/lib/scheduled";
import { retryPendingRegistrationEmails } from "@/lib/registration-email";
import { TZ } from "@/lib/timezone";

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

  const t0 = Date.now();
  const source = sourceFrom(req.headers.get("user-agent"));
  const url = new URL(req.url);
  const tz = TZ;
  const end = yesterdayIn(tz);

  try {
    // Manual modes. ?backfill=60 loads the last N days without emails; ?date=…&resend=1 re-runs a specific day.
    const backfill = Number(url.searchParams.get("backfill") ?? 0);
    if (backfill > 0) {
      // Backfill only loads data, including yesterday. It never sends email.
      const { fetchRefunds } = await import("@/lib/shopify");
      const { dayRange } = await import("@/lib/format");
      const refunds = await fetchRefunds(dayRange(addDays(end, -backfill), tz).from);
      for (let i = backfill; i >= 0; i--) await run(addDays(end, -i), { email: false, refunds }).catch(() => null);
      revalidateTag("sales");
      await logRun({ source, outcome: "manual", detail: `Loaded ${backfill + 1} days up to ${end} (no email).`, report_date: end, ms: Date.now() - t0 });
      return NextResponse.json({ backfilled: backfill + 1, through: end });
    }
    if (url.searchParams.has("date")) {
      const result = await run(url.searchParams.get("date")!, { resend: url.searchParams.has("resend") });
      revalidateTag("sales");
      await logRun({ source, outcome: "manual", detail: `Ran ${url.searchParams.get("date")}${url.searchParams.has("resend") ? " and re-sent" : ""}.`, report_date: url.searchParams.get("date"), ms: Date.now() - t0 });
      return NextResponse.json(result);
    }

    // Scheduled mode (every ~15 minutes, or once a day by Vercel Cron): see lib/scheduled.ts.
    const r = await runScheduled();
    const guests = await retryPendingRegistrationEmails().catch(() => null); // guest emails the webhook missed or that failed
    const retried = guests?.tried ? ` Retried ${guests.tried} guest email(s), ${guests.sent} sent.` : "";
    await logRun({ source, outcome: r.outcome, detail: r.detail + retried, report_date: r.date, ms: Date.now() - t0 });
    return NextResponse.json(r);
  } catch (e) {
    // At most one failure alert per day, even though the scheduler retries every 15 minutes.
    const { data } = await adminClient().from("settings").select("value").eq("key", "last_alert").maybeSingle();
    if ((data?.value as { date?: string } | null)?.date !== end) {
      await sendFailure(e).catch(() => null);
      await adminClient().from("settings").upsert({ key: "last_alert", value: { date: end } });
    }
    await logRun({ source, outcome: "error", detail: e instanceof Error ? e.message : String(e), report_date: end, ms: Date.now() - t0 });
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
