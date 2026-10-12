import { SimpleGrid, Stack } from "@mantine/core";
import { ModuleCard } from "@/components/Links";
import { PageHeader } from "@/components/ui";
import { requireModule } from "@/lib/auth";
import { rowsForSummary, summarise } from "@/lib/data";
import { dateLabel, money, pct } from "@/lib/format";
import { REPORTS } from "@/lib/modules";

export const metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function Reports() {
  await requireModule("reports");
  const s = summarise(await rowsForSummary(undefined, 10).catch(() => []));
  return (
    <Stack gap="lg">
      <PageHeader eyebrow="Pick a report" title="Reports" />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {REPORTS.map((r) => (
          <ModuleCard key={r.id} href={r.href} title={r.name} text={r.description} icon="reports"
            stat={s && r.id === "daily-sales" ? { label: `Net sales · ${dateLabel(s.row.date)}`, value: money(s.row.net_sales, s.row.currency), delta: s.vsPrev === null ? undefined : pct(s.vsPrev), up: (s.vsPrev ?? 0) >= 0 } : undefined} />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
