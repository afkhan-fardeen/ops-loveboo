import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Group, Paper, Progress, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import DeliverablesTable from "@/components/marketing/DeliverablesTable";
import LinkChips from "@/components/marketing/LinkChips";
import SetupNeeded from "@/components/marketing/SetupNeeded";
import { CampaignEditor, ItemEditor } from "@/components/marketing/Editors";
import { EmptyState, Section } from "@/components/ui";
import { requireModule } from "@/lib/auth";
import { dateLabel, todayIn } from "@/lib/format";
import { canEditMarketing, loadMarketing } from "@/lib/marketing";
import { CAMPAIGN_STATUSES, ITEM_TYPES, KINDS, countdown, label, ownerName, campaignState } from "@/lib/mkt";
import { TZ } from "@/lib/timezone";

export const dynamic = "force-dynamic";
export async function generateMetadata() { return { title: "Marketing · Campaign" }; }

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireModule("marketing");
  const { id } = await params;
  const { campaigns, items, owners, missing } = await loadMarketing();
  if (missing) return <SetupNeeded />;
  const c = campaigns.find((x) => x.id === id);
  if (!c) notFound();

  const canEdit = canEditMarketing(user);
  const today = todayIn(TZ);
  const mine = items.filter((i) => i.campaign_id === c.id);
  const ready = mine.filter((i) => ["ready", "live", "done"].includes(i.status)).length;
  const state = campaignState(c, today);
  const status = CAMPAIGN_STATUSES.find((s) => s.value === c.status)!;
  const groups = [...ITEM_TYPES.map((t) => t.value as string), ...new Set(mine.map((i) => i.type))].filter((t, i, a) => a.indexOf(t) === i)
    .map((t) => ({ type: t, rows: mine.filter((i) => i.type === t) })).filter((g) => g.rows.length);

  return (
    <Stack gap="lg">
      <Link href="/marketing" style={{ textDecoration: "none", width: "fit-content", color: "var(--mantine-color-dimmed)" }}><Group gap={6}><IconArrowLeft size={16} /><Text size="sm">What’s on</Text></Group></Link>

      <Paper withBorder radius="lg" p={0} style={{ overflow: "hidden" }}>
        <div style={{ height: 8, background: c.colour }} />
        <Stack gap="md" p="lg">
          <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
            <div>
              <Title order={1} size="h2">{c.name}</Title>
              <Text c="dimmed">{c.starts_on === c.ends_on ? dateLabel(c.starts_on, true) : `${dateLabel(c.starts_on)} → ${dateLabel(c.ends_on, true)}`}</Text>
            </div>
            <Group gap="xs">
              <Badge size="lg" variant="light" color={state === "live" ? "teal" : state === "upcoming" ? "blue" : "gray"}>{countdown(c, today)}</Badge>
              {canEdit && <CampaignEditor campaign={c} owners={owners} trigger={{ label: "Edit", icon: "pencil" }} />}
            </Group>
          </Group>
          <Group gap={6}>
            <Badge variant="outline" color="gray">{label(KINDS, c.kind)}</Badge>
            <Badge variant="light" color={status.color}>{status.label}</Badge>
            {c.markets.map((m) => <Badge key={m} variant="light" color="gray">{m}</Badge>)}
          </Group>
          <Group gap="xl" align="flex-start">
            <div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Owner</Text><Text>{ownerName(owners, c.owner_id)}</Text></div>
            {c.offer && <div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Offer or code</Text><Text>{c.offer}</Text></div>}
          </Group>
          {c.brief && <div><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Brief</Text><Text style={{ whiteSpace: "pre-wrap" }}>{c.brief}</Text></div>}
          <div><Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>Links</Text><LinkChips links={c.links} empty="No links added yet." /></div>
          {mine.length > 0 && (
            <div>
              <Group justify="space-between" mb={4}><Text size="xs" c="dimmed" tt="uppercase" fw={700}>Progress</Text><Text size="sm">{ready} of {mine.length} deliverables ready</Text></Group>
              <Progress value={(ready / mine.length) * 100} radius="xl" color={c.colour} />
            </div>
          )}
        </Stack>
      </Paper>

      <Group justify="space-between">
        <Title order={2} size="h4">Deliverables</Title>
        {canEdit && <ItemEditor campaigns={campaigns.map((x) => ({ id: x.id, name: x.name }))} owners={owners} defaultCampaignId={c.id} back={`/marketing/campaigns/${c.id}`} trigger={{ label: "New deliverable", variant: "filled", icon: "plus" }} />}
      </Group>
      {groups.length === 0
        ? <EmptyState title="No deliverables yet">{canEdit ? "Add the banners, social posts, emails and other work this campaign needs." : "Nothing has been added yet."}</EmptyState>
        : groups.map((g) => (
          <Section key={g.type} title={`${label(ITEM_TYPES, g.type)} (${g.rows.length})`} flush>
            <DeliverablesTable items={g.rows} campaigns={campaigns} owners={owners} canEdit={canEdit} today={today} showCampaign={false} back={`/marketing/campaigns/${c.id}`} />
          </Section>
        ))}
    </Stack>
  );
}
