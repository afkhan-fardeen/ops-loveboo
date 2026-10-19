import { Resend } from "resend";
import { adminClient } from "./supabase";
import { firstName } from "./names";

const C = { cream: "#FBF9F1", teal: "#006D68", deep: "#005151", ink: "#23312F", mute: "#5F6B69", yellow: "#FBD872", line: "#EAE5D6" };
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const font = "'Helvetica Neue',Helvetica,Arial,sans-serif";

export const REPLY_TO = process.env.REGISTRATION_REPLY_TO || "hello@loveboo.com";
const FROM = () => process.env.REGISTRATION_FROM || "Love Boo <registration@mail.loveboo.com>";
const MAX_ATTEMPTS = 5;
const LOGO = "https://loveboo.com/cdn/shop/files/Group_240724.png?v=1757584837&width=320";
const SITE = "https://loveboo.com";

export type Guest = { first_name: string; email: string; prize: string | null; prize_image_url?: string | null };
export type EventInfo = { name: string; collection_text: string } | null;

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" bgcolor="${C.teal}" style="border-radius:999px"><a href="${esc(href)}" style="display:inline-block;padding:14px 30px;font:700 16px ${font};color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;

/**
 * "Thanks for registering" plus what they won (with its picture), or "thanks for playing" when there was no prize.
 * Single column, fluid up to 600px, tables only and inline styles, so it holds up in phone mail apps.
 */
export function buildRegistrationEmail(guest: Guest, event: EventInfo) {
  const name = firstName(guest.email, guest.first_name);
  const where = event?.name ?? "the Love Boo booth";
  const won = guest.prize?.trim() || null;
  const image = won && guest.prize_image_url?.startsWith("https://") ? guest.prize_image_url : null;
  const collect = event?.collection_text?.trim() || "Show this email at the Love Boo booth to collect your gift.";
  const year = new Date().getFullYear();

  const subject = won ? `You won ${won} at Love Boo!` : "Thanks for visiting Love Boo!";
  const preheader = won ? `Congratulations ${name}! Here’s how to collect your gift.` : `It was lovely meeting you at ${where}.`;
  const heading = won ? `Congratulations, ${name}!` : `Thanks for playing, ${name}!`;
  const intro = won
    ? `Thank you for registering with Love Boo at ${where}. You spun the wheel and won:`
    : `Thank you for registering with Love Boo at ${where}. No prize this time, but we loved meeting you.`;

  const prizeBlock = won ? `
  <tr><td align="center" style="padding:6px 24px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};border-radius:20px"><tr><td align="center" style="padding:24px 16px">
      ${image ? `<img src="${esc(image)}" alt="${esc(won)}" width="240" style="display:block;width:240px;max-width:100%;height:auto;border:0;margin:0 auto 14px">` : ""}
      <div style="font:700 22px/1.25 ${font};color:${C.deep}">${esc(won)}</div>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:20px 24px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:16px"><tr><td style="padding:18px 20px">
      <div style="font:700 13px ${font};letter-spacing:.08em;text-transform:uppercase;color:${C.teal}">How to collect</div>
      <div style="margin-top:6px;font:400 16px/1.55 ${font};color:${C.ink}">${esc(collect).replace(/\n/g, "<br>")}</div>
    </td></tr></table>
  </td></tr>` : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">

  <tr><td align="center" bgcolor="${C.cream}" style="padding:28px 24px 22px">
    <a href="${SITE}"><img src="${LOGO}" alt="Love Boo" width="132" style="display:block;width:132px;height:auto;border:0"></a>
  </td></tr>

  <tr><td bgcolor="#ffffff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding:32px 24px 8px">
      ${won ? `<span style="display:inline-block;background:${C.yellow};color:${C.deep};font:700 12px ${font};letter-spacing:.1em;text-transform:uppercase;padding:6px 14px;border-radius:999px">You won</span>` : ""}
      <div style="margin-top:${won ? 14 : 0}px;font:700 28px/1.2 ${font};color:${C.deep}">${esc(heading)}</div>
      <div style="margin-top:12px;font:400 16px/1.55 ${font};color:${C.mute}">${esc(intro)}</div>
    </td></tr>
    ${prizeBlock}
    <tr><td align="center" style="padding:28px 24px 36px">${button(SITE, "Visit loveboo.com")}</td></tr>
  </table></td></tr>

  <tr><td bgcolor="${C.deep}" align="center" style="padding:28px 24px 32px">
    <div style="font:700 18px ${font};color:#ffffff">Love Boo</div>
    <div style="margin-top:10px;font:400 14px/1.6 ${font};color:#ffffff">Questions? Write to <a href="mailto:${REPLY_TO}" style="color:#ffffff;font-weight:700">${REPLY_TO}</a></div>
    <div style="margin-top:14px;font:400 12px/1.6 ${font};color:#ffffff;opacity:.85">You’re receiving this because you registered with Love Boo at ${esc(where)}.<br>This is an automated message.<br>© ${year} Love Boo · <a href="${SITE}" style="color:#ffffff">loveboo.com</a></div>
  </td></tr>

</table></td></tr></table>
</body></html>`;

  const text = [`Hello ${name},`, "", intro, ...(won ? [`  ${won}`, "", "How to collect:", collect] : []), "", `Visit us: ${SITE}`, "", `Questions? Write to ${REPLY_TO}.`, `You're receiving this because you registered with Love Boo at ${where}. This is an automated message.`].join("\n");
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
