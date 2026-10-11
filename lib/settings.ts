import { adminClient } from "./supabase";

export type ReportSettings = { recipients: string[]; emailEnabled: boolean; attachExcel: boolean };

const envRecipients = () => (process.env.REPORT_RECIPIENTS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

/** Stored settings win; env REPORT_RECIPIENTS is the fallback until an admin saves. */
export async function getSettings(): Promise<ReportSettings> {
  const { data } = await adminClient().from("settings").select("value").eq("key", "report").maybeSingle();
  const v = (data?.value ?? {}) as Partial<ReportSettings>;
  return {
    recipients: v.recipients?.length ? v.recipients : envRecipients(),
    emailEnabled: v.emailEnabled ?? true,
    attachExcel: v.attachExcel ?? true,
  };
}

export async function saveSettings(s: ReportSettings) {
  const { error } = await adminClient().from("settings").upsert({ key: "report", value: s });
  if (error) throw error;
}
