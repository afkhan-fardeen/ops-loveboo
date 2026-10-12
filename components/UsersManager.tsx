"use client";
import { useState } from "react";
import { ActionIcon, Avatar, Badge, Button, Checkbox, CopyButton, Drawer, Group, NativeSelect, Paper, PasswordInput, SegmentedControl, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconCopy, IconPlus, IconSearch, IconWand } from "@tabler/icons-react";
import SubmitButton from "./SubmitButton";

export type Profile = { id: string; email: string; name: string | null; role: "admin" | "user"; modules: string[]; active: boolean };
type Result = { ok: boolean; message: string };
type Action = (form: FormData) => Promise<Result>;

const ROLES = [{ value: "user", label: "User" }, { value: "admin", label: "Admin" }];
const genPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
};

export default function UsersManager({ users, meId, modules, createUser, updateUser, deleteUser }: {
  users: Profile[]; meId: string; modules: { id: string; name: string }[]; createUser: Action; updateUser: Action; deleteUser: Action;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [password, setPassword] = useState("");

  const shown = users.filter((u) =>
    (filter === "all" || (filter === "admin" ? u.role === "admin" : u.role === "user") ) &&
    `${u.name ?? ""} ${u.email}`.toLowerCase().includes(query.trim().toLowerCase()));

  const run = (fn: Action, after: () => void) => async (fd: FormData) => {
    const r = await fn(fd);
    notifications.show(r.ok
      ? { color: "brand", title: "Done", message: r.message, icon: <IconCheck size={18} /> }
      : { color: "red", title: "Something went wrong", message: r.message, icon: <IconAlertCircle size={18} />, autoClose: 7000 });
    if (r.ok) after();
  };

  const ModuleChecks = ({ selected }: { selected: string[] }) => (
    <Stack gap={6}>
      <Text size="sm" fw={500}>Module access</Text>
      {modules.map((m) => <Checkbox key={m.id} name="modules" value={m.id} label={m.name} defaultChecked={selected.includes(m.id)} />)}
    </Stack>
  );

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="wrap" style={{ flex: 1, minWidth: 260 }}>
          <TextInput placeholder="Search people" value={query} onChange={(e) => setQuery(e.currentTarget.value)} leftSection={<IconSearch size={16} />} style={{ flex: 1, minWidth: 180, maxWidth: 320 }} aria-label="Search people" />
          <SegmentedControl value={filter} onChange={setFilter} data={[{ value: "all", label: "All" }, { value: "admin", label: "Admins" }, { value: "user", label: "Users" }]} />
        </Group>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setPassword(""); setAdding(true); }}>Add user</Button>
      </Group>

      <Paper withBorder>
        {shown.length === 0 && <Text c="dimmed" p="lg" ta="center">No one matches that search.</Text>}
        {shown.map((u, i) => (
          <Group key={u.id} justify="space-between" wrap="nowrap" p="md" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined, cursor: "pointer" }}
            onClick={() => setEditing(u)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setEditing(u)} aria-label={`Edit ${u.name || u.email}`}>
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              <Avatar color={u.role === "admin" ? "brand" : "gray"} radius="xl">{(u.name || u.email)[0].toUpperCase()}</Avatar>
              <div style={{ minWidth: 0 }}>
                <Text fw={600} size="sm" truncate>{u.name || u.email}{u.id === meId && <Text span c="dimmed" fw={400}> (you)</Text>}</Text>
                <Text size="xs" c="dimmed" truncate>{u.name ? u.email : u.role === "admin" ? "Administrator" : "Member"}</Text>
              </div>
            </Group>
            <Group gap={6} wrap="nowrap">
              <Badge variant="light" color={u.role === "admin" ? "brand" : "gray"} visibleFrom="xs">{u.role === "admin" ? "Admin" : "User"}</Badge>
              {!u.active && <Badge variant="light" color="red">Disabled</Badge>}
              <Button variant="subtle" size="xs" visibleFrom="sm">Edit</Button>
            </Group>
          </Group>
        ))}
      </Paper>

      <Drawer opened={adding} onClose={() => setAdding(false)} position="right" size="min(440px, 100%)" title={<Text fw={600}>Add a user</Text>}>
        <form action={run(createUser, () => setAdding(false))}>
          <Stack gap="md">
            <TextInput name="name" label="Name" autoComplete="off" data-autofocus />
            <TextInput name="email" type="email" label="Email" required autoComplete="off" />
            <PasswordInput name="password" label="Password" description="At least 10 characters. Share it with them securely." required minLength={10} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
            <Group gap="xs">
              <Button variant="light" size="xs" leftSection={<IconWand size={14} />} onClick={() => setPassword(genPassword())}>Generate</Button>
              <CopyButton value={password}>{({ copied, copy }) => (
                <Tooltip label={copied ? "Copied" : "Copy password"}><ActionIcon variant="subtle" color={copied ? "brand" : "gray"} onClick={copy} disabled={!password} aria-label="Copy password">{copied ? <IconCheck size={16} /> : <IconCopy size={16} />}</ActionIcon></Tooltip>
              )}</CopyButton>
            </Group>
            <NativeSelect name="role" label="Role" data={ROLES} defaultValue="user" description="Admins manage users and settings, and can open every module." />
            <ModuleChecks selected={["reports"]} />
            <SubmitButton fullWidth>Add user</SubmitButton>
          </Stack>
        </form>
      </Drawer>

      <Drawer opened={!!editing} onClose={() => setEditing(null)} position="right" size="min(440px, 100%)" title={<Text fw={600}>{editing?.name || editing?.email}</Text>}>
        {editing && (
          <Stack gap="xl" key={editing.id}>
            <form action={run(updateUser, () => setEditing(null))}>
              <input type="hidden" name="id" value={editing.id} />
              <Stack gap="md">
                <Text size="sm" c="dimmed">{editing.email}</Text>
                <TextInput name="name" label="Name" defaultValue={editing.name ?? ""} />
                <NativeSelect name="role" label="Role" data={ROLES} defaultValue={editing.role} disabled={editing.id === meId} description={editing.id === meId ? "You can’t change your own role." : undefined} />
                <PasswordInput name="password" label="New password" description="Leave blank to keep the current one (min 10 characters)." minLength={10} autoComplete="new-password" />
                <Checkbox name="active" label="Account active" description="Disabled people can’t sign in." defaultChecked={editing.active} disabled={editing.id === meId} />
                <ModuleChecks selected={editing.modules} />
                <SubmitButton fullWidth>Save changes</SubmitButton>
              </Stack>
            </form>
            {editing.id !== meId && (
              <form action={run(deleteUser, () => setEditing(null))}>
                <input type="hidden" name="id" value={editing.id} />
                <SubmitButton variant="subtle" color="red" fullWidth confirm={`Delete ${editing.name || editing.email}? This can’t be undone.`}>Delete user</SubmitButton>
              </form>
            )}
          </Stack>
        )}
      </Drawer>
    </Stack>
  );
}
