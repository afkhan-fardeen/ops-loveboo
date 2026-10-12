import { Checkbox, Paper, Stack } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import RecipientsManager from "@/components/RecipientsManager";
import SubmitButton from "@/components/SubmitButton";
import { PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { adminClient } from "@/lib/supabase";
import { save } from "./actions";

export const metadata = { title: "Daily Sales · Email settings" };
export const dynamic = "force-dynamic";

export default async function Settings() {
  await requireAdmin();
  const [cfg, users] = await Promise.all([
    getSettings(),
    adminClient().from("profiles").select("name,email").eq("active", true).order("name").then((r) => (r.data ?? []) as { name: string | null; email: string }[]),
  ]);
  return (
    <Stack gap="lg" maw={720}>
      <PageHeader title="Email settings" eyebrow="Daily Sales · who gets the daily email, and when" />
      <Paper withBorder p="lg">
        <form action={save}>
          <Stack gap="md">
            <RecipientsManager initial={cfg.recipients} candidates={users} />
            <TimeInput name="sendTime" label="Send time" required defaultValue={cfg.sendTime} maw={180} description="Bahrain time (GMT+3). The previous day’s report goes out at the first check after this time." />
            <Checkbox name="emailEnabled" label="Send the daily email" defaultChecked={cfg.emailEnabled} />
            <Checkbox name="attachExcel" label="Attach the Excel file" defaultChecked={cfg.attachExcel} />
            <div><SubmitButton>Save settings</SubmitButton></div>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
