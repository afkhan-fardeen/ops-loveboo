import { Stack, Text, Title } from "@mantine/core";
import MarketingCalendar from "@/components/marketing/MarketingCalendar";
import SetupNeeded from "@/components/marketing/SetupNeeded";
import { requireModule } from "@/lib/auth";
import { todayIn } from "@/lib/format";
import { canEditMarketing, loadMarketing } from "@/lib/marketing";
import { TZ } from "@/lib/timezone";

export const metadata = { title: "Marketing · Calendar" };
export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await requireModule("marketing");
  const { campaigns, items, owners, missing } = await loadMarketing();
  if (missing) return <SetupNeeded />;
  return (
    <Stack gap="md">
      <div>
        <Title order={1} size="h2">Calendar</Title>
        <Text c="dimmed">Every campaign and event, with the deliverables due and going live.</Text>
      </div>
      <MarketingCalendar campaigns={campaigns} items={items} owners={owners} canEdit={canEditMarketing(user)} today={todayIn(TZ)} />
    </Stack>
  );
}
