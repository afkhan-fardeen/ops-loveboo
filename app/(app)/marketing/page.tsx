import { SimpleGrid, Stack, Text, Title } from "@mantine/core";
import CampaignCard from "@/components/marketing/CampaignCard";
import DeliverablesTable from "@/components/marketing/DeliverablesTable";
import SetupNeeded from "@/components/marketing/SetupNeeded";
import { EmptyState, Section } from "@/components/ui";
import { requireModule } from "@/lib/auth";
import { addDays, todayIn } from "@/lib/format";
import { canEditMarketing, loadMarketing } from "@/lib/marketing";
import { campaignState, isOpen, isOverdue } from "@/lib/mkt";
import { TZ } from "@/lib/timezone";

export const metadata = { title: "Marketing" };
export const dynamic = "force-dynamic";

export default async function WhatsOn() {
  const user = await requireModule("marketing");
  const { campaigns, items, owners, missing } = await loadMarketing();
  if (missing) return <SetupNeeded />;
  const canEdit = canEditMarketing(user);
  const today = todayIn(TZ), week = addDays(today, 7);

  const live = campaigns.filter((c) => c.status !== "cancelled" && campaignState(c, today) === "live");
  const upcoming = campaigns.filter((c) => c.status !== "cancelled" && campaignState(c, today) === "upcoming").slice(0, 8);
  const overdue = items.filter((i) => isOverdue(i, today));
  const dueSoon = items.filter((i) => isOpen(i.status) && i.due_on && i.due_on >= today && i.due_on <= week);
  const goingLive = items.filter((i) => i.live_on && i.live_on >= today && i.live_on <= week && i.status !== "live" && i.status !== "done");
  const table = (list: typeof items) => <DeliverablesTable items={list} campaigns={campaigns} owners={owners} canEdit={canEdit} today={today} />;

  return (
    <Stack gap="xl">
      <div>
        <Title order={1} size="h2">What’s on</Title>
        <Text c="dimmed">Campaigns and events running now and coming up, and the work due this week.</Text>
      </div>

      {campaigns.length === 0 && (
        <EmptyState title="No campaigns yet">{canEdit ? "Add the first one with “New campaign”, for example Black Friday, with its dates and markets. Then add the banners, posts and emails it needs." : "Nothing has been planned yet."}</EmptyState>
      )}

      {live.length > 0 && (
        <Stack gap="xs">
          <Title order={2} size="h4">Happening now</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>{live.map((c) => <CampaignCard key={c.id} campaign={c} items={items} today={today} />)}</SimpleGrid>
        </Stack>
      )}

      {upcoming.length > 0 && (
        <Stack gap="xs">
          <Title order={2} size="h4">Coming up</Title>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>{upcoming.map((c) => <CampaignCard key={c.id} campaign={c} items={items} today={today} />)}</SimpleGrid>
        </Stack>
      )}

      {overdue.length > 0 && <Section title={`Overdue (${overdue.length})`} subtitle="Due date has passed and the work isn’t ready yet." flush>{table(overdue)}</Section>}
      {dueSoon.length > 0 && <Section title="Due in the next 7 days" flush>{table(dueSoon)}</Section>}
      {goingLive.length > 0 && <Section title="Going live in the next 7 days" flush>{table(goingLive)}</Section>}
      {campaigns.length > 0 && !overdue.length && !dueSoon.length && !goingLive.length && <Text c="dimmed" size="sm">Nothing is due or going live in the next 7 days.</Text>}
    </Stack>
  );
}
