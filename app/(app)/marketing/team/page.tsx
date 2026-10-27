import { Stack, Text, Title } from "@mantine/core";
import TeamManager, { type Member } from "@/components/marketing/TeamManager";
import { requireAdmin } from "@/lib/auth";
import { normaliseModules } from "@/lib/modules";
import { adminClient } from "@/lib/supabase";

export const metadata = { title: "Marketing · Team" };
export const dynamic = "force-dynamic";

export default async function Team() {
  const me = await requireAdmin();
  const { data } = await adminClient().from("profiles").select("id,name,email,role,modules").eq("active", true).order("name");
  const members: Member[] = (data ?? []).map((p) => ({ id: p.id, name: p.name, email: p.email, role: p.role, modules: normaliseModules(p.modules) }));
  return (
    <Stack gap="md">
      <div>
        <Title order={1} size="h2">Team</Title>
        <Text c="dimmed">Add people and choose what each can do in Marketing. Only admins see this tab.</Text>
      </div>
      <TeamManager members={members} meId={me.id} />
    </Stack>
  );
}
