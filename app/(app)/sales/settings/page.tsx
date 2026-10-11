import { Alert, Checkbox, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import RecipientsField from "@/components/RecipientsField";
import SubmitButton from "@/components/SubmitButton";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { save, testRecipients } from "./actions";

export const dynamic = "force-dynamic";

export default async function Settings() {
  await requireAdmin();
  const cfg = await getSettings();
  const sandbox = (process.env.REPORT_FROM ?? "").includes("resend.dev");
  const info = [
    ["Store", process.env.SHOPIFY_STORE_DOMAIN ?? "Not set"],
    ["Sender", process.env.REPORT_FROM ?? "Not set"],
    ["Currency", "GBP"],
    ["Store timezone", process.env.STORE_TIMEZONE ?? "Europe/London"],
    ["Send time", "08:00 Bahrain (05:00 UTC), daily, for the previous day"],
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
            <RecipientsField initial={cfg.recipients} />
            <Checkbox name="emailEnabled" label="Send the daily email" defaultChecked={cfg.emailEnabled} />
            <Checkbox name="attachExcel" label="Attach the Excel file" defaultChecked={cfg.attachExcel} />
            <Group><SubmitButton>Save settings</SubmitButton></Group>
          </Stack>
        </form>
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
