import { Alert, Badge, Group, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import { IconAlertTriangle, IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import RunCheckButton from "@/components/RunCheckButton";
import { DataTable, PageHeader, Section } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { ago, clock, healthChecks, overall, type Status } from "@/lib/health";
import { runCheckNow } from "./actions";

export const metadata = { title: "System health" };
export const dynamic = "force-dynamic";

const COLOR: Record<Status, string> = { ok: "teal", warn: "yellow", bad: "red" };
const ICON = { ok: IconCircleCheck, warn: IconAlertTriangle, bad: IconCircleX };
const HEADLINE: Record<Status, string> = { ok: "Everything is working", warn: "Working, with something to check", bad: "Something needs attention" };
const OUTCOME_COLOR: Record<string, string> = { emailed: "teal", loaded: "blue", skipped: "gray", manual: "grape", error: "red" };
const SOURCE: Record<string, string> = { github: "GitHub scheduler", vercel: "Vercel Cron", manual: "Manual" };

export default async function Health() {
  await requireAdmin();
  const { checks, runs } = await healthChecks();
  const status = overall(checks);
  const Icon = ICON[status];

  return (
    <Stack gap="lg">
      <PageHeader eyebrow="Admin" title="System health"><RunCheckButton action={runCheckNow} /></PageHeader>

      <Alert color={COLOR[status]} icon={<Icon size={20} />} title={HEADLINE[status]} variant="light">
        {status === "ok" ? "The scheduler is running, yesterday’s report is stored and the email is on track." : "See the items below marked in yellow or red."}
      </Alert>

      <Paper withBorder p={0}>
        {checks.map((c, i) => {
          const I = ICON[c.status];
          return (
            <Group key={c.label} wrap="nowrap" align="flex-start" gap="md" p="md" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}>
              <ThemeIcon variant="light" color={COLOR[c.status]} size={34} radius="xl"><I size={18} /></ThemeIcon>
              <div style={{ minWidth: 0 }}>
                <Text fw={600} size="sm">{c.label}</Text>
                <Text size="sm" c="dimmed">{c.detail}</Text>
              </div>
            </Group>
          );
        })}
      </Paper>

      <Section title="Recent runs" subtitle="Every call of the scheduled job, newest first (kept for 14 days). Times are Bahrain time." flush>
        {runs.length === 0 ? <Text c="dimmed" p="md">No runs recorded yet. The scheduler will appear here after its next check.</Text> : (
          <DataTable minWidth={520} rows={runs.slice(0, 25)} rowKey={(r) => String(r.id)} cols={[
            { label: "When", render: (r) => <div><Text size="sm" fw={500}>{clock(r.at)}</Text><Text size="xs" c="dimmed">{ago(r.at)}</Text></div> },
            { label: "From", render: (r) => <Text size="sm">{SOURCE[r.source] ?? r.source}</Text> },
            { label: "Result", render: (r) => <Badge variant="light" color={OUTCOME_COLOR[r.outcome] ?? "gray"}>{r.outcome}</Badge> },
            { label: "Details", render: (r) => <Text size="sm" c={r.outcome === "error" ? "red" : "dimmed"}>{r.detail || "—"}{r.report_date ? ` (${r.report_date})` : ""}</Text> },
          ]} />
        )}
      </Section>
    </Stack>
  );
}
