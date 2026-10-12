import { SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { ModuleCard } from "@/components/Links";
import { EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { rowsForSummary, summarise, tz } from "@/lib/data";
import { dateLabel, money, pct } from "@/lib/format";
import { MODULES } from "@/lib/modules";

const greeting = () => {
  const h = Number(new Date().toLocaleString("en-GB", { hour: "numeric", hour12: false, timeZone: tz() })) % 24;
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export const metadata = { title: "Home" };

export default async function Home() {
  const user = await requireUser();
  const mine = MODULES.filter((m) => user.modules.includes(m.id));
  const sales = user.modules.includes("sales") ? summarise(await rowsForSummary(undefined, 10).catch(() => [])) : null;

  return (
    <Stack gap="xl">
      <div className="page-in">
        <Text c="dimmed">{greeting()}</Text>
        <Title order={1}>{user.name?.split(" ")[0] || user.email}</Title>
      </div>
      {mine.length === 0 && user.role !== "admin" ? (
        <EmptyState title="No modules yet">An admin hasn’t given you access to any modules. Ask them to add you.</EmptyState>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {mine.map((m) => (
            <ModuleCard key={m.id} href={m.href} title={m.name} text={m.description} icon="sales"
              stat={sales && m.id === "sales" ? { label: `Net sales · ${dateLabel(sales.row.date)}`, value: money(sales.row.net_sales, sales.row.currency), delta: sales.vsPrev === null ? undefined : pct(sales.vsPrev), up: (sales.vsPrev ?? 0) >= 0 } : undefined} />
          ))}
          {user.role === "admin" && <ModuleCard href="/admin/users" title="Users" text="Add people, set passwords and choose which modules they can open." icon="users" badge="Admin" />}
        </SimpleGrid>
      )}
    </Stack>
  );
}
