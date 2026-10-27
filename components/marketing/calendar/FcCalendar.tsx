"use client";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventContentArg, EventDropArg, EventInput } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { notifications } from "@mantine/notifications";
import { addDays } from "@/lib/format";
import { colourFor, isOverdue, tint } from "@/lib/mkt";
import { moveCampaign, moveItemDate, type Result } from "@/app/(app)/marketing/actions";
import { typeIcon } from "./typeIcons";
import type { ViewKey, ViewProps } from "./types";

export type FcHandle = { prev: () => void; next: () => void; today: () => void };
type Props = ViewProps & {
  view: Extract<ViewKey, "month" | "week" | "agenda" | "year">; showItems: boolean;
  onTitle: (t: string) => void; onQuickAdd: (date: string) => void; onCreateRange: (start: string, end: string) => void;
};
const FC_VIEW = { month: "dayGridMonth", week: "dayGridWeek", agenda: "listMonth", year: "multiMonthYear" } as const;

function EventContent({ arg }: { arg: EventContentArg }) {
  const p = arg.event.extendedProps as { kind: string; colour: string; type?: string; tag?: string };
  if (arg.view.type === "multiMonthYear") return <div className="mkt-mini" style={{ background: p.colour, opacity: p.kind === "campaign" ? 1 : 0.65 }} title={arg.event.title} />;
  if (p.kind === "campaign") {
    return <div className="mkt-chip" style={{ background: tint(p.colour, 0.18), borderLeftColor: p.colour }}><span className="mkt-chip-title">{arg.event.title}</span></div>;
  }
  const Icon = typeIcon(p.type ?? "other");
  return (
    <div className="mkt-chip mkt-chip-item" style={{ background: tint(p.colour, 0.1), borderLeftColor: p.colour }}>
      <Icon size={12} style={{ flex: "none", color: p.colour }} />
      <span className="mkt-chip-tag" style={{ color: p.colour }}>{p.tag}</span>
      <span className="mkt-chip-title">{arg.event.title}</span>
    </div>
  );
}

/** Month / Week / Agenda / Year, drawn by FullCalendar with our own look. Editors can click a day, drag across days, and drag events to reschedule. */
const FcCalendar = forwardRef<FcHandle, Props>(function FcCalendar({ view, campaigns, items, owners, colourBy, canEdit, today, showItems, onSelect, onTitle, onQuickAdd, onCreateRange }, ref) {
  const cal = useRef<FullCalendar>(null);
  const router = useRouter();
  useImperativeHandle(ref, () => ({ prev: () => cal.current?.getApi().prev(), next: () => cal.current?.getApi().next(), today: () => cal.current?.getApi().today() }));
  useEffect(() => { cal.current?.getApi().changeView(FC_VIEW[view]); }, [view]);

  const events = useMemo(() => {
    const campaignOf = (id: string | null) => campaigns.find((c) => c.id === id);
    const out: EventInput[] = campaigns.map((c) => ({
      id: `c:${c.id}`, title: c.name, start: c.starts_on, end: addDays(c.ends_on, 1), allDay: true, display: "block",
      backgroundColor: c.colour, borderColor: c.colour, classNames: ["mkt-ev", ...(c.status === "cancelled" ? ["mkt-cancelled"] : [])],
      editable: canEdit, extendedProps: { kind: "campaign", id: c.id, colour: c.colour },
    }));
    if (showItems) {
      for (const i of items) {
        const colour = colourFor(colourBy, i, campaignOf(i.campaign_id), owners);
        const base = { allDay: true, display: "block" as const, backgroundColor: colour, borderColor: colour, durationEditable: false, editable: canEdit };
        if (i.due_on) out.push({ ...base, id: `d:${i.id}`, title: i.title, start: i.due_on, classNames: ["mkt-ev", ...(isOverdue(i, today) ? ["mkt-overdue"] : [])], extendedProps: { kind: "due", id: i.id, colour, type: i.type, tag: "Due" } });
        if (i.live_on) out.push({ ...base, id: `l:${i.id}`, title: i.title, start: i.live_on, classNames: ["mkt-ev"], extendedProps: { kind: "live", id: i.id, colour, type: i.type, tag: "Live" } });
      }
    }
    return out;
  }, [campaigns, items, owners, colourBy, canEdit, showItems, today]);

  const report = (r: Result) => notifications.show(r.ok
    ? { color: "brand", message: r.message, autoClose: 3000 }
    : { color: "red", title: "Couldn’t move that", message: r.message, autoClose: 8000 });
  const moved = async (info: EventDropArg | EventResizeDoneArg) => {
    const e = info.event, p = e.extendedProps as { kind: string; id: string };
    try {
      const start = e.startStr.slice(0, 10);
      const r = p.kind === "campaign"
        ? await moveCampaign(p.id, start, addDays(e.endStr ? e.endStr.slice(0, 10) : addDays(start, 1), -1))
        : await moveItemDate(p.id, p.kind === "due" ? "due_on" : "live_on", start);
      report(r);
      if (r.ok) router.refresh(); else info.revert();
    } catch { info.revert(); report({ ok: false, message: "Something went wrong." }); }
  };

  return (
    <FullCalendar
      ref={cal} plugins={[dayGridPlugin, listPlugin, multiMonthPlugin, interactionPlugin]} initialView={FC_VIEW[view]} firstDay={1} height="auto"
      headerToolbar={false} events={events} eventContent={(arg) => <EventContent arg={arg} />} datesSet={(a: DatesSetArg) => onTitle(a.view.title)}
      eventClick={(e) => { e.jsEvent.preventDefault(); onSelect({ kind: e.event.extendedProps.kind, id: e.event.extendedProps.id }); }}
      dayMaxEvents={view === "week" ? false : 4} eventDisplay="block" noEventsText="Nothing planned in this period." multiMonthMaxColumns={3} multiMonthMinWidth={260}
      editable={canEdit} selectable={canEdit} selectMinDistance={5} unselectAuto
      dateClick={(a) => canEdit && onQuickAdd(a.dateStr.slice(0, 10))}
      select={(a) => { const end = addDays(a.endStr.slice(0, 10), -1); if (a.startStr.slice(0, 10) < end) onCreateRange(a.startStr.slice(0, 10), end); }}
      eventDrop={moved} eventResize={moved}
    />
  );
});
export default FcCalendar;
