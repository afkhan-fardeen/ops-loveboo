"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { saveSettings } from "@/lib/settings";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function save(form: FormData) {
  await requireAdmin();
  const recipients = [...new Set(String(form.get("recipients") ?? "").split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const bad = recipients.find((e) => !EMAIL.test(e));
  if (bad) redirect(`/sales/settings?err=${encodeURIComponent(`“${bad}” isn’t a valid email address.`)}`);
  await saveSettings({ recipients, emailEnabled: form.get("emailEnabled") === "on", attachExcel: form.get("attachExcel") === "on" });
  redirect("/sales/settings?saved=1");
}
