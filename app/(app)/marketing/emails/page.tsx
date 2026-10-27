import { Group, Stack, Text, Title } from "@mantine/core";
import EmailPlan from "@/components/marketing/emails/EmailPlan";
import { EmailEditor } from "@/components/marketing/emails/EmailEditor";
import PlanAhead from "@/components/marketing/emails/PlanAhead";
import SetupNeeded from "@/components/marketing/SetupNeeded";
import { EmptyState } from "@/components/ui";
import { requireModule } from "@/lib/auth";
import { todayIn } from "@/lib/format";
import { canEditMarketing, loadMarketing } from "@/lib/marketing";
import { TZ } from "@/lib/timezone";

export const metadata = { title: "Marketing · Emails" };
export const dynamic = "force-dynamic";

export default async function Emails() {
  const user = await requireModule("marketing");
  const { emails, owners, missing, emailsMissing } = await loadMarketing();
  if (missing) return <SetupNeeded />;
  if (emailsMissing) return <EmptyState title="The email plan needs one setup step">An admin needs to run <b>migrations/012_marketing_emails.sql</b> once in the ops Supabase SQL Editor. After that, this page works.</EmptyState>;
  const canEdit = canEditMarketing(user), today = todayIn(TZ);
  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Title order={1} size="h2">Emails</Title>
          <Text c="dimmed">Every send on its date, with the theme, the products to push and the copy, so we can plan ahead.</Text>
        </div>
        {canEdit && <Group gap="xs"><PlanAhead today={today} existingDates={emails.map((e) => e.send_on)} /><EmailEditor owners={owners} trigger={{ label: "Add email", variant: "filled", icon: "plus" }} /></Group>}
      </Group>
      <EmailPlan emails={emails} owners={owners} canEdit={canEdit} today={today} />
    </Stack>
  );
}
