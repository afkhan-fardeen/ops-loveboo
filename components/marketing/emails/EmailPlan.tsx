"use client";
import { useMemo, useState } from "react";
import { Anchor, Avatar, Badge, Button, Drawer, Group, Paper, SegmentedControl, Select, Stack, Switch, Text, TextInput, Title } from "@mantine/core";
import { IconFileText, IconLink, IconSearch } from "@tabler/icons-react";
import { addDays, dateLabel } from "@/lib/format";
import { daysBetween, ownerName, productPlan, type Email, type Owner } from "@/lib/mkt";
import { setEmailStatus } from "@/app/(app)/marketing/actions";
import { StatusMenu } from "../Editors";
import LinkChips from "../LinkChips";
import { EmailEditor } from "./EmailEditor";

const weekStart = (d: string) => addDays(d, -new Date(`${d}T12:00:00Z`).getUTCDay());   // weeks run Sunday to Saturday, so a Sunday and the Thursday after it sit together
const weekLabel = (start: string, today: string) => {
  const diff = daysBetween(weekStart(today), start);
  return diff === 0 ? "This week" : diff === 7 ? "Next week" : diff === -7 ? "Last week" : `Week of ${dateLabel(start)}`;
};
const isBlank = (e: Email) => !e.name && !e.subject && e.products.length === 0 && !e.copy;

function Chips({ e, max = 5 }: { e: Email; max?: number }) {
  if (e.products.length === 0) return <Text size="xs" c="dimmed">No products yet</Text>;
  return (
    <Group gap={6}>
      {e.products.slice(0, max).map((p, i) => <Badge key={`${p.name}-${i}`} variant="light" color="teal" tt="none" size="md" title={p.note || undefined}>{p.name}</Badge>)}
      {e.products.length > max && <Badge variant="outline" color="gray" tt="none" size="md">+{e.products.length - max} more</Badge>}
    </Group>
  );
}

/** The email schedule: each send on its date, with the theme, the products to push and the copy status; plus a table of which products are planned when. */
export default function EmailPlan({ emails, owners, canEdit, today }: { emails: Email[]; owners: Owner[]; canEdit: boolean; today: string }) {
  const [tab, setTab] = useState("schedule");
  const [showPast, setShowPast] = useState(false);
  const [owner, setOwner] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [view, setView] = useState<Email | null>(null);

  const match = (e: Email) => (!owner || e.owner_id === owner) && (!q.trim() || `${e.name} ${e.subject} ${e.copy} ${e.products.map((p) => p.name).join(" ")}`.toLowerCase().includes(q.trim().toLowerCase()));
  const list = useMemo(() => emails.filter((e) => match(e) && (showPast || e.send_on >= addDays(today, -1))).sort((a, b) => (a.send_on < b.send_on ? -1 : 1)), [emails, owner, q, showPast, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const weeks = useMemo(() => {
    const m = new Map<string, Email[]>();
    for (const e of list) { const k = weekStart(e.send_on); m.set(k, [...(m.get(k) ?? []), e]); }
    return [...m.entries()];
  }, [list]);
  const products = useMemo(() => productPlan(emails, today), [emails, today]);
  const upcoming = emails.filter((e) => e.send_on >= today);
  const needs = upcoming.filter(isBlank).length;

  return (
    <Stack gap="md">
      <Group gap="xs" wrap="wrap" align="flex-end">
        <SegmentedControl value={tab} onChange={setTab} data={[{ value: "schedule", label: "Schedule" }, { value: "products", label: `Products (${products.length})` }]} />
        {tab === "schedule" && <>
          <TextInput size="xs" placeholder="Search" aria-label="Search" leftSection={<IconSearch size={14} />} value={q} onChange={(e) => setQ(e.currentTarget.value)} w={160} />
          <Select size="xs" placeholder="All owners" aria-label="Owner" data={owners.map((o) => ({ value: o.id, label: o.name || o.email }))} value={owner} onChange={setOwner} clearable searchable w={150} />
          <Switch size="sm" label="Show sent" checked={showPast} onChange={(e) => setShowPast(e.currentTarget.checked)} />
        </>}
        <Group gap={8} ml="auto">
          <Badge variant="light" color="teal" size="lg">{upcoming.length} planned</Badge>
          <Badge variant="light" color={needs ? "orange" : "gray"} size="lg">{needs} need a theme</Badge>
        </Group>
      </Group>

      {tab === "schedule" ? (
        weeks.length === 0
          ? <Paper withBorder radius="lg" p="xl" ta="center"><Text fw={600}>No emails planned yet</Text><Text c="dimmed" size="sm" mt={4}>{canEdit ? "Press “Plan ahead” to lay out every Sunday and Thursday, then add the themes and products." : "Nothing has been planned yet."}</Text></Paper>
          : weeks.map(([start, rows]) => (
            <Stack key={start} gap={8}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: 0.5 }}>{weekLabel(start, today)}</Text>
              {rows.map((e) => {
                const blank = isBlank(e), d = new Date(`${e.send_on}T12:00:00Z`);
                return (
                  <Paper key={e.id} withBorder radius="lg" p="md" shadow="xs" style={{ borderStyle: blank ? "dashed" : "solid", opacity: e.send_on < today ? 0.75 : 1 }}>
                    <Group wrap="nowrap" align="flex-start" gap="md">
                      <div style={{ width: 56, flex: "none", textAlign: "center", borderRadius: 12, padding: "6px 0", background: e.send_on === today ? "#006D68" : "var(--mantine-color-gray-light)", color: e.send_on === today ? "#fff" : undefined }}>
                        <Text size="xs" fw={700} tt="uppercase" inherit>{d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</Text>
                        <Text fz={22} fw={800} lh={1.1} inherit>{d.getUTCDate()}</Text>
                        <Text size="xs" inherit>{d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</Text>
                      </div>
                      <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                        <Group justify="space-between" wrap="wrap" gap="xs">
                          <div style={{ minWidth: 0 }}>
                            <Text fw={700} size="md" c={e.name ? undefined : "dimmed"}>{e.name || "No theme yet"}</Text>
                            {e.subject && <Text size="sm" c="dimmed" truncate>{e.subject}</Text>}
                          </div>
                          <Group gap="xs" wrap="nowrap">
                            <StatusMenu item={e} canEdit={canEdit} change={setEmailStatus} />
                            {canEdit ? <EmailEditor email={e} owners={owners} trigger={{ label: "Edit", size: "xs", icon: "pencil" }} /> : <Button size="xs" variant="default" onClick={() => setView(e)}>View</Button>}
                          </Group>
                        </Group>
                        <Chips e={e} />
                        <Group gap="md" c="dimmed">
                          <Group gap={4}><IconFileText size={14} /><Text size="xs">{e.copy ? "Copy added" : "No copy yet"}</Text></Group>
                          {e.links.length > 0 && <Group gap={4}><IconLink size={14} /><Text size="xs">{e.links.length} link{e.links.length === 1 ? "" : "s"}</Text></Group>}
                          {e.owner_id && <Group gap={4}><Avatar size={18} radius="xl" color="brand">{ownerName(owners, e.owner_id)[0]?.toUpperCase()}</Avatar><Text size="xs">{ownerName(owners, e.owner_id)}</Text></Group>}
                          {canEdit ? null : e.copy && <Anchor size="xs" component="button" type="button" onClick={() => setView(e)}>Read copy</Anchor>}
                        </Group>
                      </Stack>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          ))
      ) : (
        <Paper withBorder radius="lg" p={0} style={{ overflowX: "auto" }}>
          {products.length === 0 ? <Text c="dimmed" p="lg" ta="center">No products added to any email yet. Add them when you edit an email.</Text> : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
              <thead><tr style={{ textAlign: "left" }}>{["Product", "Planned on", "Next", "Last sent"].map((h) => <th key={h} style={{ padding: "10px 14px", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4, color: "var(--mantine-color-dimmed)", borderBottom: "1px solid var(--mantine-color-default-border)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {products.map((p) => {
                  const close = p.dates.some((d, i) => i > 0 && daysBetween(p.dates[i - 1], d) < 7);
                  return (
                    <tr key={p.key} style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
                      <td style={{ padding: "10px 14px" }}><Text fw={600} size="sm">{p.url ? <Anchor href={p.url} target="_blank" rel="noopener noreferrer" inherit>{p.name}</Anchor> : p.name}</Text>{close && <Badge size="xs" color="orange" variant="light" mt={2}>twice within a week</Badge>}</td>
                      <td style={{ padding: "10px 14px" }}><Group gap={4}>{p.dates.map((d) => <Badge key={d} variant={d < today ? "outline" : "light"} color={d < today ? "gray" : "teal"} size="sm" tt="none">{dateLabel(d)}</Badge>)}</Group></td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}><Text size="sm">{p.next ? dateLabel(p.next) : "—"}</Text></td>
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}><Text size="sm" c="dimmed">{p.last ? dateLabel(p.last) : "never"}</Text></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Paper>
      )}

      <Drawer opened={!!view} onClose={() => setView(null)} position="right" size="md" zIndex={250} title={<Text fw={700}>{view ? `Email · ${dateLabel(view.send_on, true)}` : ""}</Text>}>
        {view && (
          <Stack gap="sm">
            <Title order={3} size="h4">{view.name || "No theme yet"}</Title>
            {view.subject && <Text size="sm"><b>Subject:</b> {view.subject}</Text>}
            <Text size="sm">Owner: {ownerName(owners, view.owner_id)}</Text>
            <Chips e={view} max={30} />
            {view.products.some((p) => p.url || p.note) && <Stack gap={2}>{view.products.filter((p) => p.url || p.note).map((p, i) => <Text key={i} size="xs" c="dimmed">{p.name}{p.note ? `: ${p.note}` : ""}{p.url ? <> · <Anchor href={p.url} target="_blank" rel="noopener noreferrer" size="xs">link</Anchor></> : null}</Text>)}</Stack>}
            {view.copy && <Paper withBorder p="sm" radius="md"><Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{view.copy}</Text></Paper>}
            {view.notes && <Text size="sm" c="dimmed" style={{ whiteSpace: "pre-wrap" }}>{view.notes}</Text>}
            <LinkChips links={view.links} empty="No links." />
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}
