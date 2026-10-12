"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { isHHMM } from "@/lib/schedule";
import { isEmail, saveSettings, type Recipient } from "@/lib/settings";

export async function save(form: FormData) {
  await requireAdmin();
  const back = (k: "ok" | "err", m: string) => redirect(`/reports/daily-sales/settings?${k}=${encodeURIComponent(m)}`);
  let raw: unknown;
  try { raw = JSON.parse(String(form.get("recipients") ?? "[]")); } catch { return back("err", "Couldn’t read the recipients list. Reload and try again."); }
  if (!Array.isArray(raw)) return back("err", "Couldn’t read the recipients list. Reload and try again.");
  if (raw.length > 25) return back("err", "Maximum 25 recipients.");

  const seen = new Set<string>();
  const recipients: Recipient[] = [];
  for (const x of raw as Partial<Recipient>[]) {
    const email = String(x.email ?? "").trim().toLowerCase();
    if (!isEmail(email)) return back("err", `“${email || "(empty)"}” isn’t a valid email address.`);
    if (seen.has(email)) continue;
    seen.add(email);
    recipients.push({ name: String(x.name ?? "").trim().slice(0, 80), email, active: x.active !== false });
  }
  const sendTime = String(form.get("sendTime") ?? "");
  if (!isHHMM(sendTime)) return back("err", "Pick a valid send time.");
  await saveSettings({ recipients, emailEnabled: form.get("emailEnabled") === "on", attachExcel: form.get("attachExcel") === "on", sendTime });
  back("ok", "Settings saved.");
}
