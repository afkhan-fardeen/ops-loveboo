"use client";
import Link from "next/link";
import { Badge, Button, Drawer, Group, Stack, Text, Title } from "@mantine/core";
import { dateLabel } from "@/lib/format";
import { CAMPAIGN_STATUSES, ITEM_TYPES, KINDS, campaignState, countdown, isOverdue, label, ownerName, type Campaign, type Email, type Item, type Owner } from "@/lib/mkt";
import LinkChips from "../LinkChips";
import { CampaignEditor, ItemEditor, StatusMenu } from "../Editors";
import { EmailEditor } from "../emails/EmailEditor";
import { setEmailStatus } from "@/app/(app)/marketing/actions";
import type { Sel } from "./types";

/** Side panel with the details of whatever was clicked, plus Edit for people who can. */
export default function DetailDrawer({ sel, onClose, campaigns, items, emails, owners, canEdit, today }: {
  sel: Sel; onClose: () => void; campaigns: Campaign[]; items: Item[]; emails: Email[]; owners: Owner[]; canEdit: boolean; today: string;
}) {
  const se = sel?.kind === "email" ? emails.find((e) => e.id === sel.id) : undefined;
  const sc = sel?.kind === "campaign" ? campaigns.find((c) => c.id === sel.id) : undefined;
  const si = sel && sel.kind !== "campaign" && sel.kind !== "email" ? items.find((i) => i.id === sel.id) : undefined;
  const sic = campaigns.find((c) => c.id === si?.campaign_id);
  const pick = campaigns.map((c) => ({ id: c.id, name: c.name }));
  return (
    <Drawer opened={!!(sc || si || se)} onClose={onClose} position="right" size="md" zIndex={250} title={<Text fw={700}>{sc ? "Campaign" : se ? "Email" : "Deliverable"}</Text>}>
      {se && (
        <Stack gap="sm">
          <Title order={3} size="h4">{se.name || "No theme yet"}</Title>
          <Text c="dimmed">{dateLabel(se.send_on, true)}</Text>
          <Group gap={6}><Badge variant="outline" color="gray">Email</Badge><StatusMenu item={se} canEdit={canEdit} change={setEmailStatus} /></Group>
          {se.subject && <Text size="sm"><b>Subject:</b> {se.subject}</Text>}
          <Text size="sm">Owner: {ownerName(owners, se.owner_id)}</Text>
          {se.products.length > 0 ? <Group gap={6}>{se.products.map((p, i) => <Badge key={i} variant="light" color="teal" tt="none" size="md">{p.name}</Badge>)}</Group> : <Text size="sm" c="dimmed">No products yet.</Text>}
          {se.copy && <Text size="sm" style={{ whiteSpace: "pre-wrap" }} lineClamp={8}>{se.copy}</Text>}
          <LinkChips links={se.links} empty="No links." />
          <Group mt="xs"><Button component={Link} href="/marketing/emails">Open email plan</Button>{canEdit && <EmailEditor email={se} owners={owners} trigger={{ label: "Edit", icon: "pencil" }} />}</Group>
        </Stack>
      )}
      {sc && (
        <Stack gap="sm">
          <Group gap={8} wrap="nowrap"><span style={{ width: 12, height: 12, borderRadius: 99, background: sc.colour, flex: "none" }} /><Title order={3} size="h4">{sc.name}</Title></Group>
          <Text c="dimmed">{sc.starts_on === sc.ends_on ? dateLabel(sc.starts_on, true) : `${dateLabel(sc.starts_on)} → ${dateLabel(sc.ends_on, true)}`}</Text>
          <Group gap={6}>
            <Badge variant="light" color={campaignState(sc, today) === "live" ? "teal" : "blue"}>{countdown(sc, today)}</Badge>
            <Badge variant="outline" color="gray">{label(KINDS, sc.kind)}</Badge>
            <Badge variant="light" color={CAMPAIGN_STATUSES.find((s) => s.value === sc.status)?.color}>{label(CAMPAIGN_STATUSES, sc.status)}</Badge>
            {sc.markets.map((m) => <Badge key={m} variant="light" color="gray">{m}</Badge>)}
          </Group>
          <Text size="sm">Owner: {ownerName(owners, sc.owner_id)}</Text>
          {sc.offer && <Text size="sm" fw={500}>{sc.offer}</Text>}
          {sc.brief && <Text size="sm" style={{ whiteSpace: "pre-wrap" }} lineClamp={8}>{sc.brief}</Text>}
          <LinkChips links={sc.links} empty="No links." />
          <Group mt="xs"><Button component={Link} href={`/marketing/campaigns/${sc.id}`}>Open campaign</Button>{canEdit && <CampaignEditor campaign={sc} owners={owners} trigger={{ label: "Edit", icon: "pencil" }} />}</Group>
        </Stack>
      )}
      {si && (
        <Stack gap="sm">
          <Title order={3} size="h4">{si.title}</Title>
          <Group gap={6}><Badge variant="outline" color="gray">{label(ITEM_TYPES, si.type)}</Badge><StatusMenu item={si} canEdit={canEdit} />{si.markets.map((m) => <Badge key={m} variant="light" color="gray">{m}</Badge>)}</Group>
          {sic && <Text size="sm">Campaign: <Link href={`/marketing/campaigns/${sic.id}`}>{sic.name}</Link></Text>}
          <Text size="sm" c={isOverdue(si, today) ? "red" : undefined} fw={isOverdue(si, today) ? 700 : 400}>Due: {si.due_on ? dateLabel(si.due_on, true) : "not set"}{isOverdue(si, today) ? " · overdue" : ""}</Text>
          <Text size="sm">Goes live: {si.live_on ? dateLabel(si.live_on, true) : "not set"}</Text>
          <Text size="sm">Owner: {ownerName(owners, si.owner_id)}</Text>
          {si.notes && <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{si.notes}</Text>}
          <LinkChips links={si.links} empty="No files linked yet." />
          {canEdit && <Group mt="xs"><ItemEditor item={si} campaigns={pick} owners={owners} back="/marketing/calendar" trigger={{ label: "Edit", icon: "pencil" }} /></Group>}
        </Stack>
      )}
    </Drawer>
  );
}
