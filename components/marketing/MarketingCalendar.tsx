"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import type { EventClickArg, EventInput } from "@fullcalendar/core";
import { useMediaQuery } from "@mantine/hooks";
import { Badge, Button, Drawer, Group, Paper, Select, Stack, Switch, Text, Title } from "@mantine/core";
import { dateLabel, addDays } from "@/lib/format";
import { CAMPAIGN_STATUSES, ITEM_STATUSES, ITEM_TYPES, KINDS, campaignState, countdown, isOverdue, label, ownerName, type Campaign, type Item, type Owner } from "@/lib/mkt";
import LinkChips from "./LinkChips";
import { CampaignEditor, ItemEditor, StatusMenu } from "./Editors";

type Sel = { kind: "campaign" | "due" | "live"; id: string } | null;

/** Month calendar: campaign bands, with each deliverable marked on its due and go-live days. Click anything for the details. */
export default function MarketingCalendar({ campaigns, items, owners, canEdit, today }: { campaigns: Campaign[]; items: Item[]; owners: Owner[]; canEdit: boolean; today: string }) {
  const [f, setF] = useState({ campaign: "", type: "", status: "", owner: "", market: "" });
  const [showItems, setShowItems] = useState(true);
  const [sel, setSel] = useState<Sel>(null);
  const small = useMediaQuery("(max-width: 640px)");
  const cal = useRef<FullCalendar>(null);
  useEffect(() => { cal.current?.getApi().changeView(small ? "listMonth" : "dayGridMonth"); }, [small]);

  const markets = useMemo(() => [...new Set([...campaigns.flatMap((c) => c.markets), ...items.flatMap((i) => i.markets)])].sort(), [campaigns, items]);
  const campaignOf = (id: string | null) => campaigns.find((c) => c.id === id);

  const events = useMemo(() => {
    const campOk = (c: Campaign) => (!f.campaign || c.id === f.campaign) && (!f.market || c.markets.includes(f.market)) && (!f.owner || c.owner_id === f.owner);
    const itemOk = (i: Item) => {
      const c = campaignOf(i.campaign_id);
      return (!f.campaign || i.campaign_id === f.campaign) && (!f.type || i.type === f.type) && (!f.status || i.status === f.status)
        && (!f.owner || i.owner_id === f.owner) && (!f.market || i.markets.includes(f.market) || !!c?.markets.includes(f.market));
    };
    const out: EventInput[] = campaigns.filter(campOk).map((c) => ({
      id: `c:${c.id}`, title: c.name, start: c.starts_on, end: addDays(c.ends_on, 1), allDay: true, backgroundColor: c.colour, borderColor: c.colour,
      classNames: c.status === "cancelled" ? ["mkt-cancelled"] : [], extendedProps: { kind: "campaign", id: c.id },
    }));
    if (showItems) {
      for (const i of items.filter(itemOk)) {
        const colour = campaignOf(i.campaign_id)?.colour ?? "#5F6B69";
        if (i.due_on) out.push({ id: `d:${i.id}`, title: `Due · ${i.title}`, start: i.due_on, allDay: true, display: "list-item", color: colour, classNames: isOverdue(i, today) ? ["mkt-overdue"] : [], extendedProps: { kind: "due", id: i.id } });
        if (i.live_on) out.push({ id: `l:${i.id}`, title: `Live · ${i.title}`, start: i.live_on, allDay: true, display: "list-item", color: colour, extendedProps: { kind: "live", id: i.id } });
      }
    }
    return out;
  }, [campaigns, items, f, showItems, today]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (e: EventClickArg) => { e.jsEvent.preventDefault(); setSel({ kind: e.event.extendedProps.kind, id: e.event.extendedProps.id }); };
  const sc = sel?.kind === "campaign" ? campaigns.find((c) => c.id === sel.id) : undefined;
  const si = sel && sel.kind !== "campaign" ? items.find((i) => i.id === sel.id) : undefined;
  const sic = campaignOf(si?.campaign_id ?? null);
  const pickList = campaigns.map((c) => ({ id: c.id, name: c.name }));
  const opt = (list: readonly { value: string; label: string }[]) => list.map((x) => ({ value: x.value, label: x.label }));
  const set = (k: keyof typeof f) => (v: string | null) => setF({ ...f, [k]: v ?? "" });
  const filtered = Object.values(f).some(Boolean);

  return (
    <Stack gap="md">
      <Group gap="xs" align="flex-end" wrap="wrap">
        <Select size="xs" placeholder="All campaigns" aria-label="Campaign" data={campaigns.map((c) => ({ value: c.id, label: c.name }))} value={f.campaign || null} onChange={set("campaign")} clearable searchable w={170} />
        <Select size="xs" placeholder="All types" aria-label="Deliverable type" data={opt(ITEM_TYPES)} value={f.type || null} onChange={set("type")} clearable w={140} />
        <Select size="xs" placeholder="All statuses" aria-label="Status" data={opt(ITEM_STATUSES)} value={f.status || null} onChange={set("status")} clearable w={130} />
        <Select size="xs" placeholder="All owners" aria-label="Owner" data={owners.map((o) => ({ value: o.id, label: o.name || o.email }))} value={f.owner || null} onChange={set("owner")} clearable searchable w={150} />
        <Select size="xs" placeholder="All markets" aria-label="Market" data={markets} value={f.market || null} onChange={set("market")} clearable searchable w={140} />
        <Switch size="sm" label="Show deliverables" checked={showItems} onChange={(e) => setShowItems(e.currentTarget.checked)} />
        {filtered && <Button size="xs" variant="subtle" onClick={() => setF({ campaign: "", type: "", status: "", owner: "", market: "" })}>Clear filters</Button>}
      </Group>

      <Paper withBorder radius="lg" p="md" shadow="xs">
        <FullCalendar ref={cal} plugins={[dayGridPlugin, listPlugin]} initialView="dayGridMonth" firstDay={1} height="auto" events={events} eventClick={pick}
          headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,listMonth" }} buttonText={{ today: "Today", month: "Month", list: "List" }}
          dayMaxEvents={4} eventDisplay="block" noEventsText="Nothing planned this month." />
      </Paper>
      <Text size="xs" c="dimmed">Bands are campaigns and events. Dots are deliverables: “Due” is when the work is needed, “Live” is when it goes out. Overdue work is in red.</Text>

      <Drawer opened={!!sel && !!(sc || si)} onClose={() => setSel(null)} position="right" size="md" zIndex={250} title={<Text fw={700}>{sc ? "Campaign" : "Deliverable"}</Text>}>
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
            {canEdit && <Group mt="xs"><ItemEditor item={si} campaigns={pickList} owners={owners} back="/marketing/calendar" trigger={{ label: "Edit", icon: "pencil" }} /></Group>}
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}
