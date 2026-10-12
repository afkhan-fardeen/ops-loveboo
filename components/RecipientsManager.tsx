"use client";
import { useEffect, useState } from "react";
import { ActionIcon, Alert, Avatar, Button, Drawer, Group, Paper, Select, Stack, Switch, Text, TextInput, Tooltip } from "@mantine/core";
import { IconAlertTriangle, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";

export type Recipient = { name: string; email: string; active: boolean };
type Candidate = { name: string | null; email: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Recipients table with name, email and an on/off switch. Edits stay local until the form's Save button is pressed. */
export default function RecipientsManager({ initial, candidates }: { initial: Recipient[]; candidates: Candidate[] }) {
  const [list, setList] = useState(initial);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(list) !== JSON.stringify(initial);
  // Warn before closing or reloading the tab with unsaved recipient changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const open = (i: number | "new") => {
    const r = i === "new" ? { name: "", email: "" } : list[i];
    setName(r.name); setEmail(r.email); setError(null); setEditing(i);
  };
  const available = candidates.filter((c) => !list.some((r) => r.email === c.email.toLowerCase()));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!EMAIL.test(addr)) return setError("Enter a valid email address.");
    if (list.some((r, i) => r.email === addr && i !== editing)) return setError("That email is already in the list.");
    if (editing === "new" && list.length >= 25) return setError("Maximum 25 recipients.");
    const next = { name: name.trim(), email: addr, active: editing === "new" ? true : list[editing as number].active };
    setList(editing === "new" ? [...list, next] : list.map((r, i) => (i === editing ? next : r)));
    setEditing(null);
  };

  return (
    <Stack gap="sm">
      <input type="hidden" name="recipients" value={JSON.stringify(list)} />
      <Group justify="space-between" wrap="wrap" gap="xs">
        <div>
          <Text fw={600}>Recipients</Text>
          <Text size="sm" c="dimmed">
            {list.filter((r) => r.active).length} active of {list.length}{dirty && " · unsaved changes, press Save settings"}
          </Text>
        </div>
        <Button type="button" variant="light" size="sm" leftSection={<IconPlus size={16} />} onClick={() => open("new")}>Add recipient</Button>
      </Group>

      {list.length === 0 && (
        <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>No recipients. The daily email won’t be sent until you add one.</Alert>
      )}

      {list.length > 0 && (
        <Paper withBorder>
          {list.map((r, i) => (
            <Group key={r.email} justify="space-between" wrap="nowrap" p="sm" px="md" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined, opacity: r.active ? 1 : 0.6 }}>
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                <Avatar color={r.active ? "brand" : "gray"} radius="xl" size="md">{(r.name || r.email)[0].toUpperCase()}</Avatar>
                <div style={{ minWidth: 0 }}>
                  <Text size="sm" fw={600} truncate>{r.name || <Text span c="dimmed" fw={400}>No name</Text>}</Text>
                  <Text size="xs" c="dimmed" truncate>{r.email}</Text>
                </div>
              </Group>
              <Group gap={4} wrap="nowrap">
                <Tooltip label={r.active ? "Receiving the report" : "Paused"}>
                  <Switch checked={r.active} onChange={(e) => { const on = e.currentTarget.checked; setList(list.map((x, j) => (j === i ? { ...x, active: on } : x))); }} aria-label={`Send to ${r.email}`} />
                </Tooltip>
                <ActionIcon type="button" variant="subtle" color="gray" onClick={() => open(i)} aria-label={`Edit ${r.email}`}><IconPencil size={16} /></ActionIcon>
                <ActionIcon type="button" variant="subtle" color="red" onClick={() => setList(list.filter((_, j) => j !== i))} aria-label={`Remove ${r.email}`}><IconTrash size={16} /></ActionIcon>
              </Group>
            </Group>
          ))}
        </Paper>
      )}

      <Drawer opened={editing !== null} onClose={() => setEditing(null)} position="right" size="min(420px, 100%)" title={<Text fw={600}>{editing === "new" ? "Add recipient" : "Edit recipient"}</Text>}>
        <form onSubmit={submit}>
          <Stack gap="md">
            {editing === "new" && available.length > 0 && (
              <Select label="Pick from portal users" placeholder="Optional" searchable clearable data={available.map((c) => ({ value: c.email, label: c.name ? `${c.name} (${c.email})` : c.email }))}
                onChange={(v) => { const c = available.find((x) => x.email === v); if (c) { setName(c.name ?? ""); setEmail(c.email); } }} />
            )}
            <TextInput label="Name" description="Used in the greeting: “Hello Ovais,”. Leave blank to use the email." value={name} onChange={(e) => setName(e.currentTarget.value)} maxLength={80} data-autofocus />
            <TextInput label="Email" type="email" required value={email} onChange={(e) => { setEmail(e.currentTarget.value); setError(null); }} error={error} />
            <Button type="submit" fullWidth>{editing === "new" ? "Add to list" : "Update"}</Button>
            <Text size="xs" c="dimmed">Changes apply when you press Save settings on the page.</Text>
          </Stack>
        </form>
      </Drawer>
    </Stack>
  );
}
