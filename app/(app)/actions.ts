"use server";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth";
import { sendTest } from "@/lib/report";
import { hasSupabase, serverClient } from "@/lib/supabase";

export async function sendTestEmail() {
  const user = await requireModule("sales");
  let result = "sent";
  try {
    if (!hasSupabase() || !process.env.RESEND_API_KEY) result = "unconfigured";
    else await sendTest(user.email);
  } catch {
    result = "failed";
  }
  redirect(`/sales?test=${result}`);
}

export async function signOut() {
  if (hasSupabase()) await (await serverClient()).auth.signOut();
  redirect("/login");
}
