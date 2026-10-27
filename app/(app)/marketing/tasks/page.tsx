import { Button, Group, Stack, Text, Title } from "@mantine/core";
import DeliverablesTable from "@/components/marketing/DeliverablesTable";
import SetupNeeded from "@/components/marketing/SetupNeeded";
import { EmptyState } from "@/components/ui";
import { requireModule } from "@/lib/auth";
import { todayIn } from "@/lib/format";
import { canEditMarketing, loadMarketing } from "@/lib/marketing";
import { isOpen, type Item } from "@/lib/mkt";
import { TZ } from "@/lib/timezone";

export const metadata = { title: "Marketing · My tasks" };
export const dynamic = "force-dynamic";

const byDate = (a: Item, b: Item) => (a.due_on ?? a.live_on ?? "9999") < (b.due_on ?? b.live_on ?? "9999") ? -1 : 1;

export default async function Tasks({ searchParams }: { searchParams: Promise<{ who?: string; done?: string }> }) {
  const user = await requireModule("marketing");
  const q = await searchParams;
  const who = q.who === "all" ? "all" : "me", showDone = q.done === "1";
  const { campaigns, items, owners, missing } = await loadMarketing();
  if (missing) return <SetupNeeded />;

  const scoped = (everyone: boolean) => items.filter((i) => (everyone || i.owner_id === user.id) && (showDone || isOpen(i.status)));
  const list = scoped(who === "all").sort(byDate);
  const href = (w: string, d: boolean) => `/marketing/tasks?${new URLSearchParams({ who: w, ...(d ? { done: "1" } : {}) })}`;

  return (
    <Stack gap="lg">
      <div>
        <Title order={1} size="h2">{who === "me" ? "My tasks" : "Everyone’s tasks"}</Title>
        <Text c="dimmed">Open deliverables, soonest first.{who === "me" ? " Only the ones where you are the owner." : ""}</Text>
      </div>
      <Group gap="xs">
        <Button component="a" href={href("me", showDone)} size="xs" radius="xl" variant={who === "me" ? "filled" : "default"}>Mine ({scoped(false).length})</Button>
        <Button component="a" href={href("all", showDone)} size="xs" radius="xl" variant={who === "all" ? "filled" : "default"}>Everyone ({scoped(true).length})</Button>
        <Button component="a" href={href(who, !showDone)} size="xs" radius="xl" variant={showDone ? "filled" : "default"}>{showDone ? "Showing finished too" : "Include finished"}</Button>
      </Group>
      {list.length === 0
        ? <EmptyState title={who === "me" ? "Nothing assigned to you" : "No tasks"}>{who === "me" ? "When a deliverable is assigned to you it shows up here." : "No deliverables match."}</EmptyState>
        : <DeliverablesTable items={list} campaigns={campaigns} owners={owners} canEdit={canEditMarketing(user)} today={todayIn(TZ)} back={href(who, showDone)} />}
    </Stack>
  );
}
