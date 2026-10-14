import { revalidateTag } from "next/cache";
import { adminClient } from "./supabase";
import { yesterdayIn } from "./format";
import { run } from "./report";
import { isDue, SEND_TZ } from "./schedule";
import { activeRecipients, getSettings } from "./settings";

export type ScheduledResult = { outcome: "loaded" | "emailed" | "skipped"; detail: string; date: string };

/**
 * One scheduler check. Called every ~15 minutes by the scheduler, once a day by Vercel Cron, or by an admin from the health screen.
 * 1) Stores yesterday's report as soon as it exists, whatever the email settings are.
 * 2) Emails it once, after the admin's send time.
 */
export async function runScheduled(): Promise<ScheduledResult> {
  const tz = process.env.STORE_TIMEZONE ?? "Europe/London";
  const date = yesterdayIn(tz);

  const { data } = await adminClient().from("daily_sales").select("emailed_at").eq("date", date).maybeSingle();
  let loaded = false;
  if (!data) {
    await run(date, { email: false });
    revalidateTag("sales");
    loaded = true;
  }

  const cfg = await getSettings();
  const done = (outcome: ScheduledResult["outcome"], detail: string): ScheduledResult => ({ outcome: loaded && outcome === "skipped" ? "loaded" : outcome, detail: `${loaded ? "Stored the report. " : ""}${detail}`.trim(), date });

  if (!cfg.emailEnabled) return done("skipped", "Daily email is switched off.");
  if (!activeRecipients(cfg).length) return done("skipped", "No active recipients.");
  if (!isDue(cfg.sendTime)) return done("skipped", `Email not due yet (send time ${cfg.sendTime} ${SEND_TZ.split("/")[1]}).`);
  if (data?.emailed_at) return done("skipped", "Already emailed.");

  const result = await run(date); // re-fetches Shopify first, so the email carries the latest numbers
  revalidateTag("sales");
  if (!("emailed" in result) || !result.emailed) return done("skipped", `Not sent: ${"reason" in result ? result.reason : "unknown"}.`);
  const failed = result.failed?.length ? ` ${result.failed.length} failed.` : "";
  return { outcome: "emailed", detail: `Emailed ${result.sent?.length ?? 0} recipient(s).${failed}`, date };
}
