"use server";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth";
import { sendTest } from "@/lib/report";
import { serverClient } from "@/lib/supabase";

export async function sendTestEmail() {
  const user = await requireModule("sales");
  const to = (k: "ok" | "err", m: string) => redirect(`/sales?${k}=${encodeURIComponent(m)}`);
  if (!process.env.RESEND_API_KEY) return to("err", "Email isn’t configured yet. Add RESEND_API_KEY first.");
  try {
    await sendTest(user.email);
  } catch {
    return to("err", "The test email couldn’t be sent. Check your email settings and try again.");
  }
  to("ok", `Test email sent to ${user.email}.`);
}

export async function signOut() {
  await (await serverClient()).auth.signOut();
  redirect("/login");
}
