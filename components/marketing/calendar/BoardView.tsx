"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Group, Paper, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconLink } from "@tabler/icons-react";
import { dateLabel } from "@/lib/format";
import { ITEM_STATUSES, ITEM_TYPES, colourFor, isOverdue, label, ownerName, type Item } from "@/lib/mkt";
import { setItemStatus } from "@/app/(app)/marketing/actions";
import { typeIcon } from "./typeIcons";
import type { ViewProps } from "./types";

/** Kanban board: one column per status. Editors drag a card to another column to change its status. */
export default function BoardView({ campaigns, items, owners, colourBy, canEdit, today, onSelect }: ViewProps) {
  const router = useRouter();
  const [, start] = useTransition();
  const [moved, setMoved] = useState<Record<string, string>>({});
  const [over, setOver] = useState<string | null>(null);
  useEffect(() => setMoved({}), [items]);

  const statusOf = (i: Item) => moved[i.id] ?? i.status;
  const drop = (status: string, id: string) => {
    setOver(null);
    const item = items.find((i) => i.id === id);
    if (!canEdit || !item || statusOf(item) === status) return;
    setMoved((m) => ({ ...m, [id]: status }));
    start(async () => {
      const r = await setItemStatus(id, status);
      notifications.show(r.ok ? { color: "brand", message: r.message, autoClose: 2500 } : { color: "red", title: "Couldn’t change the status", message: r.message, autoClose: 8000 });
      if (!r.ok) setMoved((m) => { const n = { ...m }; delete n[id]; return n; });
      router.refresh();
    });
  };
  const cmp = (a: Item, b: Item) => ((a.due_on ?? a.live_on ?? "9999") < (b.due_on ?? b.live_on ?? "9999") ? -1 : 1);

  return (
    <div style={{ display: "grid", gridAutoFlow: "column", gridAutoColumns: "minmax(250px, 1fr)", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
      {ITEM_STATUSES.map((s) => {
        const list = items.filter((i) => statusOf(i) === s.value).sort(cmp);
        return (
          <div key={s.value} onDragOver={(e) => { if (canEdit) { e.preventDefault(); setOver(s.value); } }} onDragLeave={() => setOver((o) => (o === s.value ? null : o))}
            onDrop={(e) => { e.preventDefault(); drop(s.value, e.dataTransfer.getData("text/plain")); }}
            style={{ background: over === s.value ? "rgb(0 109 104 / 0.08)" : "var(--mantine-color-gray-light)", borderRadius: 14, padding: 10, minHeight: 160, transition: "background .12s" }}>
            <Group justify="space-between" mb={8} px={4}><Badge variant="light" color={s.color}>{s.label}</Badge><Text size="xs" c="dimmed" fw={600}>{list.length}</Text></Group>
            <div style={{ display: "grid", gap: 8 }}>
              {list.map((i) => {
                const c = campaigns.find((x) => x.id === i.campaign_id);
                const colour = colourFor(colourBy, i, c, owners);
                const Icon = typeIcon(i.type);
                const od = isOverdue({ status: statusOf(i) as Item["status"], due_on: i.due_on }, today);
                return (
                  <Paper key={i.id} withBorder radius="md" p="sm" shadow="xs" draggable={canEdit} onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
                    onClick={() => onSelect({ kind: "due", id: i.id })} style={{ cursor: canEdit ? "grab" : "pointer", borderLeft: `4px solid ${colour}` }}>
                    <Group gap={6} wrap="nowrap" mb={4}><Icon size={14} color={colour} style={{ flex: "none" }} /><Text size="xs" c="dimmed" fw={600} truncate>{label(ITEM_TYPES, i.type)}</Text></Group>
                    <Text size="sm" fw={600} lineClamp={2} lh={1.3}>{i.title}</Text>
                    {c && <Group gap={6} mt={4} wrap="nowrap"><span style={{ width: 8, height: 8, borderRadius: 99, background: c.colour, flex: "none" }} /><Text size="xs" c="dimmed" truncate>{c.name}</Text></Group>}
                    <Group justify="space-between" mt={8} wrap="nowrap">
                      <Text size="xs" fw={od ? 700 : 500} c={od ? "red" : "dimmed"}>{i.due_on ? `Due ${dateLabel(i.due_on)}` : i.live_on ? `Live ${dateLabel(i.live_on)}` : "No date"}{od ? " · overdue" : ""}</Text>
                      <Group gap={6} wrap="nowrap">
                        {i.links.length > 0 && <Group gap={2} c="dimmed"><IconLink size={13} /><Text size="xs">{i.links.length}</Text></Group>}
                        {i.owner_id && <Avatar size={22} radius="xl" color="brand" title={ownerName(owners, i.owner_id)}>{ownerName(owners, i.owner_id)[0]?.toUpperCase()}</Avatar>}
                      </Group>
                    </Group>
                  </Paper>
                );
              })}
              {list.length === 0 && <Text size="xs" c="dimmed" ta="center" py="md">{canEdit ? "Drop a card here" : "Nothing here"}</Text>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
