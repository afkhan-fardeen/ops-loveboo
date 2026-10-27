"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionIcon, Avatar, Badge, Button, CopyButton, Drawer, Group, Paper, PasswordInput, Select, Stack, Text, TextInput, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconCopy, IconPlus, IconWand } from "@tabler/icons-react";
import { addMember, setMarketingAccess, type Result } from "@/app/(app)/marketing/team/actions";
import { MODULES } from "@/lib/modules";
import { marketingAccess } from "@/lib/mkt";

export type Member = { id: string; name: string | null; email: string; role: "admin" | "user"; modules: string[] };

const ACCESS = [
  { value: "none", label: "No access" },
  { value: "view", label: "Can view" },
  { value: "edit", label: "Can view and edit" },
];
const genPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(14)), (b) => chars[b % chars.length]).join("");
};
const toast = (r: Result) =>
  notifications.show(r.ok
    ? { color: "brand", message: r.message, icon: <IconCheck size={18} />, autoClose: 5000 }
    : { color: "red", title: "Couldn’t do that", message: r.message, icon: <IconAlertCircle size={18} />, autoClose: 9000 });

/** The people who can sign in, with their Marketing access in one dropdown, and a drawer to add someone new. */
export default function TeamManager({ members, meId }: { members: Member[]; meId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);
  const [password, setPassword] = useState("");

  const change = (id: string, level: string | null) => level && start(async () => { const r = await setMarketingAccess(id, level); toast(r); router.refresh(); });
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    start(async () => {
      const r = await addMember(form);
      toast(r);
      if (r.ok) { setCreated({ name: String(form.get("name")), email: String(form.get("email")), password: String(form.get("password")) }); router.refresh(); }
    });
  };
  const close = () => { setOpen(false); setCreated(null); setPassword(""); };
  const others = (m: Member) => MODULES.filter((x) => !("hidden" in x && x.hidden) && x.id !== "marketing" && (m.role === "admin" || m.modules.includes(x.id)));
  const signIn = "https://ops.loveboo.com/login";

  return (
    <Stack gap="md">
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text c="dimmed" size="sm" maw={560}>People who can sign in to the portal. Choose what each person can do in Marketing. Admins always can edit.</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={() => { setPassword(genPassword()); setCreated(null); setOpen(true); }}>Add member</Button>
      </Group>

      <Paper withBorder>
        {members.map((m, i) => {
          const isAdmin = m.role === "admin";
          return (
            <Group key={m.id} justify="space-between" wrap="wrap" p="md" gap="sm" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}>
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: "1 1 240px" }}>
                <Avatar color="brand" radius="xl">{(m.name || m.email)[0]?.toUpperCase()}</Avatar>
                <div style={{ minWidth: 0 }}>
                  <Group gap={6}><Text fw={600} truncate>{m.name || m.email}</Text>{isAdmin && <Badge variant="light" size="sm">Admin</Badge>}{m.id === meId && <Badge variant="outline" color="gray" size="sm">You</Badge>}</Group>
                  <Text size="sm" c="dimmed" truncate>{m.email}</Text>
                  {others(m).length > 0 && <Group gap={4} mt={4}>{others(m).map((x) => <Badge key={x.id} variant="light" color="gray" size="xs">{x.name}</Badge>)}</Group>}
                </div>
              </Group>
              {isAdmin
                ? <Badge variant="light" color="teal" size="lg">Marketing: always can edit</Badge>
                : <Select aria-label={`Marketing access for ${m.name || m.email}`} data={ACCESS} value={marketingAccess(m.modules)} onChange={(v) => change(m.id, v)} allowDeselect={false} disabled={pending} w={210} comboboxProps={{ zIndex: 400 }} />}
            </Group>
          );
        })}
      </Paper>
      <Text size="xs" c="dimmed">To disable someone, change their role, or give them Reports or Events access, use <b>Users</b> in the sidebar.</Text>

      <Drawer opened={open} onClose={close} position="right" size="md" zIndex={300} title={<Text fw={700}>{created ? "Member added" : "Add a team member"}</Text>}>
        {created ? (
          <Stack gap="md">
            <Text size="sm">{created.name} can sign in now. Share these details with them privately, since the password isn’t shown again.</Text>
            <Paper withBorder p="md" bg="var(--mantine-color-gray-0)">
              <Stack gap={4}>
                <Text size="sm"><b>Sign in:</b> {signIn}</Text>
                <Text size="sm"><b>Email:</b> {created.email}</Text>
                <Text size="sm"><b>Password:</b> {created.password}</Text>
              </Stack>
            </Paper>
            <Group>
              <CopyButton value={`Sign in: ${signIn}\nEmail: ${created.email}\nPassword: ${created.password}`}>
                {({ copied, copy }) => <Button variant="light" leftSection={<IconCopy size={16} />} onClick={copy}>{copied ? "Copied" : "Copy details"}</Button>}
              </CopyButton>
              <Button onClick={close}>Done</Button>
            </Group>
          </Stack>
        ) : (
          <form onSubmit={submit}>
            <Stack gap="sm">
              <TextInput name="name" label="Name" placeholder="e.g. Sara Ali" required data-autofocus />
              <TextInput name="email" type="email" label="Work email" placeholder="name@loveboo.com" required />
              <PasswordInput name="password" label="Password" description="At least 10 characters. Share it with them privately." required value={password} onChange={(e) => setPassword(e.currentTarget.value)}
                rightSection={<Tooltip label="Generate a strong password"><ActionIcon variant="subtle" aria-label="Generate password" onClick={() => setPassword(genPassword())}><IconWand size={16} /></ActionIcon></Tooltip>} />
              <Select name="access" label="In Marketing they can" data={ACCESS.filter((a) => a.value !== "none")} defaultValue="view" allowDeselect={false} comboboxProps={{ zIndex: 400 }} />
              <Group justify="flex-end" mt="xs"><Button variant="default" onClick={close}>Cancel</Button><Button type="submit" loading={pending}>Add member</Button></Group>
            </Stack>
          </form>
        )}
      </Drawer>
    </Stack>
  );
}
