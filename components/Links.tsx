"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { ActionIcon, Anchor, Badge, Button, Group, Paper, Stack, Text, ThemeIcon, Title, Tooltip } from "@mantine/core";
import { IconArrowRight, IconCalendarEvent, IconChartBar, IconHeartbeat, IconSettings, IconSpeakerphone, IconUsers } from "@tabler/icons-react";

export function LinkButton({ href, children, variant = "filled" }: { href: string; children: ReactNode; variant?: string }) {
  return <Button component={Link} href={href} variant={variant}>{children}</Button>;
}

export function DownloadButton({ href, children }: { href: string; children: ReactNode }) {
  return <Button component="a" href={href} variant="default">{children}</Button>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return <Anchor component={Link} href={href} fw={500}>{children}</Anchor>;
}

const ICONS = { marketing: IconSpeakerphone, events: IconCalendarEvent, reports: IconChartBar, users: IconUsers, health: IconHeartbeat };

export function ModuleCard({ href, title, text, icon, badge, stat }: { href: string; title: string; text: string; icon: keyof typeof ICONS; badge?: string; stat?: { label: string; value: string; delta?: string; up?: boolean } }) {
  const Icon = ICONS[icon];
  return (
    <Paper component={Link} href={href} withBorder p="lg" radius="lg" shadow="xs" h="100%" className="lift" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <Stack gap="sm" h="100%">
        <Group justify="space-between">
          <ThemeIcon size={44} radius="lg" variant="light"><Icon size={24} /></ThemeIcon>
          {badge && <Badge variant="light" color="gray">{badge}</Badge>}
        </Group>
        <Title order={3} size="h4">{title}</Title>
        <Text c="dimmed" size="sm">{text}</Text>
        {stat && (
          <Paper p="sm" radius="md" bg="rgb(0 109 104 / 0.06)">
            <Text size="xs" c="dimmed">{stat.label}</Text>
            <Group gap="xs" align="baseline"><Text fw={700} fz={22}>{stat.value}</Text>{stat.delta && <Text size="sm" fw={600} c={stat.up ? "brand" : "red"}>{stat.delta}</Text>}</Group>
          </Paper>
        )}
        <Group gap={4} mt="auto" c="brand" fw={500}><Text size="sm" fw={500} c="brand">Open</Text><IconArrowRight size={16} /></Group>
      </Stack>
    </Paper>
  );
}

export function SettingsLink({ href }: { href: string }) {
  return (
    <Tooltip label="Email settings">
      <ActionIcon component={Link} href={href} variant="default" size={36} aria-label="Email settings"><IconSettings size={18} /></ActionIcon>
    </Tooltip>
  );
}
