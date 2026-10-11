"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell, Burger, Container, Divider, Group, NavLink, ScrollArea, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChartBar, IconHome2, IconUsers } from "@tabler/icons-react";

const Logo = () => <Image src="/logo.png" alt="Love Boo" width={112} height={35} priority />;

/** Sidebar layout: fixed navbar on desktop, burger + drawer on phones. */
export default function AppFrame({ isAdmin, showSales, who, signOut, children }: {
  isAdmin: boolean; showSales: boolean; who: string; signOut: ReactNode; children: ReactNode;
}) {
  const path = usePathname();
  const [opened, { toggle, close }] = useDisclosure();
  const link = { component: Link, onClick: close } as const;

  return (
    <AppShell header={{ height: { base: 56, sm: 0 } }} navbar={{ width: 248, breakpoint: "sm", collapsed: { mobile: !opened } }} padding={{ base: "md", sm: "xl" }}>
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} size="sm" aria-label="Toggle navigation" />
          <Link href="/" onClick={close} aria-label="Love Boo Ops home"><Logo /></Link>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" component="nav" aria-label="Main">
        <AppShell.Section mb="md" visibleFrom="sm">
          <Link href="/" aria-label="Love Boo Ops home" style={{ display: "inline-block", padding: "4px 12px" }}><Logo /></Link>
        </AppShell.Section>

        <AppShell.Section grow component={ScrollArea}>
          <Stack gap={2}>
            <NavLink {...link} href="/" label="Home" leftSection={<IconHome2 size={18} />} active={path === "/"} />
            {showSales && (
              <NavLink label="Sales Reporting" leftSection={<IconChartBar size={18} />} defaultOpened={path.startsWith("/sales")} active={path.startsWith("/sales")} variant="subtle" childrenOffset={28}>
                <NavLink {...link} href="/sales" label="Overview" active={path === "/sales"} />
                <NavLink {...link} href="/sales/reports" label="Reports" active={path.startsWith("/sales/reports")} />
                {isAdmin && <NavLink {...link} href="/sales/settings" label="Settings" active={path.startsWith("/sales/settings")} />}
              </NavLink>
            )}
            {isAdmin && <NavLink {...link} href="/admin/users" label="Users" leftSection={<IconUsers size={18} />} active={path.startsWith("/admin")} />}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider mb="sm" />
          <Stack gap="xs" px="xs">
            <Text size="sm" c="dimmed" truncate>{who}</Text>
            {signOut}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main bg="gray.0">
        <Container size={1100} p={0} id="main">{children}</Container>
      </AppShell.Main>
    </AppShell>
  );
}
