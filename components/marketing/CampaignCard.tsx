import Link from "next/link";
import { Badge, Group, Paper, Progress, Stack, Text } from "@mantine/core";
import { dateLabel } from "@/lib/format";
import { KINDS, CAMPAIGN_STATUSES, campaignState, countdown, label, type Campaign, type Item } from "@/lib/mkt";

/** One campaign as a card: colour bar, countdown, dates, markets, offer and how many deliverables are ready. */
export default function CampaignCard({ campaign: c, items, today }: { campaign: Campaign; items: Item[]; today: string }) {
  const mine = items.filter((i) => i.campaign_id === c.id);
  const ready = mine.filter((i) => ["ready", "live", "done"].includes(i.status)).length;
  const state = campaignState(c, today);
  const status = CAMPAIGN_STATUSES.find((s) => s.value === c.status)!;
  return (
    <Paper component={Link} href={`/marketing/campaigns/${c.id}`} withBorder radius="lg" shadow="xs" p={0} className="lift" style={{ textDecoration: "none", color: "inherit", overflow: "hidden", display: "block" }}>
      <div style={{ height: 6, background: c.colour }} />
      <Stack gap={8} p="md">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Text fw={700} lh={1.25}>{c.name}</Text>
          <Badge variant="light" color={state === "live" ? "teal" : state === "upcoming" ? "blue" : "gray"} style={{ flex: "none" }}>{countdown(c, today)}</Badge>
        </Group>
        <Text size="sm" c="dimmed">
          {c.starts_on === c.ends_on ? dateLabel(c.starts_on, true) : `${dateLabel(c.starts_on)} → ${dateLabel(c.ends_on, true)}`}
        </Text>
        <Group gap={6}>
          <Badge variant="outline" size="sm" color="gray">{label(KINDS, c.kind)}</Badge>
          {c.status !== "planned" && <Badge variant="light" size="sm" color={status.color}>{status.label}</Badge>}
          {c.markets.slice(0, 4).map((m) => <Badge key={m} variant="light" size="sm" color="gray">{m}</Badge>)}
          {c.markets.length > 4 && <Badge variant="light" size="sm" color="gray">+{c.markets.length - 4}</Badge>}
        </Group>
        {c.offer && <Text size="sm" fw={500}>{c.offer}</Text>}
        {mine.length > 0 ? (
          <div>
            <Group justify="space-between" mb={4}><Text size="xs" c="dimmed">Deliverables</Text><Text size="xs" c="dimmed">{ready} of {mine.length} ready</Text></Group>
            <Progress value={(ready / mine.length) * 100} size="sm" radius="xl" color={c.colour} />
          </div>
        ) : <Text size="xs" c="dimmed">No deliverables yet</Text>}
      </Stack>
    </Paper>
  );
}
