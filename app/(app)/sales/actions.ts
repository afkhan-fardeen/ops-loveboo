"use server";
import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendNow } from "@/lib/report";

/** Adds ?ok= / ?err= to a same-site path, preserving its existing query. */
const toast = (path: string, k: "ok" | "err", m: string) => {
  const u = new URL(path, "http://x");
  u.searchParams.delete("ok"); u.searchParams.delete("err");
  u.searchParams.set(k, m);
  return `${u.pathname}${u.search}`;
};

export async function sendReportNow(form: FormData) {
  await requireAdmin();
  const date = String(form.get("date") ?? "");
  const raw = String(form.get("returnTo") ?? "/sales");
  const back = raw.startsWith("/sales") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/sales";
  const go = (k: "ok" | "err", m: string) => redirect(toast(back, k, m));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return go("err", "That date isn’t valid.");
  if (!process.env.RESEND_API_KEY) return go("err", "Email isn’t configured: RESEND_API_KEY is missing.");

  let r;
  try { r = await sendNow(date); revalidateTag("sales"); } catch (e) { return go("err", e instanceof Error ? e.message : "Couldn’t send the report."); }
  if (r.none) return go("err", "No active recipients. Add or switch on a recipient in Settings first.");
  if (!r.failed.length) return go("ok", `Report for ${date} sent to ${r.sent.join(", ")}.`);
  const why = r.failed.map((f) => `${f.address}: ${f.error}`).join(" · ");
  return go("err", `${r.sent.length ? `Sent to ${r.sent.join(", ")}. ` : ""}Failed — ${why}`);
}
