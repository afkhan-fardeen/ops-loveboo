"use server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendDay } from "@/lib/report";
import { logRun } from "@/lib/jobs";
import { missingDays } from "@/lib/missing";
import { run } from "@/lib/report";
import { requireModule } from "@/lib/auth";
import { isEmail } from "@/lib/settings";

export type Result = { ok: boolean; message: string };
const fail = (message: string): Result => ({ ok: false, message });

/**
 * Send one day's report now. mode "recipients" goes to the current recipients;
 * mode "custom" goes only to the addresses typed in (people who aren't recipients).
 */
export async function sendDayEmail(form: FormData): Promise<Result> {
  await requireAdmin();
  const date = String(form.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail("That date isn’t valid.");
  if (!process.env.RESEND_API_KEY) return fail("Email isn’t configured: RESEND_API_KEY is missing.");

  let to: string[] | undefined;
  if (form.get("mode") === "custom") {
    to = [...new Set(String(form.get("to") ?? "").split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
    if (!to.length) return fail("Enter at least one email address.");
    const bad = to.find((e) => !isEmail(e));
    if (bad) return fail(`“${bad}” isn’t a valid email address.`);
    if (to.length > 10) return fail("You can send to up to 10 addresses at a time.");
  }

  let r;
  try { r = await sendDay(date, to); revalidateTag("sales"); } catch (e) { return fail(e instanceof Error ? e.message : "Couldn’t send the report."); }
  if (r.none) return fail("There are no active recipients. Add one in Email settings, or choose Someone else.");
  if (!r.failed.length) return { ok: true, message: `Sent to ${r.sent.join(", ")}.` };
  const why = r.failed.map((f) => `${f.address}: ${f.error}`).join(" · ");
  return fail(`${r.sent.length ? `Sent to ${r.sent.join(", ")}. ` : ""}Failed: ${why}`);
}

let loading: Promise<Result> | null = null;

/**
 * Stores any days since the last report (up to 7) when someone opens Daily Sales, so yesterday's report is
 * ready whenever it is looked at, without waiting for a scheduler. Loads data only; it never sends email.
 */
export async function loadMissingDays(): Promise<Result> {
  await requireModule("reports");
  // Several people opening the page at once share one load.
  loading ??= (async (): Promise<Result> => {
    const t0 = Date.now();
    try {
      const days = await missingDays();
      for (const d of days) await run(d, { email: false });
      if (days.length) {
        revalidateTag("sales");
        await logRun({ source: "manual", outcome: "loaded", detail: `Opened the page and loaded ${days.length} missing day(s): ${days.join(", ")}.`, report_date: days[days.length - 1], ms: Date.now() - t0 });
      }
      return { ok: true, message: days.length ? `Loaded ${days.length} day(s).` : "Already up to date." };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "Couldn’t load the report." };
    }
  })().finally(() => { loading = null; });
  return loading;
}
