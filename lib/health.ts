import { fetchRow } from "./data";
import { getStoreTz } from "./timezone";
import { yesterdayIn } from "./format";
import { recentRuns, type JobRun } from "./jobs";
import { SEND_TZ, toMinutes, minutesNow } from "./schedule";
import { activeRecipients, getSettings } from "./settings";

export type Status = "ok" | "warn" | "bad";
export type Check = { label: string; status: Status; detail: string };

/** The worst status wins. */
export const overall = (checks: { status: Status }[]): Status =>
  checks.some((c) => c.status === "bad") ? "bad" : checks.some((c) => c.status === "warn") ? "warn" : "ok";

/** "5 min ago", "3 h ago", "2 days ago". */
export function ago(iso: string, now = Date.now()) {
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  return m < 2 ? "just now" : m < 90 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
}

export const clock = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: SEND_TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

async function shopifyCheck(): Promise<Check> {
  const label = "Shopify connection";
  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_TOKEN) return { label, status: "bad", detail: "Store domain or admin token is missing." };
  try {
    const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${process.env.SHOPIFY_API_VERSION ?? "2025-07"}/graphql.json`, {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN },
      body: JSON.stringify({ query: "{ shop { name currencyCode } }" }),
    });
    const json = (await res.json()) as { data?: { shop: { name: string; currencyCode: string } }; errors?: unknown };
    if (!res.ok || json.errors || !json.data) return { label, status: "bad", detail: `Shopify refused the request (${res.status}). The token may have been revoked.` };
    return { label, status: "ok", detail: `Connected to ${json.data.shop.name.trim()} (${json.data.shop.currencyCode}).` };
  } catch {
    return { label, status: "bad", detail: "Couldn’t reach Shopify (timed out or network error)." };
  }
}

/** Everything the health screen shows, computed from live state. */
export async function healthChecks(now = new Date()): Promise<{ checks: Check[]; runs: JobRun[]; reportDate: string }> {
  const cfg = await getSettings();
  const storeTz = await getStoreTz();
  const reportDate = yesterdayIn(storeTz);
  const [runs, row, shopify] = await Promise.all([recentRuns(200), fetchRow(reportDate), shopifyCheck()]);
  const people = activeRecipients(cfg);
  const checks: Check[] = [];

  // 1. Is the scheduler running, and how often?
  const last = (src: string) => runs.find((r) => r.source === src && r.outcome !== "manual")?.at;
  const github = last("github"), vercel = last("vercel");
  const within = (iso: string | undefined, min: number) => !!iso && now.getTime() - new Date(iso).getTime() < min * 60000;
  const sendMin = toMinutes(cfg.sendTime) ?? 480;
  let scheduler: Check;
  if (within(github, 40)) scheduler = { label: "Scheduler", status: "ok", detail: `Checking every 15 minutes. Last check: ${ago(github!)} (GitHub).` };
  else if (within(vercel, 26 * 60)) {
    const late = sendMin > 9 * 60;
    scheduler = { label: "Scheduler", status: late ? "bad" : "warn", detail: `Only the once-a-day Vercel check is running (last: ${ago(vercel!)}). ${late ? `A send time of ${cfg.sendTime} can’t fire; set it to 08:00 or earlier, or ` : "For exact send times, "}add the GitHub secrets (see README).` };
  } else scheduler = { label: "Scheduler", status: "bad", detail: `No scheduler check in the last 26 hours${runs[0] ? ` (last run of any kind: ${ago(runs[0].at)})` : ", and none recorded yet"}. The daily report and email won’t happen on their own.` };
  checks.push(scheduler);

  // 2. Yesterday's report stored?
  checks.push(row
    ? { label: `Yesterday’s report (${reportDate})`, status: "ok", detail: `Stored: ${row.orders} orders, ${row.total_sales.toFixed(2)} total sales.` }
    : { label: `Yesterday’s report (${reportDate})`, status: scheduler.status === "bad" ? "bad" : "warn", detail: "Not stored yet. It is created at the first scheduler check after midnight; “Run the check now” below does it immediately." });

  // 3. Yesterday's email.
  const nowMin = minutesNow(SEND_TZ, now);
  let email: Check;
  if (!cfg.emailEnabled) email = { label: "Daily email", status: "warn", detail: "Switched off in Email settings." };
  else if (!people.length) email = { label: "Daily email", status: "bad", detail: "No active recipients, so nothing is sent." };
  else if (row?.emailed_at) email = { label: "Daily email", status: "ok", detail: `Sent ${clock(row.emailed_at)} (Bahrain) to the recipients.` };
  else if (nowMin < sendMin) email = { label: "Daily email", status: "ok", detail: `Waiting for the send time, ${cfg.sendTime} Bahrain (in ${Math.max(1, sendMin - nowMin)} min).` };
  else email = { label: "Daily email", status: nowMin - sendMin > 45 ? "bad" : "warn", detail: `Overdue: it was due at ${cfg.sendTime} Bahrain and hasn’t been sent. ${scheduler.status === "ok" ? "The next check should send it." : "The scheduler isn’t checking often enough."}` };
  checks.push(email);

  // 4-7. Recipients, Shopify, email sending, secrets.
  const envTz = process.env.STORE_TIMEZONE;
  checks.push({ label: "Store timezone", status: "ok", detail: `Days are cut at midnight ${storeTz}, read from Shopify${envTz && envTz !== storeTz ? ` (the STORE_TIMEZONE setting says ${envTz}, which is ignored)` : ""}.` });
  checks.push({ label: "Recipients", status: people.length ? "ok" : "bad", detail: `${people.length} active of ${cfg.recipients.length}.` });
  checks.push(shopify);
  const sender = process.env.REPORT_FROM ?? "";
  checks.push(!process.env.RESEND_API_KEY || !sender
    ? { label: "Email sending", status: "bad", detail: "RESEND_API_KEY or REPORT_FROM is missing." }
    : sender.includes("resend.dev")
      ? { label: "Email sending", status: "warn", detail: "Sending from Resend’s test address, which only reaches one person. Use an address on your verified domain." }
      : { label: "Email sending", status: "ok", detail: `Sending as ${sender.replace(/^.*</, "").replace(">", "")}.` });
  const missing = ["CRON_SECRET", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !process.env[k]);
  const appUrl = process.env.APP_URL ?? "";
  const urlBad = !appUrl || /localhost|127\.0\.0\.1/.test(appUrl);
  checks.push(missing.length || urlBad
    ? { label: "Settings and secrets", status: "bad", detail: `${missing.length ? `Missing: ${missing.join(", ")}. ` : ""}${urlBad ? "APP_URL isn’t the live address, so links in emails are wrong." : ""}`.trim() }
    : { label: "Settings and secrets", status: "ok", detail: `All set. Links in emails use ${appUrl}.` });

  return { checks, runs, reportDate };
}
