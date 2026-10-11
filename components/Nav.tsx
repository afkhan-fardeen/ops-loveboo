"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Anchor, Box, Button, Container, Group, Tabs, TabsList, TabsTab, Text } from "@mantine/core";
import { IconChartBar } from "@tabler/icons-react";

type Item = { href: string; label: string };

const useActive = () => {
  const path = usePathname();
  return (href: string, exact = false) => (exact || href === "/" ? path === href : path.startsWith(href));
};

/** Global header: brand, section links, user slot. Links move to a second row on phones. */
export default function Nav({ items, children }: { items: Item[]; children?: ReactNode }) {
  const active = useActive();
  const links = (
    <Group gap={4} wrap="nowrap">
      {items.map((i) => (
        <Button key={i.href} component={Link} href={i.href} variant={active(i.href) ? "light" : "subtle"} color={active(i.href) ? "blue" : "gray"} size="sm" aria-current={active(i.href) ? "page" : undefined}>
          {i.label}
        </Button>
      ))}
    </Group>
  );
  return (
    <Box component="header" bg="var(--mantine-color-body)" style={{ position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid var(--mantine-color-default-border)" }}>
      <Container size={1200} px="md">
        <Group h={60} justify="space-between" wrap="nowrap">
          <Group gap="xl" wrap="nowrap">
            <Anchor component={Link} href="/" underline="never" c="inherit">
              <Group gap={8} wrap="nowrap">
                <IconChartBar size={24} color="var(--mantine-color-blue-6)" aria-hidden />
                <Text fw={700} size="lg">Love Boo Ops</Text>
              </Group>
            </Anchor>
            <Box visibleFrom="sm">{links}</Box>
          </Group>
          {children}
        </Group>
        <Box hiddenFrom="sm" pb="xs" style={{ overflowX: "auto" }}>{links}</Box>
      </Container>
    </Box>
  );
}

/** Module-level tabs. */
export function ModuleTabs({ items }: { items: Item[] }) {
  const router = useRouter();
  const active = useActive();
  const current = items.find((i) => active(i.href, i.href === items[0].href))?.href ?? items[0].href;
  return (
    <Tabs value={current} onChange={(v) => v && router.push(v)} mb="lg">
      <TabsList style={{ flexWrap: "nowrap", overflowX: "auto" }}>
        {items.map((i) => <TabsTab key={i.href} value={i.href}>{i.label}</TabsTab>)}
      </TabsList>
    </Tabs>
  );
}
