import { adminClient } from "./supabase";

export type Outcome = "loaded" | "emailed" | "skipped" | "error" | "manual";
export type JobRun = { id: number; at: string; source: string; outcome: Outcome; detail: string; report_date: string | null; ms: number };

/** Who called the job: Vercel Cron and our GitHub workflow identify themselves; anything else is a manual call. */
export const sourceFrom = (userAgent: string | null) =>
  /vercel-cron/i.test(userAgent ?? "") ? "vercel" : /github-actions-scheduler/i.test(userAgent ?? "") ? "github" : "manual";

/** Records a run for the health screen. Never throws: logging must not break the job. Keeps 14 days. */
export async function logRun(r: { source: string; outcome: Outcome; detail: string; report_date?: string | null; ms: number }) {
  try {
    const db = adminClient();
    await db.from("job_runs").insert({ ...r, report_date: r.report_date ?? null, detail: r.detail.slice(0, 500) });
    await db.from("job_runs").delete().lt("at", new Date(Date.now() - 14 * 864e5).toISOString());
  } catch { /* ignore */ }
}

/** Newest runs first. */
export async function recentRuns(limit = 200): Promise<JobRun[]> {
  const { data } = await adminClient().from("job_runs").select("*").order("at", { ascending: false }).limit(limit);
  return (data ?? []) as JobRun[];
}
