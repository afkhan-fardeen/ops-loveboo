"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { ActionIcon, Badge, Button, Group, Modal, Paper, SegmentedControl, Select, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { IconChevronLeft, IconChevronRight, IconSearch } from "@tabler/icons-react";
import { addDays, dateLabel } from "@/lib/format";
import { COLOUR_BY, ITEM_STATUSES, ITEM_TYPES, addMonths, campaignState, isOpen, isOverdue, monthStart, type Campaign, type ColourBy, type Item, type Owner } from "@/lib/mkt";
import { CampaignEditor, ItemEditor } from "../Editors";
import BoardView from "./BoardView";
import DetailDrawer from "./DetailDrawer";
import FcCalendar, { type FcHandle } from "./FcCalendar";
import TimelineView, { timelineRange, type Scale } from "./TimelineView";
import { VIEWS, type Sel, type ViewKey } from "./types";

type Filters = { campaign: string; type: string; status: string; owner: string; market: string; q: string };
const NONE: Filters = { campaign: "", type: "", status: "", owner: "", market: "", q: "" };
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const put = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

/** The planning workspace: six ways to look at the same plan, shared filters, colour options, and quick actions for editors. */
export default function CalendarWorkspace({ campaigns, items, owners, canEdit, today }: { campaigns: Campaign[]; items: Item[]; owners: Owner[]; canEdit: boolean; today: string }) {
  const small = useMediaQuery("(max-width: 640px)");
  const [view, setView] = useState<ViewKey>("month");
  const [f, setF] = useState<Filters>(NONE);
  const [colourBy, setColourBy] = useState<ColourBy>("campaign");
  const [showItems, setShowItems] = useState(true);
  const [sel, setSel] = useState<Sel>(null);
  const [title, setTitle] = useState("");
  const [anchor, setAnchor] = useState(monthStart(today));
  const [scale, setScale] = useState<Scale>("weeks");
  const [quick, setQuick] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ kind: "campaign" | "item"; prefill: Record<string, string>; key: number } | null>(null);
  const fc = useRef<FcHandle>(null);

  useEffect(() => {
    const v = get("mkt_view") as ViewKey | null, c = get("mkt_colour") as ColourBy | null;
    if (v && VIEWS.some((x) => x.value === v)) setView(v); else if (window.matchMedia("(max-width: 640px)").matches) setView("agenda");
    if (c && COLOUR_BY.some((x) => x.value === c)) setColourBy(c);
  }, []);
  const changeView = (v: string) => { setView(v as ViewKey); put("mkt_view", v); };
  const changeColour = (v: string | null) => { if (v) { setColourBy(v as ColourBy); put("mkt_colour", v); } };

  const markets = useMemo(() => [...new Set([...campaigns.flatMap((c) => c.markets), ...items.flatMap((i) => i.markets)])].sort(), [campaigns, items]);
  const { fCampaigns, fItems } = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const cOf = (id: string | null) => campaigns.find((c) => c.id === id);
    const campOk = (c: Campaign) => (!f.campaign || c.id === f.campaign) && (!f.market || c.markets.includes(f.market)) && (!f.owner || c.owner_id === f.owner)
      && (!q || `${c.name} ${c.offer} ${c.markets.join(" ")}`.toLowerCase().includes(q));
    const itemOk = (i: Item) => {
      const c = cOf(i.campaign_id);
      return (!f.campaign || i.campaign_id === f.campaign) && (!f.type || i.type === f.type) && (!f.status || i.status === f.status) && (!f.owner || i.owner_id === f.owner)
        && (!f.market || i.markets.includes(f.market) || !!c?.markets.includes(f.market)) && (!q || `${i.title} ${i.notes} ${c?.name ?? ""} ${i.markets.join(" ")}`.toLowerCase().includes(q));
    };
    return { fCampaigns: campaigns.filter(campOk), fItems: items.filter(itemOk) };
  }, [campaigns, items, f]);

  const week = addDays(today, 7);
  const stats = {
    live: campaigns.filter((c) => c.status !== "cancelled" && campaignState(c, today) === "live").length,
    due: items.filter((i) => isOpen(i.status) && i.due_on && i.due_on >= today && i.due_on <= week).length,
    overdue: items.filter((i) => isOverdue(i, today)).length,
  };
  const filtered = Object.values(f).some(Boolean);
  const set = (k: keyof Filters) => (v: string | null) => setF({ ...f, [k]: v ?? "" });
  const opt = (list: readonly { value: string; label: string }[]) => list.map((x) => ({ value: x.value, label: x.label }));

  const isFc = view === "month" || view === "week" || view === "agenda" || view === "year";
  const range = timelineRange(anchor, scale);
  const monthLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
  const heading = isFc ? title : view === "timeline" ? `${monthLabel(range.start)} – ${monthLabel(range.end)}` : `Board · ${fItems.length} deliverable${fItems.length === 1 ? "" : "s"}`;
  const step = scale === "weeks" ? 1 : 6;
  const nav = (dir: -1 | 1) => (isFc ? (dir < 0 ? fc.current?.prev() : fc.current?.next()) : setAnchor(addMonths(anchor, dir * step)));
  const goToday = () => (isFc ? fc.current?.today() : setAnchor(monthStart(today)));
  const pick = campaigns.map((c) => ({ id: c.id, name: c.name }));
  const open = (kind: "campaign" | "item", prefill: Record<string, string>) => { setQuick(null); setEditor({ kind, prefill, key: Date.now() }); };

  const shared = { campaigns: fCampaigns, items: fItems, owners, colourBy, canEdit, today, onSelect: setSel };

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Group gap="xs" wrap="nowrap">
          {view !== "board" && <>
            <ActionIcon variant="default" size="lg" aria-label="Previous" onClick={() => nav(-1)}><IconChevronLeft size={18} /></ActionIcon>
            <ActionIcon variant="default" size="lg" aria-label="Next" onClick={() => nav(1)}><IconChevronRight size={18} /></ActionIcon>
            <Button variant="default" onClick={goToday}>Today</Button>
          </>}
          <Title order={2} size="h4" ml={6}>{heading}</Title>
        </Group>
        <Group gap="sm">
          {view === "timeline" && <SegmentedControl size="xs" value={scale} onChange={(v) => setScale(v as Scale)} data={[{ value: "weeks", label: "3 months" }, { value: "months", label: "12 months" }]} />}
          {small
            ? <Select aria-label="View" value={view} onChange={(v) => v && changeView(v)} data={opt(VIEWS)} allowDeselect={false} w={130} />
            : <SegmentedControl value={view} onChange={changeView} data={opt(VIEWS)} />}
        </Group>
      </Group>

      <Group gap="xs" wrap="wrap" align="flex-end">
        <TextInput size="xs" placeholder="Search" aria-label="Search" leftSection={<IconSearch size={14} />} value={f.q} onChange={(e) => setF({ ...f, q: e.currentTarget.value })} w={150} />
        <Select size="xs" placeholder="All campaigns" aria-label="Campaign" data={campaigns.map((c) => ({ value: c.id, label: c.name }))} value={f.campaign || null} onChange={set("campaign")} clearable searchable w={160} />
        <Select size="xs" placeholder="All types" aria-label="Deliverable type" data={opt(ITEM_TYPES)} value={f.type || null} onChange={set("type")} clearable w={130} />
        <Select size="xs" placeholder="All statuses" aria-label="Status" data={opt(ITEM_STATUSES)} value={f.status || null} onChange={set("status")} clearable w={125} />
        <Select size="xs" placeholder="All owners" aria-label="Owner" data={owners.map((o) => ({ value: o.id, label: o.name || o.email }))} value={f.owner || null} onChange={set("owner")} clearable searchable w={140} />
        <Select size="xs" placeholder="All markets" aria-label="Market" data={markets} value={f.market || null} onChange={set("market")} clearable searchable w={130} />
        {filtered && <Button size="xs" variant="subtle" onClick={() => setF(NONE)}>Clear</Button>}
        <Group gap="md" ml="auto">
          <Select size="xs" label="Colour by" aria-label="Colour deliverables by" data={opt(COLOUR_BY)} value={colourBy} onChange={changeColour} allowDeselect={false} w={115} />
          {isFc && <Switch size="sm" label="Deliverables" checked={showItems} onChange={(e) => setShowItems(e.currentTarget.checked)} />}
        </Group>
      </Group>

      <Group gap={8}>
        <Badge variant="light" color="teal" size="lg">{stats.live} live now</Badge>
        <Badge variant="light" color="blue" size="lg">{stats.due} due in 7 days</Badge>
        <Badge variant="light" color={stats.overdue ? "red" : "gray"} size="lg">{stats.overdue} overdue</Badge>
        {canEdit && isFc && view !== "agenda" && <Text size="xs" c="dimmed" ml="xs">Click a day to add. Drag across days to create a campaign. Drag anything to reschedule.</Text>}
      </Group>

      {isFc
        ? <Paper withBorder radius="lg" p="sm" shadow="xs"><FcCalendar ref={fc} view={view as "month" | "week" | "agenda" | "year"} {...shared} showItems={showItems} onTitle={setTitle}
            onQuickAdd={setQuick} onCreateRange={(a, b) => open("campaign", { starts_on: a, ends_on: b })} /></Paper>
        : view === "timeline" ? <TimelineView {...shared} anchor={anchor} scale={scale} /> : <BoardView {...shared} />}

      <Text size="xs" c="dimmed">
        {view === "timeline"
          ? "Bars are campaigns. Diamonds are due dates, dots are go-live dates; a red outline means overdue. Today is the green line."
          : view === "board" ? "Cards are deliverables, grouped by status." + (canEdit ? " Drag a card to another column to change its status." : "")
          : "Bands are campaigns and events. Small chips are deliverables: Due is when the work is needed, Live is when it goes out. Overdue work is in red."}
      </Text>

      <DetailDrawer sel={sel} onClose={() => setSel(null)} campaigns={campaigns} items={items} owners={owners} canEdit={canEdit} today={today} />

      <Modal opened={!!quick} onClose={() => setQuick(null)} title={<Text fw={700}>{quick ? dateLabel(quick, true) : ""}</Text>} size="sm" centered zIndex={300}>
        <Stack gap="xs">
          <Button variant="default" onClick={() => open("item", { due_on: quick! })}>New deliverable due this day</Button>
          <Button variant="default" onClick={() => open("item", { live_on: quick! })}>New deliverable going live this day</Button>
          <Button onClick={() => open("campaign", { starts_on: quick!, ends_on: quick! })}>New campaign starting this day</Button>
        </Stack>
      </Modal>
      {editor?.kind === "campaign" && <CampaignEditor key={editor.key} owners={owners} prefill={editor.prefill} controlled={{ open: true, onClose: () => setEditor(null) }} />}
      {editor?.kind === "item" && <ItemEditor key={editor.key} campaigns={pick} owners={owners} prefill={editor.prefill} back="/marketing/calendar" controlled={{ open: true, onClose: () => setEditor(null) }} />}
    </Stack>
  );
}
