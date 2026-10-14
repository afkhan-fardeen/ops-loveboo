"use server";
import { requireAdmin } from "@/lib/auth";
import { logRun } from "@/lib/jobs";
import { runScheduled } from "@/lib/scheduled";

export type Result = { ok: boolean; message: string };

/** Runs the same check the scheduler runs (and sends the email if it is due). */
export async function runCheckNow(): Promise<Result> {
  await requireAdmin();
  const t0 = Date.now();
  try {
    const r = await runScheduled();
    await logRun({ source: "manual", outcome: r.outcome, detail: `Run check now: ${r.detail}`, report_date: r.date, ms: Date.now() - t0 });
    return { ok: true, message: r.detail };
  } catch (e) {
    const message = e instanceof Error ? e.message : "The check failed.";
    await logRun({ source: "manual", outcome: "error", detail: `Run check now: ${message}`, ms: Date.now() - t0 });
    return { ok: false, message };
  }
}
