import { Resend } from "resend";
import { adminClient } from "./supabase";
import { firstName } from "./names";

const C = { cream: "#FBF9F1", teal: "#006D68", deep: "#005151", ink: "#23312F", mute: "#5F6B69", yellow: "#FBD872", line: "#EAE5D6" };
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const font = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const serif = "Georgia,'Times New Roman',serif";

export const REPLY_TO = process.env.REGISTRATION_REPLY_TO || "hello@loveboo.com";
const FROM = () => process.env.REGISTRATION_FROM || "Love Boo <registration@mail.loveboo.com>";
const MAX_ATTEMPTS = 5;
const LOGO = "https://ops.loveboo.com/logo.png";
const SITE = "https://loveboo.com";

export type Guest = { first_name: string; email: string; prize: string | null; prize_image_url?: string | null; source?: string | null; registered_at?: string | null };
export type EventInfo = { name: string; collection_text: string } | null;

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" bgcolor="${C.teal}" style="border-radius:999px"><a href="${esc(href)}" style="display:inline-block;padding:12px 26px;font:700 14px ${font};color:#ffffff;text-decoration:none;border-radius:999px">${esc(label)}</a></td></tr></table>`;


/** The email shell shared by every guest email: cream header with the logo, white body, dark-teal footer. */
function frame(o: { subject: string; preheader: string; where: string; logo: { src: string; alt: string; width: number; height: number }; body: string }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>${esc(o.subject)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px">${esc(o.preheader)}${"&nbsp;&zwnj;".repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background:${C.cream}"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">

  <tr><td align="center" bgcolor="${C.cream}" style="padding:22px 20px 18px">
    <a href="${SITE}" style="text-decoration:none"><img src="${o.logo.src}" alt="${esc(o.logo.alt)}" width="${o.logo.width}" height="${o.logo.height}" style="display:block;margin:0 auto;width:${o.logo.width}px;height:auto;border:0;font:700 20px ${font};color:${C.teal}"></a>
  </td></tr>

  <tr><td bgcolor="#ffffff" style="background:#ffffff"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${o.body}
  </table></td></tr>

  <tr><td bgcolor="${C.deep}" align="center" style="background:${C.deep};padding:22px 20px 26px">
    <div style="font:400 12px/1.6 ${font};color:#ffffff">Questions? Write to <a href="mailto:${REPLY_TO}" style="color:#ffffff;font-weight:700">${REPLY_TO}</a></div>
    <div style="margin-top:10px;font:400 11px/1.6 ${font};color:#ffffff">You’re receiving this because you registered at ${esc(o.where)}.<br>This is an automated message.<br><a href="${SITE}" style="color:#ffffff">loveboo.com</a></div>
  </td></tr>

</table></td></tr></table>
</body></html>`;
}

/**
 * "Thanks for registering" plus what they won (with its picture), or "thanks for playing" when there was no prize.
 * Single column, fluid up to 600px, tables only and inline styles, explicit image sizes and styled alt text,
 * so it holds up in phone apps, desktop clients and when remote images are blocked.
 */
export function buildRegistrationEmail(guest: Guest, event: EventInfo) {
  const name = firstName(guest.email, guest.first_name);
  const where = event?.name ?? "the Love Boo booth";
  const won = guest.prize?.trim() || null;
  const image = won && guest.prize_image_url?.startsWith("https://") ? guest.prize_image_url : null;
  const collect = event?.collection_text?.trim() || "Show this email at the Love Boo booth to collect your gift.";

  const subject = won ? `${name}, you won ${won}` : `Thanks for stopping by, ${name}`;
  const preheader = won ? `Here’s how to collect your gift from ${where}.` : `It was lovely meeting you at ${where}.`;
  const heading = won ? `Congratulations, ${name}!` : `Thanks for playing, ${name}!`;
  const intro = won
    ? `Thank you for registering at ${where}. You spun the wheel and won:`
    : `Thank you for registering at ${where}. No prize this time, but we loved meeting you.`;
  const altStyle = `font:700 15px ${font};color:${C.deep}`;

  const prizeBlock = won ? `
  <tr><td align="center" style="padding:6px 20px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background:${C.cream};border-radius:18px"><tr><td align="center" style="padding:22px 16px">
      ${image ? `<img src="${esc(image)}" alt="${esc(won)}" width="200" style="display:block;width:200px;max-width:100%;height:auto;border:0;margin:0 auto 12px;${altStyle}">` : ""}
      <div style="font:400 18px/1.3 ${serif};color:${C.deep}">${esc(won)}</div>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:16px 20px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${C.line};border-radius:14px"><tr><td style="padding:16px 18px">
      <div style="font:700 11px ${font};letter-spacing:.09em;text-transform:uppercase;color:${C.teal}">How to collect</div>
      <div style="margin-top:6px;font:400 14px/1.55 ${font};color:${C.ink}">${esc(collect).replace(/\n/g, "<br>")}</div>
    </td></tr></table>
  </td></tr>` : "";

  const body = `    <tr><td align="center" style="padding:28px 20px 8px">
      ${won ? `<span style="display:inline-block;background:${C.yellow};color:${C.deep};font:700 11px ${font};letter-spacing:.1em;text-transform:uppercase;padding:5px 12px;border-radius:999px">You won</span>` : ""}
      <div style="margin-top:${won ? 12 : 0}px;font:400 24px/1.25 ${serif};color:${C.deep};letter-spacing:.2px">${esc(heading)}</div>
      <div style="margin-top:10px;font:400 14px/1.55 ${font};color:${C.mute}">${esc(intro)}</div>
    </td></tr>
    ${prizeBlock}
    <tr><td align="center" style="padding:24px 20px 32px">${button(SITE, "Visit loveboo.com")}</td></tr>`;
  const html = frame({ subject, preheader, where, logo: { src: LOGO, alt: "Love Boo", width: 92, height: 29 }, body });

  const text = [`${heading}`, "", intro, ...(won ? [`  ${won}`, "", "How to collect:", collect] : []), "", `Visit us: ${SITE}`, "", `Questions? Write to ${REPLY_TO}.`, `You're receiving this because you registered at ${where}. This is an automated message.`].join("\n");
  return { subject, html, text };
}


export const DISCOUNT_CODE = "EXPO2026";
const EXPO_LOGO = "https://ops.loveboo.com/expo-lockup.png";

/** Guests who signed up through the QR code page (their source ends in "_qr") get a discount code, not a prize. */
export const isQrSignup = (source?: string | null) => /_qr$/.test(source ?? "");

/** "Here's your code" email for QR sign-ups: a thank-you, the code in a box, one button. */
export function buildDiscountEmail(guest: Guest, event: EventInfo) {
  const where = event?.name ?? "Baby & Kids Expo Dubai";
  const subject = "Your Love Boo discount code";
  const preheader = "Use it at checkout on loveboo.com within 2 weeks.";
  const intro = "Here’s your discount code. Use it at checkout on loveboo.com within 2 weeks.";

  const body = `    <tr><td align="center" style="padding:28px 20px 8px">
      <div style="font:400 24px/1.25 ${serif};color:${C.deep};letter-spacing:.2px">Thank you for signing up!</div>
      <div style="margin-top:10px;font:400 14px/1.55 ${font};color:${C.mute}">${esc(intro)}</div>
    </td></tr>
    <tr><td align="center" style="padding:20px 20px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background:${C.cream};border:2px dashed ${C.teal};border-radius:18px"><tr><td align="center" style="padding:18px 16px">
        <div style="font:700 22px/1.2 ${font};letter-spacing:.1em;color:${C.teal}">${esc(DISCOUNT_CODE)}</div>
      </td></tr></table>
    </td></tr>
    <tr><td align="center" style="padding:24px 20px 32px">${button(SITE, "Shop now")}</td></tr>`;
  const html = frame({ subject, preheader, where, logo: { src: EXPO_LOGO, alt: "Love Boo x Baby & Kids Expo Dubai", width: 240, height: 37 }, body });
  const text = ["Thank you for signing up!", "", intro, "", `Your discount code: ${DISCOUNT_CODE}`, "", `Shop now: ${SITE}`, "", `Questions? Write to ${REPLY_TO}.`, `You're receiving this because you registered at ${where}. This is an automated message.`].join("\n");
  return { subject, html, text };
}

/** Sends the email through Resend. Returns the Resend id. */
export async function sendRegistrationEmail(to: string, guest: Guest, event: EventInfo) {
  const { subject, html, text } = isQrSignup(guest.source) ? buildDiscountEmail(guest, event) : buildRegistrationEmail(guest, event);
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({ from: FROM(), to, replyTo: REPLY_TO, subject, html, text });
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

/**
 * Emails one stored registration. Safe to call from the webhook and the retry sweep at the same time:
 * the row is claimed first, so only one caller sends. Never throws; the outcome is saved on the row.
 */
export async function emailRegistration(id: number, imageUrl?: string | null) {
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
  if (isQrSignup(claimed.source)) {
    // One code email per address: a repeat sign-up is stored but not emailed again.
    const { count } = await db.from("event_registrations").select("id", { count: "exact", head: true })
      .eq("email", claimed.email).eq("email_status", "sent").like("source", "%\\_qr").neq("id", id);
    if (count) { await done({ email_status: "skipped", email_error: "Code already sent to this address" }); return "skipped"; }
  }
  try {
    const resendId = await sendRegistrationEmail(claimed.email, { ...claimed, prize_image_url: claimed.prize_image_url ?? imageUrl ?? null }, event);
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
