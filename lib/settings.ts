import { adminClient } from "./supabase";
import { DEFAULT_SEND_TIME, isHHMM } from "./schedule";

export type Recipient = { name: string; email: string; active: boolean };
export type ReportSettings = { recipients: Recipient[]; emailEnabled: boolean; attachExcel: boolean; sendTime: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (e: string) => EMAIL.test(e);

const envRecipients = (): Recipient[] =>
  (process.env.REPORT_RECIPIENTS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).map((email) => ({ name: "", email, active: true }));

/** Accepts the old format (plain email strings) as well as {name, email, active}. */
const normalise = (raw: unknown): Recipient[] =>
  (Array.isArray(raw) ? raw : []).flatMap((x): Recipient[] => {
    const o = typeof x === "string" ? { email: x } : (x as Partial<Recipient>);
    const email = String(o.email ?? "").trim().toLowerCase();
    return isEmail(email) ? [{ name: String(o.name ?? "").trim().slice(0, 80), email, active: o.active !== false }] : [];
  });

/** Stored settings win; env REPORT_RECIPIENTS is only the fallback before the first save. */
export async function getSettings(): Promise<ReportSettings> {
  const { data } = await adminClient().from("settings").select("value").eq("key", "report").maybeSingle();
  const v = (data?.value ?? {}) as { recipients?: unknown; emailEnabled?: boolean; attachExcel?: boolean; sendTime?: string };
  return {
    recipients: Array.isArray(v.recipients) ? normalise(v.recipients) : envRecipients(),
    emailEnabled: v.emailEnabled ?? true,
    attachExcel: v.attachExcel ?? true,
    sendTime: v.sendTime && isHHMM(v.sendTime) ? v.sendTime : DEFAULT_SEND_TIME,
  };
}

export const activeRecipients = (s: ReportSettings) => s.recipients.filter((r) => r.active);

export async function saveSettings(s: ReportSettings) {
  const { error } = await adminClient().from("settings").upsert({ key: "report", value: s });
  if (error) throw error;
}

/** The scheduler pings the cron route; remember when, so Settings can show whether it is alive. */
export async function touchScheduler() {
  await adminClient().from("settings").upsert({ key: "scheduler", value: { lastTick: new Date().toISOString() } });
}
export async function lastTick(): Promise<string | null> {
  const { data } = await adminClient().from("settings").select("value").eq("key", "scheduler").maybeSingle();
  return (data?.value as { lastTick?: string } | null)?.lastTick ?? null;
}
