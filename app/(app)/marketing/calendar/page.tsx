import { Stack, Text, Title } from "@mantine/core";
import CalendarWorkspace from "@/components/marketing/calendar/CalendarWorkspace";
import SetupNeeded from "@/components/marketing/SetupNeeded";
import { requireModule } from "@/lib/auth";
import { todayIn } from "@/lib/format";
import { canEditMarketing, loadMarketing } from "@/lib/marketing";
import { TZ } from "@/lib/timezone";

export const metadata = { title: "Marketing · Calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requireModule("marketing");
  const { campaigns, items, emails, owners, missing } = await loadMarketing();
  if (missing) return <SetupNeeded />;
  return (
    <Stack gap="md">
      <div>
        <Title order={1} size="h2">Calendar</Title>
        <Text c="dimmed">Plan campaigns, events and deliverables. Switch between Month, Week, Agenda, Timeline, Board and Year.</Text>
      </div>
      <CalendarWorkspace campaigns={campaigns} items={items} emails={emails} owners={owners} canEdit={canEditMarketing(user)} today={todayIn(TZ)} />
    </Stack>
  );
}
