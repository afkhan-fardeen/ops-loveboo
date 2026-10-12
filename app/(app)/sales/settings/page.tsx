import { Alert, Checkbox, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import { IconAlertTriangle } from "@tabler/icons-react";
import RecipientsManager from "@/components/RecipientsManager";
import SubmitButton from "@/components/SubmitButton";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings, lastTick } from "@/lib/settings";
import { SEND_TZ } from "@/lib/schedule";
import { adminClient } from "@/lib/supabase";
import { save, testRecipients } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function Settings() {
  await requireAdmin();
  const [cfg, users, tick, last] = await Promise.all([
    getSettings(),
    adminClient().from("profiles").select("name,email").eq("active", true).order("name").then((r) => (r.data ?? []) as { name: string | null; email: string }[]),
    lastTick(),
    adminClient().from("daily_sales").select("date,emailed_at").not("emailed_at", "is", null).order("emailed_at", { ascending: false }).limit(1).then((r) => r.data?.[0] ?? null),
  ]);
  const ago = (iso: string) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)); return m < 2 ? "just now" : m < 90 ? `${m} min ago` : m < 2880 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`; };
  const sentAt = last?.emailed_at ? new Date(last.emailed_at).toLocaleString("en-GB", { timeZone: SEND_TZ, weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false }) : null;
  const sandbox = (process.env.REPORT_FROM ?? "").includes("resend.dev");
  const info = [
    ["Store", process.env.SHOPIFY_STORE_DOMAIN ?? "Not set"],
    ["Sender", process.env.REPORT_FROM ?? "Not set"],
    ["Currency", "GBP"],
    ["Store timezone", process.env.STORE_TIMEZONE ?? "Europe/London"],
  ];
  return (
    <Stack gap="lg" maw={720}>
      <PageHeader title="Settings" eyebrow="Daily email recipients and options. Admins only." />

      {sandbox && (
        <Alert color="yellow" icon={<IconAlertTriangle size={18} />} title="Emails only reach one person right now">
          The sender is Resend’s test address (<b>onboarding@resend.dev</b>), which can only deliver to the Resend account owner (fardeen@loveboo.com). To email anyone else, verify loveboo.com at resend.com/domains, then set <b>REPORT_FROM</b> to an address on it (for example reports@loveboo.com) in Vercel and redeploy.
        </Alert>
      )}

      <Paper withBorder radius="lg" shadow="xs" p="lg">
        <form action={save}>
          <Stack gap="md">
            <RecipientsManager initial={cfg.recipients} candidates={users} />
            <TimeInput name="sendTime" label="Send time" required defaultValue={cfg.sendTime} maw={180}
              description="Bahrain time (GMT+3). The previous day’s report goes out at the first check after this time." />
            <Checkbox name="emailEnabled" label="Send the daily email" defaultChecked={cfg.emailEnabled} />
            <Checkbox name="attachExcel" label="Attach the Excel file" defaultChecked={cfg.attachExcel} />
            <Group><SubmitButton>Save settings</SubmitButton></Group>
          </Stack>
        </form>
      </Paper>

      <Paper withBorder radius="lg" shadow="xs" p="lg">
        <Stack gap={6}>
          <Text fw={600} size="sm">Schedule status</Text>
          <Text size="sm">Daily at <b>{cfg.sendTime}</b> Bahrain time, for the previous day{cfg.emailEnabled ? "" : " (currently switched off)"}.</Text>
          <Text size="sm" c="dimmed">Last email: {last ? `report for ${last.date}, sent ${sentAt}` : "none yet"}</Text>
          <Text size="sm" c="dimmed">Scheduler last checked in: {tick ? ago(tick) : "never"}</Text>
          {(!tick || Date.now() - new Date(tick).getTime() > 2 * 3600_000) && (
            <Alert color="yellow" icon={<IconAlertTriangle size={18} />}>
              The scheduler hasn’t checked in for over two hours, so the send time can only be as precise as Vercel’s once-a-day cron. For exact times, add the GitHub secrets <b>APP_URL</b> and <b>CRON_SECRET</b> (see README), which checks every 15 minutes.
            </Alert>
          )}
        </Stack>
      </Paper>

      <Paper withBorder radius="lg" shadow="xs" p="lg">
        <form action={testRecipients}>
          <Group justify="space-between" wrap="wrap" gap="sm">
            <div>
              <Text fw={600} size="sm">Send a test to everyone</Text>
              <Text size="sm" c="dimmed">Sends the latest report to each saved recipient and tells you exactly who it reached.</Text>
            </div>
            <SubmitButton variant="default">Send test</SubmitButton>
          </Group>
        </form>
      </Paper>

      <Paper withBorder radius="lg" shadow="xs" p="lg">
        <Stack gap="sm">
          {info.map(([k, v], i) => (
            <div key={k}>
              {i > 0 && <Divider mb="sm" />}
              <Group justify="space-between" align="flex-start" wrap="wrap" gap={4}>
                <Text c="dimmed" size="sm">{k}</Text>
                <Text fw={500} size="sm">{v}</Text>
              </Group>
            </div>
          ))}
          <Text size="xs" c="dimmed">These come from Vercel environment variables and the cron schedule.</Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
