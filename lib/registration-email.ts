import { Resend } from "resend";
import { adminClient } from "./supabase";
import { firstName } from "./names";

const C = { teal: "#006D68", linen: "#f1f3f5", ink: "#212529", mute: "#868e96", line: "#e9ecef" };
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export const REPLY_TO = process.env.REGISTRATION_REPLY_TO || "hello@loveboo.com";
const FROM = () => process.env.REGISTRATION_FROM || "Love Boo <registration@mail.loveboo.com>";
const MAX_ATTEMPTS = 5;

export type Guest = { first_name: string; email: string; prize: string | null };
export type EventInfo = { name: string; collection_text: string } | null;

/** "Thanks for registering" plus what they won, or "thanks for playing" when there was no prize. */
export function buildRegistrationEmail(guest: Guest, event: EventInfo, appUrl = process.env.APP_URL ?? "") {
  const name = firstName(guest.email, guest.first_name);
  const where = event?.name ?? "the Love Boo booth";
  const won = guest.prize?.trim() || null;
  const collect = event?.collection_text?.trim() || "Show this email at the Love Boo booth to collect your gift.";

  const subject = won ? `You won ${won} at Love Boo!` : "Thanks for visiting Love Boo!";
  const lead = `Thank you for registering with Love Boo at ${where}.`;
  const result = won ? `Congratulations! You won: ${won}` : "Thanks for playing. We loved meeting you!";

  const logo = appUrl.startsWith("https") ? `<img src="${esc(appUrl)}/logo.png" width="112" alt="Love Boo" style="display:block;border:0">` : "Love Boo";
  const html = `<!doctype html><html><body style="margin:0;background:${C.linen};font-family:${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td style="padding:0 4px 14px;font-size:20px;font-weight:700;color:${C.teal}">${logo}</td></tr>
<tr><td style="background:#ffffff;border-radius:16px;padding:28px 28px 24px">
  <div style="font-size:16px;color:${C.ink}">Hello ${esc(name)},</div>
  <div style="margin:6px 0 20px;font-size:15px;line-height:1.5;color:${C.mute}">${esc(lead)}</div>
  <div style="font-size:22px;font-weight:700;line-height:1.3;color:${won ? C.teal : C.ink}">${esc(result)}</div>
  ${won ? `<div style="margin-top:20px;padding:16px;border-radius:12px;background:${C.linen};font-size:15px;line-height:1.5;color:${C.ink}"><strong>How to collect</strong><br>${esc(collect).replace(/\n/g, "<br>")}</div>` : ""}
</td></tr>
<tr><td style="padding:14px 4px;font-size:12px;line-height:1.5;color:${C.mute}">This is an automated message. Questions? Write to <a href="mailto:${REPLY_TO}" style="color:${C.teal}">${REPLY_TO}</a>.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [`Hello ${name},`, "", lead, "", result, ...(won ? ["", "How to collect:", collect] : []), "", `This is an automated message. Questions? Write to ${REPLY_TO}.`].join("\n");
  return { subject, html, text };
}

/** Sends the email through Resend. Returns the Resend id. */
export async function sendRegistrationEmail(to: string, guest: Guest, event: EventInfo) {
  const { subject, html, text } = buildRegistrationEmail(guest, event);
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM(), to, replyTo: REPLY_TO, subject, html, text });
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

/**
 * Emails one stored registration. Safe to call from the webhook and the retry sweep at the same time:
 * the row is claimed first, so only one caller sends. Never throws; the outcome is saved on the row.
 */
export async function emailRegistration(id: number) {
  const db = adminClient();
  const stale = new Date(Date.now() - 5 * 60e3).toISOString();
  const { data: claimed } = await db.from("event_registrations")
    .update({ email_status: "sending", updated_at: new Date().toISOString() })
    .eq("id", id).or(`email_status.in.(pending,failed),and(email_status.eq.sending,updated_at.lt.${stale})`)
    .select("*, events(name, collection_text, email_enabled)").maybeSingle();
  if (!claimed) return "already handled";

  const event = (claimed.events as { name: string; collection_text: string; email_enabled: boolean } | null) ?? null;
  const done = async (patch: Record<string, unknown>) =>
    db.from("event_registrations").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);

  if (event && !event.email_enabled) { await done({ email_status: "skipped" }); return "skipped"; }
  try {
    const resendId = await sendRegistrationEmail(claimed.email, claimed, event);
    await done({ email_status: "sent", emailed_at: new Date().toISOString(), resend_id: resendId, email_error: null, email_attempts: claimed.email_attempts + 1 });
    return "sent";
  } catch (e) {
    await done({ email_status: "failed", email_error: (e instanceof Error ? e.message : String(e)).slice(0, 300), email_attempts: claimed.email_attempts + 1 });
    return "failed";
  }
}

/** Retries registrations whose email is still pending or failed (missed webhook, Resend hiccup). */
export async function retryPendingRegistrationEmails() {
  const db = adminClient();
  const { data } = await db.from("event_registrations").select("id")
    .in("email_status", ["pending", "failed", "sending"]).lt("email_attempts", MAX_ATTEMPTS)
    .lt("created_at", new Date(Date.now() - 2 * 60e3).toISOString()).order("id").limit(50);
  const results: string[] = [];
  for (const r of data ?? []) results.push(await emailRegistration(r.id));
  return { tried: results.length, sent: results.filter((r) => r === "sent").length };
}
