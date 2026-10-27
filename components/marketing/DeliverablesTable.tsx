import Link from "next/link";
import { Anchor, Group, Text } from "@mantine/core";
import { DataTable } from "@/components/ui";
import { dateLabel } from "@/lib/format";
import { ITEM_TYPES, isOverdue, label, ownerName, type Campaign, type Item, type Owner } from "@/lib/mkt";
import LinkChips from "./LinkChips";
import { ItemEditor, StatusMenu } from "./Editors";

/** The deliverables as a table: due and live dates (overdue in red), owner, one-click status, Drive links, edit. */
export default function DeliverablesTable({ items, campaigns, owners, canEdit, today, showCampaign = true, back = "/marketing" }: {
  items: Item[]; campaigns: Campaign[]; owners: Owner[]; canEdit: boolean; today: string; showCampaign?: boolean; back?: string;
}) {
  const campaignName = (id: string | null) => campaigns.find((c) => c.id === id);
  const pick = campaigns.map((c) => ({ id: c.id, name: c.name }));
  return (
    <DataTable minWidth={820} rows={items} rowKey={(i) => i.id} cols={[
      { label: "Deliverable", render: (i) => (
        <div>
          <Text size="sm" fw={600}>{i.title}</Text>
          <Text size="xs" c="dimmed">{label(ITEM_TYPES, i.type)}{i.markets.length ? ` · ${i.markets.join(", ")}` : ""}</Text>
        </div>
      ) },
      ...(showCampaign ? [{ label: "Campaign", render: (i: Item) => {
        const c = campaignName(i.campaign_id);
        return c ? <Anchor component={Link} href={`/marketing/campaigns/${c.id}`} size="sm"><Group gap={6} wrap="nowrap"><span style={{ width: 10, height: 10, borderRadius: 99, background: c.colour, flex: "none" }} />{c.name}</Group></Anchor> : <Text size="sm" c="dimmed">—</Text>;
      } }] : []),
      { label: "Due", render: (i) => i.due_on ? <Text size="sm" style={{ whiteSpace: "nowrap" }} c={isOverdue(i, today) ? "red" : undefined} fw={isOverdue(i, today) ? 700 : 400}>{dateLabel(i.due_on)}{isOverdue(i, today) ? " · overdue" : ""}</Text> : <Text size="sm" c="dimmed">—</Text> },
      { label: "Goes live", render: (i) => <Text size="sm" style={{ whiteSpace: "nowrap" }} c={i.live_on ? undefined : "dimmed"}>{i.live_on ? dateLabel(i.live_on) : "—"}</Text> },
      { label: "Owner", hideBelow: "sm", render: (i) => <Text size="sm" style={{ whiteSpace: "nowrap" }} c={i.owner_id ? undefined : "dimmed"}>{ownerName(owners, i.owner_id)}</Text> },
      { label: "Status", render: (i) => <StatusMenu item={i} canEdit={canEdit} /> },
      { label: "Files", render: (i) => <LinkChips links={i.links} empty="—" /> },
      ...(canEdit ? [{ label: "", align: "right" as const, render: (i: Item) => <ItemEditor item={i} campaigns={pick} owners={owners} back={back} trigger={{ label: "Edit", size: "xs", icon: "pencil" }} /> }] : []),
    ]} />
  );
}
