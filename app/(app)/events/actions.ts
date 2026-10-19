"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { retryPendingRegistrationEmails, sendRegistrationEmail } from "@/lib/registration-email";
import { adminClient } from "@/lib/supabase";

export type Result = { ok: boolean; message: string };

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

export async function saveEvent(form: FormData) {
  await requireAdmin();
  const back = (k: "ok" | "err", m: string) => redirect(`/events?${k}=${encodeURIComponent(m)}`);
  const starts = String(form.get("starts_on") ?? ""), ends = String(form.get("ends_on") ?? "");
  if ((starts && !isDate(starts)) || (ends && !isDate(ends))) return back("err", "Enter valid dates.");
  if (starts && ends && ends < starts) return back("err", "The end date is before the start date.");
  const { error } = await adminClient().from("events").update({
    starts_on: starts || null, ends_on: ends || null,
    collection_text: String(form.get("collection_text") ?? "").trim().slice(0, 600),
    email_enabled: form.get("email_enabled") === "on",
  }).eq("id", String(form.get("id")));
  if (error) return back("err", error.message);
  back("ok", "Event saved.");
}

/** Sends the winner email to the signed-in admin only, so the wording can be checked. */
export async function sendTestEmail(): Promise<Result> {
  const me = await requireAdmin();
  try {
    const { data } = await adminClient().from("events").select("name,collection_text").order("created_at", { ascending: false }).limit(1).maybeSingle();
    await sendRegistrationEmail(me.email, { first_name: me.name?.split(" ")[0] ?? "", email: me.email, prize: "Sample Gift (test)" }, data);
    return { ok: true, message: `Test email sent to ${me.email}.` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Couldn’t send the test." };
  }
}

/** Gives failed emails a fresh set of attempts and sends everything still waiting. */
export async function retryFailed(): Promise<Result> {
  await requireAdmin();
  const db = adminClient();
  await db.from("event_registrations").update({ email_attempts: 0, created_at: new Date(Date.now() - 3 * 60e3).toISOString() }).eq("email_status", "failed");
  const r = await retryPendingRegistrationEmails();
  return { ok: true, message: r.tried ? `Tried ${r.tried}, sent ${r.sent}.` : "Nothing was waiting to be sent." };
}
