import { Accordion, AccordionControl, AccordionItem, AccordionPanel, Badge, Checkbox, Group, NativeSelect, Paper, PasswordInput, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import SubmitButton from "@/components/SubmitButton";
import { PageHeader, Section } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { MODULES } from "@/lib/modules";
import { adminClient } from "@/lib/supabase";
import { createUser, deleteUser, updateUser } from "./actions";

export const dynamic = "force-dynamic";

type Profile = { id: string; email: string; name: string | null; role: "admin" | "user"; modules: string[]; active: boolean };
const ROLES = [{ value: "user", label: "User" }, { value: "admin", label: "Admin" }];

function Modules({ selected = [] }: { selected?: string[] }) {
  return (
    <Stack gap={6}>
      <Text size="sm" fw={500}>Module access</Text>
      {MODULES.map((m) => <Checkbox key={m.id} name="modules" value={m.id} label={m.name} defaultChecked={selected.includes(m.id)} />)}
    </Stack>
  );
}

export default async function Users() {
  const me = await requireAdmin();
  const users = ((await adminClient().from("profiles").select("*").order("created_at")).data as Profile[] | null) ?? [];

  return (
    <Stack gap="lg">
      <PageHeader title="Users" eyebrow="Add people, set their password and choose which modules they can open." />

      <Section title="Add a user">
        <form action={createUser}>
          <Stack gap="md">
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput name="name" label="Name" autoComplete="off" />
              <TextInput name="email" type="email" label="Email" required autoComplete="off" />
              <PasswordInput name="password" label="Password" description="Minimum 8 characters" required minLength={8} autoComplete="new-password" />
              <NativeSelect name="role" label="Role" data={ROLES} defaultValue="user" />
            </SimpleGrid>
            <Modules selected={["sales"]} />
            <Group><SubmitButton>Add user</SubmitButton></Group>
          </Stack>
        </form>
      </Section>

      <Section title={`People (${users.length})`} flush>
        <Accordion variant="contained" radius={0} styles={{ root: { borderLeft: 0, borderRight: 0, borderBottom: 0 } }}>
          {users.map((u) => (
            <AccordionItem key={u.id} value={u.id}>
              <AccordionControl>
                <Group justify="space-between" wrap="nowrap" pr="sm">
                  <div style={{ minWidth: 0 }}>
                    <Text fw={500} truncate>{u.name || u.email}{u.id === me.id && " (you)"}</Text>
                    {u.name && <Text size="sm" c="dimmed" truncate>{u.email}</Text>}
                  </div>
                  <Group gap={6} wrap="nowrap">
                    <Badge variant="light" color={u.role === "admin" ? "blue" : "gray"}>{u.role === "admin" ? "Admin" : "User"}</Badge>
                    {!u.active && <Badge variant="light" color="red">Disabled</Badge>}
                  </Group>
                </Group>
              </AccordionControl>
              <AccordionPanel>
                <Stack gap="md">
                  <form action={updateUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <Stack gap="md">
                      <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput name="name" label="Name" defaultValue={u.name ?? ""} />
                        <NativeSelect name="role" label="Role" data={ROLES} defaultValue={u.role} disabled={u.id === me.id} />
                        <PasswordInput name="password" label="New password" description="Leave blank to keep the current one" minLength={8} autoComplete="new-password" />
                        <Checkbox name="active" label="Account active" defaultChecked={u.active} disabled={u.id === me.id} mt={{ base: 0, sm: 34 }} />
                      </SimpleGrid>
                      <Modules selected={u.modules} />
                      <Group><SubmitButton>Save changes</SubmitButton></Group>
                    </Stack>
                  </form>
                  {u.id !== me.id && (
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={u.id} />
                      <SubmitButton variant="subtle" color="red" size="xs" confirm={`Delete ${u.name || u.email}? This can’t be undone.`}>Delete this user</SubmitButton>
                    </form>
                  )}
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>
    </Stack>
  );
}
