"use server";
import { redirect } from "next/navigation";
import { sendTest } from "@/lib/report";
import { hasSupabase, serverClient } from "@/lib/supabase";

export async function sendTestEmail() {
  let result = "sent";
  try {
    if (!hasSupabase() || !process.env.RESEND_API_KEY) result = "unconfigured";
    else {
      const { data } = await (await serverClient()).auth.getUser();
      if (!data.user?.email) result = "failed";
      else await sendTest(data.user.email);
    }
  } catch {
    result = "failed";
  }
  redirect(`/?test=${result}`);
}

export async function signOut() {
  if (hasSupabase()) await (await serverClient()).auth.signOut();
  redirect("/login");
}
