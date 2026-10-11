import { dateLabel, int, money } from "./format";
import type { Summary } from "./data";

const C = { teal: "#006D68", linen: "#f1f3f5", ink: "#212529", mute: "#868e96", line: "#e9ecef" };
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const line = (label: string, value: string, last = false, strong = false) =>
  `<tr><td style="padding:12px 0;${last ? "" : `border-bottom:1px solid ${C.line};`}font-size:15px;color:${strong ? C.ink : C.mute};${strong ? "font-weight:700;" : ""}">${label}</td>
   <td align="right" style="padding:12px 0;${last ? "" : `border-bottom:1px solid ${C.line};`}font-size:${strong ? 17 : 15}px;font-weight:${strong ? 700 : 600};color:${strong ? C.teal : C.ink}">${value}</td></tr>`;

export function buildEmail(s: Summary, appUrl: string, name?: string) {
  const { row } = s, cur = row.currency;
  const at = new Date(`${row.date}T12:00:00Z`);
  const long = `${at.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}, ${at.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`;
  const link = esc(`${appUrl}/sales?date=${row.date}`);
  const stamp = new Date().toLocaleString("en-GB", { timeZone: "Asia/Bahrain", hour12: false });

  const rows: [string, string][] = [
    ["Orders", int(row.orders)],
    ["Units sold", int(row.units)],
    ["Net sales", money(row.net_sales, cur, 2)],
    ["Discounts given", money(row.discounts, cur, 2)],
    ["Shipping", money(row.shipping, cur, 2)],
    ["VAT", money(row.taxes, cur, 2)],
    ["Total sales", money(row.total_sales, cur, 2)],
  ];

  const subject = `Love Boo · Daily sales report — ${dateLabel(row.date)}`;
  const html = `<!doctype html><html><body style="margin:0;background:${C.linen};font-family:${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td style="padding:0 4px 14px;font-size:20px;font-weight:700;color:${C.teal}">${appUrl.startsWith("https") ? `<img src="${esc(appUrl)}/logo.png" width="112" alt="Love Boo" style="display:block;border:0">` : "Love Boo"}</td></tr>
<tr><td style="background:#ffffff;border-radius:16px;padding:28px 28px 24px">
  ${name ? `<div style="font-size:16px;color:${C.ink}">Hello ${esc(name)},</div>
  <div style="margin:4px 0 18px;font-size:14px;color:${C.mute}">Here’s the sales overview for ${long}.</div>` : ""}
  <div style="font-size:20px;font-weight:700;color:${C.ink};line-height:1.3">Daily sales report — ${long}</div>
  <div style="margin-top:10px;font-size:14px"><a href="${link}" style="color:${C.teal};font-weight:600;text-decoration:none">View full report →</a></div>
  <div style="margin-top:6px;font-size:13px;color:${C.mute}">Draft orders excluded. Total sales = net sales + shipping + VAT.</div>
  <div style="margin-top:24px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.teal}">Love Boo Store</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px">
    ${rows.map(([l, v], i) => line(l, v, i === rows.length - 1, i === rows.length - 1)).join("")}
  </table>
</td></tr>
<tr><td style="padding:14px 4px;font-size:12px;color:${C.mute}">Love Boo Ops · ${stamp} (Bahrain)</td></tr>
</table></td></tr></table></body></html>`;

  const text = [...(name ? [`Hello ${name},`, `Here’s the sales overview for ${long}.`, ""] : []), `Daily sales report — ${long}`, `View full report: ${link}`, "Draft orders excluded. Total sales = net sales + shipping + VAT.", "", "Love Boo Store",
    ...rows.map(([l, v]) => `${l}: ${v}`), "", `Love Boo Ops · ${stamp} (Bahrain)`].join("\n");
  return { subject, html, text };
}
