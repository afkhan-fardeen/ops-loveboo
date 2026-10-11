import { dateLabel, int, money, pct } from "./format";
import type { Summary } from "./data";

const C = { teal: "#006D68", meadow: "#E3EABA", linen: "#F9F6EC", ink: "#222222", berry: "#FF3B40", mute: "#5c5c5c" };

const chip = (v: number | null, label: string) => {
  if (v === null) return `<span style="color:${C.mute};font-size:12px">${label}: —</span>`;
  const up = v >= 0;
  return `<span style="display:inline-block;margin-top:4px;padding:2px 8px;border-radius:99px;font-size:12px;background:${up ? C.meadow : "#FFE3E3"};color:${up ? C.teal : C.ink}">${up ? "▲" : `<span style="color:${C.berry}">▼</span>`} ${pct(v)} ${label}</span>`;
};

const kpi = (label: string, value: string, extra = "") =>
  `<td width="50%" style="padding:6px"><div style="background:${C.linen};border-radius:12px;padding:14px">
    <div style="font-size:12px;color:${C.mute}">${label}</div>
    <div style="font-size:24px;font-weight:700;color:${C.ink};margin-top:2px">${value}</div>${extra}</div></td>`;

export function buildEmail(s: Summary, appUrl: string) {
  const { row } = s, cur = row.currency, label = dateLabel(row.date);
  const subject = `Love Boo · Sales · ${label} — ${money(row.net_sales, cur)} net / ${row.orders} orders`;

  const products = row.top_products.map((p, i) =>
    `<tr><td style="padding:8px 0;border-top:1px solid #eee;color:${C.ink}">${i + 1}. ${p.name.replace(/</g, "&lt;")}</td>
     <td align="right" style="padding:8px 0;border-top:1px solid #eee;color:${C.mute}">${int(p.units)}</td>
     <td align="right" style="padding:8px 0;border-top:1px solid #eee;color:${C.ink};font-weight:600">${money(p.net, cur)}</td></tr>`).join("");

  const places = row.locations.slice(0, 5).map((l) =>
    `<tr><td style="padding:8px 0;border-top:1px solid #eee;color:${C.ink}">${(l.city === "Unknown" ? l.country : `${l.city}, ${l.country}`).replace(/</g, "&lt;")}</td>
     <td align="right" style="padding:8px 0;border-top:1px solid #eee;color:${C.mute}">${int(l.orders)}</td>
     <td align="right" style="padding:8px 0;border-top:1px solid #eee;color:${C.ink};font-weight:600">${money(l.net, cur)}</td></tr>`).join("");

  const html = `<!doctype html><html><body style="margin:0;background:${C.linen};font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="padding:0 6px 16px;font-size:22px;font-weight:700;color:${C.teal}">Love Boo</td></tr>
<tr><td style="background:#fff;border-radius:16px;padding:20px">
  <div style="font-size:14px;color:${C.mute}">Sales report</div>
  <div style="font-size:20px;font-weight:700;color:${C.ink};margin-bottom:12px">${label}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>${kpi("Net sales", money(row.net_sales, cur), `<div>${chip(s.vsPrev, "vs prev day")}</div><div>${chip(s.vsWeek, "vs last week")}</div>`)}${kpi("Orders", int(row.orders))}</tr>
    <tr>${kpi("Average order value", money(s.aov, cur, 2))}${kpi("Month to date", money(s.mtdNet, cur), `<div style="font-size:12px;color:${C.mute};margin-top:4px">${int(s.mtdOrders)} orders</div>`)}</tr>
  </table>
  <div style="font-size:14px;font-weight:700;color:${C.ink};margin:20px 6px 4px">Top products</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 6px;width:calc(100% - 12px)">
    <tr><td style="color:${C.mute};font-size:12px">Product</td><td align="right" style="color:${C.mute};font-size:12px">Units</td><td align="right" style="color:${C.mute};font-size:12px">Net</td></tr>${products}
  </table>
  <div style="font-size:14px;font-weight:700;color:${C.ink};margin:20px 6px 4px">Top locations</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:0 6px;width:calc(100% - 12px)">
    <tr><td style="color:${C.mute};font-size:12px">Location</td><td align="right" style="color:${C.mute};font-size:12px">Orders</td><td align="right" style="color:${C.mute};font-size:12px">Net</td></tr>${places}
  </table>
  <p style="font-size:13px;color:${C.mute};margin:20px 6px 0">The Excel file attached has the month's daily sales with totals, and sales by location.</p>
  <div style="text-align:center;margin-top:24px"><a href="${appUrl}/sales/reports/${row.date}" style="display:inline-block;background:${C.teal};color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600">Open portal</a></div>
</td></tr></table></td></tr></table></body></html>`;

  const text = [subject, "",
    `Net sales: ${money(row.net_sales, cur)}`, `Orders: ${row.orders}`, `AOV: ${money(s.aov, cur, 2)}`,
    `Month to date: ${money(s.mtdNet, cur)} / ${s.mtdOrders} orders`, "", "Top products:",
    ...row.top_products.map((p, i) => `${i + 1}. ${p.name} — ${p.units} units, ${money(p.net, cur)}`), "", "Top locations:", ...row.locations.slice(0, 5).map((l) => `${l.city}, ${l.country} — ${l.orders} orders, ${money(l.net, cur)}`), "", "Excel attached: daily sales and location sales.", "", `${appUrl}/sales/reports/${row.date}`].join("\n");

  return { subject, html, text };
}
