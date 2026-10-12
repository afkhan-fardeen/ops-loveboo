"use server";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth";
import { sendTest } from "@/lib/report";
import { serverClient } from "@/lib/supabase";

export async function sendTestEmail(form: FormData) {
  const user = await requireModule("reports");
  const raw = String(form.get("date") ?? "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : undefined;
  const to = (k: "ok" | "err", m: string) => redirect(`/reports/daily-sales?${date ? `date=${date}&` : ""}${k}=${encodeURIComponent(m)}`);
  if (!process.env.RESEND_API_KEY) return to("err", "Email isn’t configured yet. Add RESEND_API_KEY first.");
  try {
    const r = await sendTest(user.email, date);
    if (r.failed.length) return to("err", r.failed[0].error);
  } catch {
    return to("err", "The test email couldn’t be sent. Check your email settings and try again.");
  }
  to("ok", `Test email sent to ${user.email}.`);
}

export async function signOut() {
  await (await serverClient()).auth.signOut();
  redirect("/login");
}
