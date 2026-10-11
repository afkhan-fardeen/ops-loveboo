import { adminClient } from "./supabase";

export type ReportSettings = { recipients: string[]; emailEnabled: boolean; attachExcel: boolean };

const envRecipients = () => (process.env.REPORT_RECIPIENTS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

/** Stored settings win; env REPORT_RECIPIENTS is only the fallback before the first save. */
export async function getSettings(): Promise<ReportSettings> {
  const { data } = await adminClient().from("settings").select("value").eq("key", "report").maybeSingle();
  const v = (data?.value ?? {}) as Partial<ReportSettings>;
  return {
    // Once an admin has saved, the saved list (even if empty) wins over the env fallback.
    recipients: Array.isArray(v.recipients) ? v.recipients : envRecipients(),
    emailEnabled: v.emailEnabled ?? true,
    attachExcel: v.attachExcel ?? true,
  };
}

export async function saveSettings(s: ReportSettings) {
  const { error } = await adminClient().from("settings").upsert({ key: "report", value: s });
  if (error) throw error;
}
