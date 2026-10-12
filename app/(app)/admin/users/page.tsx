import { SimpleGrid, Stack } from "@mantine/core";
import { IconShieldCheck, IconUserOff, IconUsers } from "@tabler/icons-react";
import UsersManager, { type Profile } from "@/components/UsersManager";
import { Kpi, PageHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { MODULES, normaliseModules } from "@/lib/modules";
import { adminClient } from "@/lib/supabase";
import { createUser, deleteUser, updateUser } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Users" };

export default async function Users() {
  const me = await requireAdmin();
  const users = (((await adminClient().from("profiles").select("*").order("created_at")).data as Profile[] | null) ?? []).map((u) => ({ ...u, modules: normaliseModules(u.modules) }));
  return (
    <Stack gap="lg">
      <PageHeader title="Users" eyebrow="Who can sign in and what they can open" />
      <SimpleGrid cols={{ base: 3 }} spacing={{ base: "xs", sm: "md" }}>
        <Kpi icon={<IconUsers size={18} />} label="People" value={String(users.length)} />
        <Kpi icon={<IconShieldCheck size={18} />} label="Admins" value={String(users.filter((u) => u.role === "admin").length)} />
        <Kpi icon={<IconUserOff size={18} />} label="Disabled" value={String(users.filter((u) => !u.active).length)} />
      </SimpleGrid>
      <UsersManager users={users} meId={me.id} modules={MODULES.map((m) => ({ id: m.id, name: m.name }))} createUser={createUser} updateUser={updateUser} deleteUser={deleteUser} />
    </Stack>
  );
}
