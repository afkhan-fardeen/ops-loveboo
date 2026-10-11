import { dateLabel, int, money, num2, timeIn } from "./format";
import type { Summary } from "./data";

const C = { teal: "#006D68", linen: "#f1f3f5", ink: "#212529", mute: "#868e96", line: "#e9ecef" };
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const line = (label: string, value: string, last = false) =>
  `<tr><td style="padding:12px 0;${last ? "" : `border-bottom:1px solid ${C.line};`}font-size:15px;color:${C.mute}">${label}</td>
   <td align="right" style="padding:12px 0;${last ? "" : `border-bottom:1px solid ${C.line};`}font-size:15px;font-weight:600;color:${C.ink}">${value}</td></tr>`;

export function buildEmail(s: Summary, appUrl: string) {
  const { row } = s, cur = row.currency;
  const long = new Date(`${row.date}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(/^(\w+)/, "$1,");
  const link = `${appUrl}/sales/reports/${row.date}`;
  const stamp = new Date().toLocaleString("en-GB", { timeZone: "Asia/Bahrain", hour12: false });

  const rows: [string, string][] = [
    ["Orders", int(row.orders)],
    ["Units sold", int(row.units)],
    ["Total sales", money(row.net_sales, cur, 2)],
    ["Discounts given", money(row.discounts, cur, 2)],
  ];

  const tz = process.env.STORE_TIMEZONE ?? "Europe/London";
  const th = (t: string, right = false) => `<td ${right ? 'align="right" ' : ""}style="padding:8px 0;font-size:12px;font-weight:700;color:${C.mute};border-bottom:1px solid ${C.line}">${t}</td>`;
  const td = (t: string, right = false, bold = false) => `<td ${right ? 'align="right" ' : ""}style="padding:10px 0;font-size:14px;color:${C.ink};${bold ? "font-weight:600;" : ""}border-bottom:1px solid ${C.line}">${t}</td>`;
  const orderRows = row.order_list.length
    ? row.order_list.map((o) => `<tr>${td(o.name.replace(/</g, "&lt;"), false, true)}${td(timeIn(o.time, tz))}${td(num2(o.amount), true)}${td(num2(o.discount), true)}</tr>`).join("")
    : `<tr><td colspan="4" style="padding:12px 0;font-size:14px;color:${C.mute}">No orders.</td></tr>`;

  const subject = `Love Boo · Daily sales report — ${dateLabel(row.date)}`;
  const html = `<!doctype html><html><body style="margin:0;background:${C.linen};font-family:${font}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td style="padding:0 4px 14px;font-size:20px;font-weight:700;color:${C.teal}">${appUrl.startsWith("https") ? `<img src="${appUrl}/logo.png" width="112" alt="Love Boo" style="display:block;border:0">` : "Love Boo"}</td></tr>
<tr><td style="background:#ffffff;border-radius:16px;padding:28px 28px 24px">
  <div style="font-size:20px;font-weight:700;color:${C.ink};line-height:1.3">Daily sales report — ${long}</div>
  <div style="margin-top:10px;font-size:14px"><a href="${link}" style="color:${C.teal};font-weight:600;text-decoration:none">View full report →</a></div>
  <div style="margin-top:6px;font-size:13px;color:${C.mute}">Draft orders excluded.</div>
  <div style="margin-top:24px;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:${C.teal}">Love Boo Store</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px">
    ${rows.map(([l, v], i) => line(l, v, i === rows.length - 1)).join("")}
  </table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
    <tr>${th("Order")}${th("Time")}${th("Amount", true)}${th("Discount", true)}</tr>${orderRows}
  </table>
</td></tr>
<tr><td style="padding:14px 4px;font-size:12px;color:${C.mute}">Love Boo Ops · ${stamp} (Bahrain)</td></tr>
</table></td></tr></table></body></html>`;

  const text = [`Daily sales report — ${long}`, `View full report: ${link}`, "Draft orders excluded.", "", "Love Boo Store",
    ...rows.map(([l, v]) => `${l}: ${v}`), "", "Order  Time  Amount  Discount",
    ...row.order_list.map((o) => `${o.name}  ${timeIn(o.time, tz)}  ${num2(o.amount)}  ${num2(o.discount)}`), "", `Love Boo Ops · ${stamp} (Bahrain)`].join("\n");
  return { subject, html, text };
}
