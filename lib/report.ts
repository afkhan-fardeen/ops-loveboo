import { Resend } from "resend";
import { buildEmail } from "./email";
import { buildWorkbook, workbookName } from "./excel";
import { adminClient } from "./supabase";
import { fetchDay } from "./shopify";
import { rowsUpTo, summarise } from "./data";
import { getSettings } from "./settings";

const resend = () => new Resend(process.env.RESEND_API_KEY);

type Msg = { subject: string; html?: string; text: string; attachments?: { filename: string; content: Buffer }[] };

/** One email per recipient, so a single rejected address can't block everyone else. */
export async function deliver(to: string[], msg: Msg) {
  const client = resend();
  const results = await Promise.all(to.map(async (address) => {
    try {
      const { error } = await client.emails.send({ from: process.env.REPORT_FROM!, to: address, ...msg });
      return error ? { address, error: error.message } : { address, error: null };
    } catch (e) {
      return { address, error: e instanceof Error ? e.message : String(e) };
    }
  }));
  return { sent: results.filter((r) => !r.error).map((r) => r.address), failed: results.filter((r) => r.error) as { address: string; error: string }[] };
}

/** fetch → upsert → email. Safe to re-run: upsert by date, no duplicate email once emailed_at is set. */
export async function run(date: string, opts: { resend?: boolean; email?: boolean } = {}) {
  const db = adminClient();
  const day = await fetchDay(date);
  const { error } = await db.from("daily_sales").upsert({ date, ...day }, { onConflict: "date" });
  if (error) throw error;
  if (opts.email === false) return { date, emailed: false, reason: "backfill" };

  const cfg = await getSettings();
  if (!cfg.emailEnabled) return { date, emailed: false, reason: "email turned off in settings" };
  if (!cfg.recipients.length) return { date, emailed: false, reason: "no recipients" };

  const s = summarise(await rowsUpTo(date, 60))!;
  if (s.row.emailed_at && !opts.resend) return { date, emailed: false, reason: "already emailed" };

  const { subject, html, text } = buildEmail(s, process.env.APP_URL ?? "");
  const attachments = cfg.attachExcel ? [{ filename: workbookName(date), content: await buildWorkbook(s.row) }] : undefined;
  const r = await deliver(cfg.recipients, { subject, html, text, attachments });
  if (!r.sent.length) throw new Error(`Email failed for everyone. ${r.failed.map((f) => `${f.address}: ${f.error}`).join(" | ")}`);
  await db.from("daily_sales").update({ emailed_at: new Date().toISOString() }).eq("date", date);
  return { date, emailed: true, sent: r.sent, failed: r.failed };
}

export async function sendFailure(err: unknown) {
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  const to = admins.length ? admins : (await getSettings()).recipients.slice(0, 1);
  if (!to.length) return;
  await deliver(to, { subject: "Love Boo · Daily report FAILED", text: `The daily report job failed:\n\n${err instanceof Error ? err.message : String(err)}` });
}

/** Test email with the latest (or given) day. Returns who it reached and who rejected it. */
export async function sendTest(to: string | string[], date?: string) {
  const s = summarise(await rowsUpTo(date, 60));
  if (!s) throw new Error("No data yet");
  const { subject, html, text } = buildEmail(s, process.env.APP_URL ?? "");
  const attachments = [{ filename: workbookName(s.row.date), content: await buildWorkbook(s.row) }];
  return deliver(Array.isArray(to) ? to : [to], { subject: `[Test] ${subject}`, html, text, attachments });
}
