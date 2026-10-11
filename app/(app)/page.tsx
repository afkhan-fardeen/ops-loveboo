import { SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { ModuleCard } from "@/components/Links";
import { EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { MODULES } from "@/lib/modules";

export default async function Home() {
  const user = await requireUser();
  const mine = MODULES.filter((m) => user.modules.includes(m.id));
  return (
    <Stack gap="xl">
      <div>
        <Text c="dimmed">Welcome back</Text>
        <Title order={1}>{user.name || user.email}</Title>
      </div>
      {mine.length === 0 && user.role !== "admin" ? (
        <EmptyState title="No modules yet">An admin hasn’t given you access to any modules. Ask them to add you.</EmptyState>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {mine.map((m) => <ModuleCard key={m.id} href={m.href} title={m.name} text={m.description} icon="sales" />)}
          {user.role === "admin" && <ModuleCard href="/admin/users" title="Users" text="Add people, set passwords and choose which modules they can open." icon="users" badge="Admin" />}
        </SimpleGrid>
      )}
    </Stack>
  );
}
