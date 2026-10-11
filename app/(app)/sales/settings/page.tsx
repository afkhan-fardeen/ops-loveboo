import { Alert, Button, Checkbox, Divider, Group, Paper, Stack, Text, Textarea } from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { save } from "./actions";

export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string; err?: string }> }) {
  await requireAdmin();
  const { saved, err } = await searchParams;
  const cfg = await getSettings();
  const info = [
    ["Store", process.env.SHOPIFY_STORE_DOMAIN ?? "Not set"],
    ["Currency", "GBP"],
    ["Store timezone", process.env.STORE_TIMEZONE ?? "Europe/London"],
    ["Send time", "08:00 Bahrain (05:00 UTC), daily, for the previous day"],
  ];
  return (
    <Stack gap="lg" maw={720}>
      <PageHeader title="Settings" eyebrow="Daily email recipients and options. Admins only." />

      {saved && <Alert color="teal" icon={<IconCheck size={18} />}>Settings saved.</Alert>}
      {err && <Alert color="red" icon={<IconAlertCircle size={18} />}>{err}</Alert>}

      <Paper withBorder radius="md" shadow="xs" p="lg">
        <form action={save}>
          <Stack gap="md">
            <Textarea name="recipients" label="Recipients" autosize minRows={4} defaultValue={cfg.recipients.join("\n")} spellCheck={false}
              placeholder={"name@loveboo.com\nanother@loveboo.com"}
              description="One email per line (commas work too). Until loveboo.com is verified in Resend, only the Resend account owner’s address will receive mail." />
            <Checkbox name="emailEnabled" label="Send the daily email" defaultChecked={cfg.emailEnabled} />
            <Checkbox name="attachExcel" label="Attach the Excel file" defaultChecked={cfg.attachExcel} />
            <Group><Button type="submit">Save settings</Button></Group>
          </Stack>
        </form>
      </Paper>

      <Paper withBorder radius="md" shadow="xs" p="lg">
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
