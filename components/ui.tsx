import type { ReactNode } from "react";
import { Badge, Group, Paper, Stack, Table, TableTbody, TableTd, TableTh, TableThead, TableTr, TableScrollContainer, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowDownRight, IconArrowUpRight, IconInbox } from "@tabler/icons-react";
import { pct } from "@/lib/format";

export function Delta({ value, label }: { value: number | null; label?: string }) {
  if (value === null) return <Text size="xs" c="dimmed">{label} —</Text>;
  const up = value >= 0;
  return (
    <Group gap={6} wrap="nowrap">
      <Badge variant="light" color={up ? "teal" : "red"} leftSection={up ? <IconArrowUpRight size={12} /> : <IconArrowDownRight size={12} />}>
        {pct(value)}<span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{up ? " increase" : " decrease"}</span>
      </Badge>
      {label && <Text size="xs" c="dimmed">{label}</Text>}
    </Group>
  );
}

export function Kpi({ label, value, note, deltas }: { label: string; value: string; note?: string; deltas?: { label: string; value: number | null }[] }) {
  return (
    <Paper withBorder p="md" radius="md" shadow="xs" h="100%">
      <Stack gap={6}>
        <Text size="xs" tt="uppercase" fw={700} c="dimmed" style={{ letterSpacing: 0.4 }}>{label}</Text>
        <Text fz={{ base: 24, sm: 28 }} fw={700} lh={1.2}>{value}</Text>
        {note && <Text size="sm" c="dimmed">{note}</Text>}
        {deltas?.map((d) => <Delta key={d.label} {...d} />)}
      </Stack>
    </Paper>
  );
}

type Col<T> = { label: string; align?: "right"; render: (r: T) => ReactNode };
export function DataTable<T>({ cols, rows, rowKey, minWidth = 420 }: { cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string; minWidth?: number }) {
  return (
    <TableScrollContainer minWidth={minWidth}>
      <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" ff="inherit">
        <TableThead>
          <TableTr>
            {cols.map((c) => <TableTh key={c.label} ta={c.align}>{c.label}</TableTh>)}
          </TableTr>
        </TableThead>
        <TableTbody>
          {rows.map((r) => (
            <TableTr key={rowKey(r)}>
              {cols.map((c) => <TableTd key={c.label} ta={c.align} style={c.align ? { fontVariantNumeric: "tabular-nums" } : undefined}>{c.render(r)}</TableTd>)}
            </TableTr>
          ))}
        </TableTbody>
      </Table>
    </TableScrollContainer>
  );
}

export function Section({ title, subtitle, children, flush }: { title: string; subtitle?: string; children: ReactNode; flush?: boolean }) {
  return (
    <Paper withBorder radius="md" shadow="xs" p={flush ? 0 : "md"}>
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
    <Paper withBorder radius="md" p="xl">
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
