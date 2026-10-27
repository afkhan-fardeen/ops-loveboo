"use client";
import { useEffect, useMemo, useRef } from "react";
import { Text, Tooltip } from "@mantine/core";
import { addDays, dateLabel } from "@/lib/format";
import { addMonths, campaignState, colourFor, daysBetween, isOverdue, monthStart, tint, xOf, type Campaign, type Item } from "@/lib/mkt";
import type { ViewProps } from "./types";

export type Scale = "weeks" | "months";
const LABEL_W = 200, ROW_H = 58;
export const timelineRange = (anchor: string, scale: Scale) => {
  const start = monthStart(anchor);
  const end = scale === "weeks" ? addDays(addMonths(start, 3), -1) : addDays(addMonths(start, 12), -1);
  return { start, end, days: daysBetween(start, end) + 1, px: scale === "weeks" ? 22 : 7 };
};

/** Gantt-style timeline: one row per campaign (a bar across its dates) with its deliverables as markers underneath. */
export default function TimelineView({ campaigns, items, owners, colourBy, today, onSelect, anchor, scale }: ViewProps & { anchor: string; scale: Scale }) {
  const { start, end, days, px } = timelineRange(anchor, scale);
  const scroller = useRef<HTMLDivElement>(null);
  const width = days * px;

  useEffect(() => {
    if (!scroller.current) return;
    scroller.current.scrollLeft = today >= start && today <= end ? Math.max(0, xOf(today, start, px) - 120) : 0;
  }, [start, end, today, px]);

  // months across the top
  const months = useMemo(() => {
    const out: { key: string; label: string; x: number; w: number }[] = [];
    for (let m = start; m <= end; m = addMonths(m, 1)) {
      const next = addMonths(m, 1), last = next > addDays(end, 1) ? addDays(end, 1) : next;
      out.push({ key: m, label: new Date(`${m}T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }), x: xOf(m, start, px), w: daysBetween(m, last) * px });
    }
    return out;
  }, [start, end, px]);
  const weeks = useMemo(() => {
    const out: { date: string; x: number }[] = [];
    let d = start; while (new Date(`${d}T12:00:00Z`).getUTCDay() !== 1) d = addDays(d, 1);
    for (; d <= end; d = addDays(d, 7)) out.push({ date: d, x: xOf(d, start, px) });
    return out;
  }, [start, end, px]);

  const inWindow = (a: string, b: string) => a <= end && b >= start;
  const rows = campaigns.filter((c) => inWindow(c.starts_on, c.ends_on)).sort((a, b) => (a.starts_on < b.starts_on ? -1 : 1));
  const byCampaign = (id: string | null) => items.filter((i) => i.campaign_id === id && ((i.due_on && i.due_on >= start && i.due_on <= end) || (i.live_on && i.live_on >= start && i.live_on <= end)));
  const loose = byCampaign(null);
  const todayX = today >= start && today <= end ? xOf(today, start, px) + px / 2 : null;
  const grid = { backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${px * 7 - 1}px, var(--mantine-color-default-border) ${px * 7 - 1}px, var(--mantine-color-default-border) ${px * 7}px)`, backgroundPosition: `${xOf(weeks[0]?.date ?? start, start, px)}px 0` };

  const Marker = ({ item, campaign }: { item: Item; campaign?: Campaign }) => {
    const colour = colourFor(colourBy, item, campaign, owners);
    const pts = [item.due_on && { date: item.due_on, tag: "Due", kind: "due" as const }, item.live_on && { date: item.live_on, tag: "Live", kind: "live" as const }].filter(Boolean) as { date: string; tag: string; kind: "due" | "live" }[];
    return <>{pts.filter((p) => p.date >= start && p.date <= end).map((p) => (
      <Tooltip key={p.kind} label={`${p.tag} · ${item.title} · ${dateLabel(p.date)}`} withArrow>
        <button type="button" aria-label={`${p.tag}: ${item.title}`} onClick={() => onSelect({ kind: p.kind, id: item.id })}
          style={{ position: "absolute", left: xOf(p.date, start, px) + px / 2 - 7, top: 0, width: 14, height: 14, borderRadius: p.kind === "live" ? 99 : 4, cursor: "pointer", padding: 0,
            background: p.kind === "live" ? colour : "var(--mantine-color-body)", border: `2.5px solid ${isOverdue(item, today) && p.kind === "due" ? "#C92A2A" : colour}`, transform: p.kind === "due" ? "rotate(45deg)" : undefined }} />
      </Tooltip>
    ))}</>;
  };

  return (
    <div ref={scroller} style={{ overflowX: "auto", border: "1px solid var(--mantine-color-default-border)", borderRadius: 14, background: "var(--mantine-color-body)" }}>
      <div style={{ width: LABEL_W + width, position: "relative" }}>
        {/* header */}
        <div style={{ display: "flex", position: "sticky", top: 0, zIndex: 3, background: "var(--mantine-color-body)", borderBottom: "1px solid var(--mantine-color-default-border)" }}>
          <div style={{ width: LABEL_W, flex: "none", position: "sticky", left: 0, zIndex: 4, background: "var(--mantine-color-body)", padding: "10px 14px", borderRight: "1px solid var(--mantine-color-default-border)" }}><Text size="xs" fw={700} c="dimmed" tt="uppercase">Campaign</Text></div>
          <div style={{ position: "relative", width, height: 44 }}>
            {months.map((m) => <div key={m.key} style={{ position: "absolute", left: m.x, width: m.w, top: 0, padding: "6px 8px", fontSize: 12, fontWeight: 700, borderLeft: "1px solid var(--mantine-color-default-border)", whiteSpace: "nowrap", overflow: "hidden" }}>{m.label}</div>)}
            {weeks.map((w) => <div key={w.date} style={{ position: "absolute", left: w.x, top: 26, fontSize: 10, color: "var(--mantine-color-dimmed)", paddingLeft: 3 }}>{scale === "weeks" ? new Date(`${w.date}T12:00:00Z`).getUTCDate() : ""}</div>)}
          </div>
        </div>

        {/* rows */}
        {rows.length === 0 && loose.length === 0 && <Text c="dimmed" ta="center" p="xl" style={{ position: "sticky", left: 0, width: "min(100vw - 64px, 640px)" }}>Nothing planned in this window. Use the arrows to look at other months.</Text>}
        {rows.map((c) => {
          const lo = xOf(c.starts_on < start ? start : c.starts_on, start, px), hi = xOf(addDays(c.ends_on > end ? end : c.ends_on, 1), start, px);
          const live = campaignState(c, today) === "live";
          return (
            <div key={c.id} style={{ display: "flex", height: ROW_H, borderBottom: "1px solid var(--mantine-color-default-border)" }}>
              <button type="button" onClick={() => onSelect({ kind: "campaign", id: c.id })} style={{ width: LABEL_W, flex: "none", position: "sticky", left: 0, zIndex: 2, background: "var(--mantine-color-body)", border: 0, borderRight: "1px solid var(--mantine-color-default-border)", padding: "8px 14px", textAlign: "left", cursor: "pointer" }}>
                <Text size="sm" fw={700} truncate style={{ textDecoration: c.status === "cancelled" ? "line-through" : undefined }}>{c.name}</Text>
                <Text size="xs" c="dimmed" truncate>{live ? "Live now · " : ""}{dateLabel(c.starts_on)}{c.starts_on !== c.ends_on ? ` → ${dateLabel(c.ends_on)}` : ""}</Text>
              </button>
              <div style={{ position: "relative", width, ...grid }}>
                {(() => {
                  const w = Math.max(hi - lo, 10), narrow = w < 90;
                  return (
                    <>
                      <button type="button" onClick={() => onSelect({ kind: "campaign", id: c.id })} aria-label={`${c.name} campaign`}
                        style={{ position: "absolute", left: lo, width: w, top: 8, height: 24, borderRadius: 8, border: 0, borderLeft: `4px solid ${c.colour}`, background: tint(c.colour, 0.22), cursor: "pointer", textAlign: "left", padding: "0 8px", overflow: "hidden", opacity: c.status === "cancelled" ? 0.5 : 1 }}>
                        {!narrow && <span style={{ fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", color: "var(--mantine-color-text)" }}>{c.name}</span>}
                      </button>
                      {narrow && <span style={{ position: "absolute", left: lo + w + 6, top: 12, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", pointerEvents: "none", color: "var(--mantine-color-text)" }}>{c.name}</span>}
                    </>
                  );
                })()}
                <div style={{ position: "absolute", left: 0, right: 0, top: 38 }}>{byCampaign(c.id).map((i) => <Marker key={i.id} item={i} campaign={c} />)}</div>
              </div>
            </div>
          );
        })}
        {loose.length > 0 && (
          <div style={{ display: "flex", height: 44, borderBottom: "1px solid var(--mantine-color-default-border)" }}>
            <div style={{ width: LABEL_W, flex: "none", position: "sticky", left: 0, zIndex: 2, background: "var(--mantine-color-body)", borderRight: "1px solid var(--mantine-color-default-border)", padding: "12px 14px" }}><Text size="sm" c="dimmed">Not in a campaign</Text></div>
            <div style={{ position: "relative", width, ...grid }}><div style={{ position: "absolute", left: 0, right: 0, top: 15 }}>{loose.map((i) => <Marker key={i.id} item={i} />)}</div></div>
          </div>
        )}
        {todayX !== null && <div aria-hidden style={{ position: "absolute", left: LABEL_W + todayX, top: 44, bottom: 0, width: 2, background: "#006D68", opacity: 0.7, zIndex: 1, pointerEvents: "none" }} />}
      </div>
    </div>
  );
}
