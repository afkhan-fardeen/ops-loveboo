import { Resend } from "resend";
import { EXPO_LOGO, FROM, REPLY_TO, SITE, button, C, esc, font, frame, serif } from "./registration-email";
import { firstName } from "./names";
import { DISCOUNT_CODE, DISCOUNT_ENDS_ON } from "./outcome";

/** The reminder for people who got the Expo discount code: one idea (your code is still waiting, here is when it ends), one button. */
export type ReminderProduct = { title: string; handle: string; image: string };

const UTM = "utm_source=email&utm_medium=reminder&utm_campaign=expo_code_reminder";
/** A store discount link: it applies the code to the visitor's cart, then sends them on to `path` (the product, or the homepage). */
export const discountLink = (path = "/") => `${SITE}/discount/${encodeURIComponent(DISCOUNT_CODE)}?redirect=${encodeURIComponent(`${path}${path.includes("?") ? "&" : "?"}${UTM}`)}`;
/** Product photos are hosted next to the logo (ops.loveboo.com/email/) so mail apps that block third-party image hosts still show them. */
export const EMAIL_IMAGES: Record<string, string> = {
  "no-more-knots-detangling-spray": "knots", "soft-swishy-gentle-shampoo": "shampoo", "tame-my-mane-gentle-conditioner": "conditioner",
};
export const hostedImage = (handle: string, fallback: string) => (EMAIL_IMAGES[handle] ? `https://ops.loveboo.com/email/${EMAIL_IMAGES[handle]}.jpg` : fallback);
export const endsLabel = () => new Date(`${DISCOUNT_ENDS_ON}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
/** Whole days left until the code ends (calendar days, never negative). */
export const daysLeft = (now = new Date()) => Math.max(0, Math.round((Date.parse(`${DISCOUNT_ENDS_ON}T00:00:00Z`) - Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`)) / 86400000));
const leftPhrase = (n: number) => (n <= 0 ? "ends today" : n === 1 ? "ends tomorrow" : `ends in ${n} days`);
const UNSUB = `mailto:${REPLY_TO}?subject=Unsubscribe`;

export function buildReminderEmail(guest: { first_name: string; email: string }, products: ReminderProduct[]) {
  const name = firstName(guest.email, guest.first_name);
  const ends = endsLabel();
  const left = daysLeft();
  const subject = `Your Love Boo 10% off ends ${ends}`;
  const preheader = `${left <= 1 ? "Last chance" : `Only ${left} days left`} to use ${DISCOUNT_CODE} on our best-selling hair care.`;
  const hello = name === "there" ? "Hi there" : `Hi ${name}`;
  const cta = (label: string) => button(discountLink("/"), label);

  const cards = products.slice(0, 3).map((p) => `
        <td width="33%" valign="top" align="center" style="padding:0 5px">
          <a href="${esc(discountLink(`/products/${p.handle}`))}" style="text-decoration:none;color:${C.ink}">
            <img src="${esc(p.image)}" alt="${esc(p.title)}" width="170" style="display:block;width:100%;max-width:170px;height:auto;border:0;border-radius:14px;background:${C.cream};font:600 12px ${font};color:${C.deep}">
            <div style="margin-top:8px;font:700 13px/1.35 ${font};color:${C.ink}">${esc(p.title)}</div>
            <div style="margin-top:4px;font:700 12px ${font};color:${C.teal}">Shop with 10% off &rarr;</div>
          </a>
        </td>`).join("");

  const body = `    <tr><td align="center" style="padding:28px 24px 6px">
      <div style="font:400 26px/1.25 ${serif};color:${C.deep};letter-spacing:.2px">Your 10% off ${esc(leftPhrase(left))}</div>
      <div style="margin-top:12px;font:400 15px/1.6 ${font};color:${C.mute}">${esc(hello)}, you signed up at the Baby &amp; Kids Expo in Dubai and you haven&rsquo;t used your code yet. After <b style="color:${C.ink}">${esc(ends)}</b> it&rsquo;s gone for good, so use it on the hair care you already know you need.</div>
    </td></tr>
    <tr><td align="center" style="padding:18px 24px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.cream}" style="background:${C.cream};border:2px dashed ${C.teal};border-radius:18px"><tr><td align="center" style="padding:18px 16px">
        <div style="font:700 11px ${font};letter-spacing:.12em;text-transform:uppercase;color:${C.mute}">${esc(left <= 1 ? "Last chance" : `Only ${left} days left`)} · ends ${esc(ends)}</div>
        <div style="margin-top:6px;font:700 24px/1.2 ${font};letter-spacing:.1em;color:${C.teal}">${esc(DISCOUNT_CODE)}</div>
      </td></tr></table>
    </td></tr>
    <tr><td align="center" style="padding:20px 24px 4px">${cta("Claim my 10% off now")}</td></tr>
    <tr><td align="center" style="padding:8px 28px 0;font:400 12px/1.5 ${font};color:${C.mute}">The discount is added for you at checkout. One use per customer, so make it count.</td></tr>
    <tr><td align="center" style="padding:30px 24px 6px"><div style="font:400 20px/1.3 ${serif};color:${C.deep}">Our best sellers</div><div style="margin-top:4px;font:400 13px ${font};color:${C.mute}">Start here, with your 10% off already applied</div></td></tr>
    <tr><td align="center" style="padding:10px 19px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cards}
    </tr></table></td></tr>
    <tr><td align="center" style="padding:28px 24px 34px">${cta("Use my 10% off before it ends")}</td></tr>`;

  const footer = `You’re receiving this because you signed up at Baby &amp; Kids Expo Dubai and agreed to hear from Love Boo.<br><a href="${esc(UNSUB)}" style="color:#ffffff">Unsubscribe</a> &middot; <a href="${SITE}" style="color:#ffffff">loveboo.com</a>`;
  const html = frame({ subject, preheader, where: "Baby & Kids Expo Dubai", logo: { src: EXPO_LOGO, alt: "Love Boo x Baby & Kids Expo Dubai", width: 240, height: 37 }, body, footer });
  const text = [`${hello},`, "", `Your 10% off ${leftPhrase(left)}. Your code ${DISCOUNT_CODE} stops working after ${ends}.`, "", `Claim my 10% off now: ${discountLink("/")}`, "(The discount is added for you at checkout. One use per customer, so make it count.)", "",
    "Our best sellers:", ...products.slice(0, 3).map((p) => `- ${p.title}: ${discountLink(`/products/${p.handle}`)}`), "", `Questions? Write to ${REPLY_TO}.`, `Unsubscribe: reply with the word Unsubscribe, or ${UNSUB}`].join("\n");
  return { subject, html, text };
}

/** Sends one reminder through Resend, with a one-click-style unsubscribe header. */
export async function sendReminder(to: string, guest: { first_name: string; email: string }, products: ReminderProduct[], opts: { testLabel?: boolean } = {}) {
  const { subject, html, text } = buildReminderEmail(guest, products);
  const { data, error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: FROM(), to, replyTo: REPLY_TO, subject: opts.testLabel ? `[TEST] ${subject}` : subject, html, text,
    headers: { "List-Unsubscribe": `<${UNSUB}>` },
  });
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}
