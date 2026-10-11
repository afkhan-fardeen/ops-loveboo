"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendTest } from "@/lib/report";
import { activeRecipients, getSettings, isEmail, saveSettings, type Recipient } from "@/lib/settings";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function save(form: FormData) {
  await requireAdmin();
  const back = (k: "ok" | "err", m: string) => redirect(`/sales/settings?${k}=${encodeURIComponent(m)}`);
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
  await saveSettings({ recipients, emailEnabled: form.get("emailEnabled") === "on", attachExcel: form.get("attachExcel") === "on" });
  back("ok", "Settings saved.");
}

/** Sends the latest report to every saved recipient and reports exactly who it reached. */
export async function testRecipients() {
  await requireAdmin();
  const recipients = activeRecipients(await getSettings()).map((r) => r.email);
  const back = (k: "ok" | "err", m: string) => redirect(`/sales/settings?${k}=${encodeURIComponent(m)}`);
  if (!recipients.length) return back("err", "Add and save at least one active recipient first.");
  if (!process.env.RESEND_API_KEY) return back("err", "Email isn’t configured: RESEND_API_KEY is missing.");
  let r;
  try { r = await sendTest(recipients); } catch (e) { return back("err", e instanceof Error ? e.message : "Couldn’t send the test."); }
  if (!r.failed.length) return back("ok", `Test sent to ${r.sent.join(", ")}.`);
  const why = r.failed.map((f) => `${f.address}: ${f.error}`).join(" · ");
  return back("err", `${r.sent.length ? `Reached ${r.sent.join(", ")}. ` : ""}Failed — ${why}`);
}
