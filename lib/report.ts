import { Resend } from "resend";
import { buildEmail } from "./email";
import { buildWorkbook, workbookName } from "./excel";
import { adminClient } from "./supabase";
import { fetchDay, type RefundEvent } from "./shopify";
import { fetchRow } from "./data";
import { activeRecipients, getSettings, type Recipient } from "./settings";
import { firstName } from "./names";

const resend = () => new Resend(process.env.RESEND_API_KEY);

type Msg = { subject: string; html?: string; text: string; attachments?: { filename: string; content: Buffer }[] };
type Failure = { address: string; error: string };

/** Greeting first names: the name saved on the recipient, else their portal account name, else derived from the email. */
async function namesFor(recipients: Recipient[]) {
  const { data } = await adminClient().from("profiles").select("email,name").in("email", recipients.map((r) => r.email));
  const account = new Map((data ?? []).map((p: { email: string; name: string | null }) => [p.email.toLowerCase(), p.name]));
  return new Map(recipients.map((r) => [r.email, firstName(r.email, r.name || account.get(r.email))]));
}

/** One email per recipient, so a single rejected address can't block everyone else. */
async function deliver(to: string[], build: Msg | ((address: string) => Msg)) {
  const client = resend();
  const results = await Promise.all(to.map(async (address) => {
    try {
      const msg = typeof build === "function" ? build(address) : build;
      const { error } = await client.emails.send({ from: process.env.REPORT_FROM!, to: address, ...msg });
      return error ? { address, error: error.message } : { address, error: null };
    } catch (e) {
      return { address, error: e instanceof Error ? e.message : String(e) };
    }
  }));
  return { sent: results.filter((r) => !r.error).map((r) => r.address), failed: results.filter((r) => r.error) as Failure[] };
}

/** Builds the day's email (with the Excel if enabled) for each person and sends it. */
async function emailDay(date: string, people: Recipient[], attachExcel: boolean) {
  const row = (await fetchRow(date))!;
  const attachments = attachExcel ? [{ filename: workbookName(date), content: await buildWorkbook(row) }] : undefined;
  const names = await namesFor(people);
  return deliver(people.map((p) => p.email), (addr) => ({ ...buildEmail(row, process.env.APP_URL ?? "", names.get(addr)), attachments }));
}

/** The scheduled job: fetch from Shopify, store, then email the recipients once. Safe to re-run: no duplicate once emailed_at is set. */
export async function run(date: string, opts: { resend?: boolean; email?: boolean; refunds?: RefundEvent[] } = {}) {
  const db = adminClient();
  const { error } = await db.from("daily_sales").upsert({ date, ...(await fetchDay(date, { refunds: opts.refunds })) }, { onConflict: "date" });
  if (error) throw error;
  if (opts.email === false) return { date, emailed: false, reason: "backfill" };

  const cfg = await getSettings();
  if (!cfg.emailEnabled) return { date, emailed: false, reason: "email turned off in settings" };
  const people = activeRecipients(cfg);
  if (!people.length) return { date, emailed: false, reason: "no active recipients" };
  if ((await fetchRow(date))?.emailed_at && !opts.resend) return { date, emailed: false, reason: "already emailed" };

  const r = await emailDay(date, people, cfg.attachExcel);
  if (!r.sent.length) throw new Error(`Email failed for everyone. ${r.failed.map((f) => `${f.address}: ${f.error}`).join(" | ")}`);
  await db.from("daily_sales").update({ emailed_at: new Date().toISOString() }).eq("date", date);
  return { date, emailed: true, sent: r.sent, failed: r.failed };
}

/**
 * "Send email now": refresh the day from Shopify, then email it on the spot.
 * With no `to`, it goes to the current recipients (and marks the day as emailed, so the scheduler won't repeat it).
 * With `to`, it goes only to those addresses and does not mark the day as emailed.
 */
export async function sendDay(date: string, to?: string[]) {
  const db = adminClient();
  const { error } = await db.from("daily_sales").upsert({ date, ...(await fetchDay(date)) }, { onConflict: "date" });
  if (error) throw error;

  const cfg = await getSettings();
  const people: Recipient[] = to ? to.map((email) => ({ name: "", email, active: true })) : activeRecipients(cfg);
  if (!people.length) return { sent: [] as string[], failed: [] as Failure[], none: true };

  const r = await emailDay(date, people, cfg.attachExcel);
  if (!to && r.sent.length) await db.from("daily_sales").update({ emailed_at: new Date().toISOString() }).eq("date", date);
  return { ...r, none: false };
}

export async function sendFailure(err: unknown) {
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  const to = admins.length ? admins : activeRecipients(await getSettings()).slice(0, 1).map((r) => r.email);
  if (!to.length) return;
  await deliver(to, { subject: "Love Boo · Daily report FAILED", text: `The daily report job failed:\n\n${err instanceof Error ? err.message : String(err)}` });
}
