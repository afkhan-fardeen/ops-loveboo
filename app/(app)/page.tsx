import { SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { ModuleCard } from "@/components/Links";
import { EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { TZ } from "@/lib/timezone";
import { MODULES } from "@/lib/modules";

export const metadata = { title: "Home" };

const greeting = async () => {
  const h = Number(new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: TZ })) % 24;
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default async function Home() {
  const user = await requireUser();
  const mine = MODULES.filter((m) => user.modules.includes(m.id) && !("hidden" in m && m.hidden));
  return (
    <Stack gap="xl">
      <div className="page-in">
        <Text c="dimmed">{await greeting()}</Text>
        <Title order={1}>{user.name?.split(" ")[0] || user.email}</Title>
      </div>
      {mine.length === 0 && user.role !== "admin" ? (
        <EmptyState title="No modules yet">An admin hasn’t given you access to any modules. Ask them to add you.</EmptyState>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {mine.map((m) => <ModuleCard key={m.id} href={m.href} title={m.name} text={m.description} icon={m.id === "events" ? "events" : m.id === "marketing" ? "marketing" : "reports"} />)}
          {user.role === "admin" && <ModuleCard href="/admin/users" title="Users" text="Add people, set passwords and choose which modules they can open." icon="users" badge="Admin" />}
          {user.role === "admin" && <ModuleCard href="/admin/health" title="System health" text="Is the scheduler running? See recent runs, yesterday’s report and email status." icon="health" badge="Admin" />}
        </SimpleGrid>
      )}
    </Stack>
  );
}
