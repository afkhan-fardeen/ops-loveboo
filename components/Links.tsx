"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { Anchor, Badge, Button, Group, Paper, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowRight, IconChartBar, IconUsers } from "@tabler/icons-react";

export function LinkButton({ href, children, variant = "filled" }: { href: string; children: ReactNode; variant?: string }) {
  return <Button component={Link} href={href} variant={variant}>{children}</Button>;
}

export function DownloadButton({ href, children }: { href: string; children: ReactNode }) {
  return <Button component="a" href={href} variant="default">{children}</Button>;
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return <Anchor component={Link} href={href} fw={500}>{children}</Anchor>;
}

const ICONS = { sales: IconChartBar, users: IconUsers };

export function ModuleCard({ href, title, text, icon, badge }: { href: string; title: string; text: string; icon: keyof typeof ICONS; badge?: string }) {
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
        <Group gap={4} mt="auto" c="brand" fw={500}><Text size="sm" fw={500} c="brand">Open</Text><IconArrowRight size={16} /></Group>
      </Stack>
    </Paper>
  );
}
