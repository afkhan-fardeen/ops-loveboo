"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendTest } from "@/lib/report";
import { getSettings, saveSettings } from "@/lib/settings";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function save(form: FormData) {
  await requireAdmin();
  const recipients = [...new Set(String(form.get("recipients") ?? "").split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (recipients.length > 25) redirect(`/sales/settings?err=${encodeURIComponent("Maximum 25 recipients.")}`);
  const bad = recipients.find((e) => !EMAIL.test(e));
  if (bad) redirect(`/sales/settings?err=${encodeURIComponent(`“${bad}” isn’t a valid email address.`)}`);
  await saveSettings({ recipients, emailEnabled: form.get("emailEnabled") === "on", attachExcel: form.get("attachExcel") === "on" });
  redirect(`/sales/settings?ok=${encodeURIComponent("Settings saved.")}`);
}

/** Sends the latest report to every saved recipient and reports exactly who it reached. */
export async function testRecipients() {
  await requireAdmin();
  const { recipients } = await getSettings();
  const back = (k: "ok" | "err", m: string) => redirect(`/sales/settings?${k}=${encodeURIComponent(m)}`);
  if (!recipients.length) return back("err", "Add and save at least one recipient first.");
  if (!process.env.RESEND_API_KEY) return back("err", "Email isn’t configured: RESEND_API_KEY is missing.");
  let r;
  try { r = await sendTest(recipients); } catch (e) { return back("err", e instanceof Error ? e.message : "Couldn’t send the test."); }
  if (!r.failed.length) return back("ok", `Test sent to ${r.sent.join(", ")}.`);
  const why = r.failed.map((f) => `${f.address}: ${f.error}`).join(" · ");
  return back("err", `${r.sent.length ? `Reached ${r.sent.join(", ")}. ` : ""}Failed — ${why}`);
}
