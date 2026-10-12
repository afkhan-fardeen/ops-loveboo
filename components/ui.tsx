import type { ReactNode } from "react";
import { Group, Paper, Stack, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TableScrollContainer, Text, ThemeIcon, Title } from "@mantine/core";
import { IconInbox } from "@tabler/icons-react";

export function Kpi({ label, value, note, icon }: { label: string; value: string; note?: string; icon?: ReactNode }) {
  return (
    <Paper withBorder p="md" radius="lg" shadow="xs" h="100%">
      <Stack gap={6}>
        <Group justify="space-between" wrap="nowrap" gap={4}>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: 0.4 }}>{label}</Text>
          {icon && <ThemeIcon size={28} radius="md" variant="light" aria-hidden>{icon}</ThemeIcon>}
        </Group>
        <Text fz={{ base: 24, sm: 28 }} fw={700} lh={1.2}>{value}</Text>
        {note && <Text size="sm" c="dimmed">{note}</Text>}
      </Stack>
    </Paper>
  );
}

type Col<T> = { label: string; align?: "right"; hideBelow?: "sm" | "md"; render: (r: T) => ReactNode };
export function DataTable<T>({ cols, rows, rowKey, minWidth = 420 }: { cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string; minWidth?: number }) {
  return (
    <TableScrollContainer minWidth={minWidth}>
      <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" ff="inherit">
        <TableThead>
          <TableTr>
            {cols.map((c) => <TableTh key={c.label} ta={c.align} visibleFrom={c.hideBelow}>{c.label}</TableTh>)}
          </TableTr>
        </TableThead>
        <TableTbody>
          {rows.map((r) => (
            <TableTr key={rowKey(r)}>
              {cols.map((c) => <TableTd key={c.label} ta={c.align} visibleFrom={c.hideBelow} style={c.align ? { fontVariantNumeric: "tabular-nums" } : undefined}>{c.render(r)}</TableTd>)}
            </TableTr>
          ))}
        </TableTbody>
      </Table>
    </TableScrollContainer>
  );
}

export function Section({ title, subtitle, children, flush }: { title: string; subtitle?: string; children: ReactNode; flush?: boolean }) {
  return (
    <Paper withBorder radius="lg" shadow="xs" p={flush ? 0 : "md"}>
      <Stack gap={2} p={flush ? "md" : 0} pb={flush ? "xs" : "sm"}>
        <Title order={3} size="h5">{title}</Title>
        {subtitle && <Text size="sm" c="dimmed">{subtitle}</Text>}
      </Stack>
      {children}
    </Paper>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Paper withBorder radius="lg" p="xl">
      <Stack align="center" gap="xs" ta="center">
        <ThemeIcon size={48} radius="xl" variant="light" color="gray"><IconInbox size={24} /></ThemeIcon>
        <Title order={3} size="h4">{title}</Title>
        {children && <Text c="dimmed" maw={420}>{children}</Text>}
      </Stack>
    </Paper>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
      <div>
        {eyebrow && <Text size="sm" c="dimmed">{eyebrow}</Text>}
        <Title order={1} size="h2">{title}</Title>
      </div>
      {children && <Group gap="xs">{children}</Group>}
    </Group>
  );
}
