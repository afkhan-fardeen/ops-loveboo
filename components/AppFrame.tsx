"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ActionIcon, AppShell, Avatar, Burger, Container, Divider, Group, NavLink, ScrollArea, Stack, Text, ThemeIcon, Tooltip } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChartBar, IconFileText, IconHome2, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconSettings, IconUsers } from "@tabler/icons-react";

const Logo = () => <Image src="/logo.png" alt="Love Boo" width={92} height={29} priority />;
const WIDE = 248, RAIL = 84;

/** Sidebar layout: collapsible to an icon rail on desktop (remembered in a cookie), burger + drawer on phones. */
export default function AppFrame({ isAdmin, showSales, who, email, signOut, signOutCompact, initialCollapsed, children }: {
  isAdmin: boolean; showSales: boolean; who: string; email: string; signOut: ReactNode; signOutCompact: ReactNode; initialCollapsed: boolean; children: ReactNode;
}) {
  const path = usePathname();
  const [opened, { toggle, close }] = useDisclosure();
  const [rail, setRail] = useState(initialCollapsed);
  const link = { component: Link, onClick: close } as const;

  const toggleRail = () => {
    setRail((r) => {
      document.cookie = `sidebar=${r ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
      return !r;
    });
  };

  const railItems = [
    { href: "/", label: "Home", icon: IconHome2, on: path === "/", show: true },
    { href: "/sales", label: "Overview", icon: IconChartBar, on: path === "/sales", show: showSales },
    { href: "/sales/reports", label: "Reports", icon: IconFileText, on: path.startsWith("/sales/reports"), show: showSales },
    { href: "/sales/settings", label: "Settings", icon: IconSettings, on: path.startsWith("/sales/settings"), show: showSales && isAdmin },
    { href: "/admin/users", label: "Users", icon: IconUsers, on: path.startsWith("/admin"), show: isAdmin },
  ].filter((i) => i.show);

  const initial = (who.trim()[0] ?? "?").toUpperCase();

  const wide = (
    <>
      <AppShell.Section mb="md" visibleFrom="sm">
        <Group justify="space-between" wrap="nowrap" pl={12}>
          <Link href="/" aria-label="Love Boo Ops home"><Logo /></Link>
          <Tooltip label="Collapse sidebar" position="right" withArrow>
            <ActionIcon variant="subtle" color="gray" onClick={toggleRail} aria-label="Collapse sidebar" aria-expanded>
              <IconLayoutSidebarLeftCollapse size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea} scrollbars="y" type="never">
        <Stack gap={2}>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" pb={4} style={{ letterSpacing: 0.5 }}>Menu</Text>
          <NavLink {...link} href="/" label="Home" leftSection={<IconHome2 size={18} />} active={path === "/"} />
          {showSales && (
            <NavLink label="Sales" leftSection={<IconChartBar size={18} />} defaultOpened={path.startsWith("/sales")} active={path.startsWith("/sales")} variant="subtle" childrenOffset={28}>
              <NavLink {...link} href="/sales" label="Overview" active={path === "/sales"} />
              <NavLink {...link} href="/sales/reports" label="Reports" active={path.startsWith("/sales/reports")} />
              {isAdmin && <NavLink {...link} href="/sales/settings" label="Settings" active={path.startsWith("/sales/settings")} />}
            </NavLink>
          )}
          {isAdmin && <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" pt="md" pb={4} style={{ letterSpacing: 0.5 }}>Admin</Text>}
          {isAdmin && <NavLink {...link} href="/admin/users" label="Users" leftSection={<IconUsers size={18} />} active={path.startsWith("/admin")} />}
        </Stack>
      </AppShell.Section>

      <AppShell.Section>
        <Divider mb="sm" />
        <Stack gap="xs" px="xs">
          <Group gap="xs" wrap="nowrap">
            <Avatar color="brand" radius="xl" size="md">{initial}</Avatar>
            <div style={{ minWidth: 0 }}>
              <Text size="sm" fw={600} truncate>{who}</Text>
              <Text size="xs" c="dimmed" truncate>{isAdmin ? "Administrator" : email}</Text>
            </div>
          </Group>
          {signOut}
        </Stack>
      </AppShell.Section>
    </>
  );

  const compact = (
    <>
      <AppShell.Section mb="md">
        <Stack align="center" gap="xs">
          <Link href="/" aria-label="Love Boo Ops home" style={{ textDecoration: "none" }}><ThemeIcon size={36} radius="md" fw={800} fz={13} aria-hidden>LB</ThemeIcon></Link>
          <Tooltip label="Expand sidebar" position="right" withArrow>
            <ActionIcon variant="subtle" color="gray" onClick={toggleRail} aria-label="Expand sidebar" aria-expanded={false}>
              <IconLayoutSidebarLeftExpand size={18} />
            </ActionIcon>
          </Tooltip>
        </Stack>
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea} scrollbars="y" type="never">
        <Stack align="center" gap={6}>
          {railItems.map(({ href, label, icon: Icon, on }) => (
            <Tooltip key={href} label={label} position="right" withArrow>
              <ActionIcon component={Link} href={href} size={40} variant={on ? "light" : "subtle"} color={on ? "brand" : "gray"} aria-label={label} aria-current={on ? "page" : undefined}>
                <Icon size={20} />
              </ActionIcon>
            </Tooltip>
          ))}
        </Stack>
      </AppShell.Section>

      <AppShell.Section>
        <Divider mb="sm" />
        <Stack align="center" gap="xs">
          <Tooltip label={who} position="right" withArrow><Avatar color="brand" radius="xl" size="sm">{initial}</Avatar></Tooltip>
          {signOutCompact}
        </Stack>
      </AppShell.Section>
    </>
  );

  return (
    <>
    <a href="#main" className="skip-link">Skip to content</a>
    <AppShell
      header={{ height: { base: 56, sm: 0 } }}
      navbar={{ width: { base: WIDE, sm: rail ? RAIL : WIDE }, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding={{ base: "md", sm: "xl" }}
    >
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} size="sm" aria-label="Toggle navigation" />
          <Link href="/" onClick={close} aria-label="Love Boo Ops home"><Logo /></Link>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p={10} component="nav" aria-label="Main" withBorder={false} bg="transparent">
        <Stack gap={0} h="100%" p="md" className="sidebar-panel" hiddenFrom="sm">{wide}</Stack>
        <Stack gap={0} h="100%" p={rail ? 8 : "md"} className="sidebar-panel" visibleFrom="sm" style={{ overflow: "hidden" }}>{rail ? compact : wide}</Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size={1100} p={0} id="main">{children}</Container>
      </AppShell.Main>
    </AppShell>
    </>
  );
}
