import { Resend } from "resend";
import { buildEmail } from "./email";
import { adminClient } from "./supabase";
import { fetchDay } from "./shopify";
import { rowsUpTo, summarise } from "./data";

const resend = () => new Resend(process.env.RESEND_API_KEY);
const recipients = () => (process.env.REPORT_RECIPIENTS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

/** fetch → upsert → email. Safe to re-run: upsert by date, no duplicate email once emailed_at is set. */
export async function run(date: string, opts: { resend?: boolean; email?: boolean } = {}) {
  const db = adminClient();
  const day = await fetchDay(date);
  const { error } = await db.from("daily_sales").upsert({ date, ...day }, { onConflict: "date" });
  if (error) throw error;

  if (opts.email === false) return { date, emailed: false, reason: "backfill" };

  const rows = await rowsUpTo(date, 60);
  const s = summarise(rows)!;
  if (s.row.emailed_at && !opts.resend) return { date, emailed: false, reason: "already emailed" };

  const { subject, html, text } = buildEmail(s, process.env.APP_URL ?? "");
  const { error: mailErr } = await resend().emails.send({ from: process.env.REPORT_FROM!, to: recipients(), subject, html, text });
  if (mailErr) throw new Error(mailErr.message);
  await db.from("daily_sales").update({ emailed_at: new Date().toISOString() }).eq("date", date);
  return { date, emailed: true };
}

export async function sendFailure(err: unknown) {
  await resend().emails.send({
    from: process.env.REPORT_FROM!, to: recipients().slice(0, 1),
    subject: "Love Boo · Daily report FAILED", text: `The daily report job failed:\n\n${err instanceof Error ? err.message : String(err)}`,
  });
}

export async function sendTest(to: string) {
  const s = summarise(await rowsUpTo(undefined, 40));
  if (!s) throw new Error("No data yet");
  const { subject, html, text } = buildEmail(s, process.env.APP_URL ?? "");
  const { error } = await resend().emails.send({ from: process.env.REPORT_FROM!, to, subject: `[Test] ${subject}`, html, text });
  if (error) throw new Error(error.message);
}
