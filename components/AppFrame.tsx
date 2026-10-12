"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ActionIcon, AppShell, Avatar, Box, Divider, Drawer, Group, NavLink, ScrollArea, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from "@mantine/core";
import { IconFileText, IconHome2, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconSettings, IconUser, IconUsers } from "@tabler/icons-react";

const Logo = () => <Image src="/logo.png" alt="Love Boo" width={92} height={29} priority />;
const WIDE = 248, RAIL = 84;

/**
 * Desktop: collapsible sidebar (remembered in a cookie).
 * Phone: app-style layout with a slim top bar (logo + account) and a bottom tab bar; the sidebar is not used.
 */
export default function AppFrame({ isAdmin, showReports, who, email, signOut, signOutCompact, initialCollapsed, children }: {
  isAdmin: boolean; showReports: boolean; who: string; email: string; signOut: ReactNode; signOutCompact: ReactNode; initialCollapsed: boolean; children: ReactNode;
}) {
  const path = usePathname();
  const [rail, setRail] = useState(initialCollapsed);
  const [sheet, setSheet] = useState(false);
  const link = { component: Link } as const;

  const toggleRail = () => {
    setRail((r) => {
      document.cookie = `sidebar=${r ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
      return !r;
    });
  };

  const railItems = [
    { href: "/", label: "Home", icon: IconHome2, on: path === "/", show: true },
    { href: "/reports/daily-sales", label: "Reports", icon: IconFileText, on: path.startsWith("/reports"), show: showReports },
    { href: "/admin/users", label: "Users", icon: IconUsers, on: path.startsWith("/admin"), show: isAdmin },
  ].filter((i) => i.show);

  // Phone tab bar: the everyday places, plus Account (opens a sheet with Sign out).
  const tabs = railItems.map((i) => ({ ...i, label: i.label }));

  const initial = (who.trim()[0] ?? "?").toUpperCase();

  const wide = (
    <>
      <AppShell.Section mb="md">
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
          {showReports && <NavLink {...link} href="/reports/daily-sales" label="Reports" leftSection={<IconFileText size={18} />} active={path.startsWith("/reports")} />}
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
        footer={{ height: { base: "calc(62px + env(safe-area-inset-bottom, 0px))", sm: 0 } }}
        navbar={{ width: rail ? RAIL : WIDE, breakpoint: "sm", collapsed: { mobile: true } }}
        padding={{ base: "md", sm: "xl" }}
      >
        {/* Phone: top app bar */}
        <AppShell.Header hiddenFrom="sm">
          <Group h="100%" px="md" justify="space-between" wrap="nowrap">
            <Link href="/" aria-label="Love Boo Ops home"><Logo /></Link>
            <UnstyledButton onClick={() => setSheet(true)} aria-label="Account" style={{ lineHeight: 0 }}>
              <Avatar color="brand" radius="xl" size={36}>{initial}</Avatar>
            </UnstyledButton>
          </Group>
        </AppShell.Header>

        {/* Desktop: collapsible sidebar */}
        <AppShell.Navbar p={10} component="nav" aria-label="Main" withBorder={false} bg="transparent" visibleFrom="sm">
          <Stack gap={0} h="100%" p={rail ? 8 : "md"} className="sidebar-panel" style={{ overflow: "hidden" }}>{rail ? compact : wide}</Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Container id="main">{children}</Container>
        </AppShell.Main>

        {/* Phone: bottom tab bar */}
        <AppShell.Footer hiddenFrom="sm" component="nav" aria-label="Main" className="tabbar">
          {tabs.map(({ href, label, icon: Icon, on }) => (
            <Link key={href} href={href} className="tab" data-active={on || undefined} aria-current={on ? "page" : undefined}>
              <span className="tab-icon"><Icon size={22} stroke={on ? 2.2 : 1.7} /></span>
              <span className="tab-label">{label}</span>
            </Link>
          ))}
          <button type="button" className="tab" data-active={sheet || undefined} onClick={() => setSheet(true)} aria-haspopup="dialog">
            <span className="tab-icon"><IconUser size={22} stroke={sheet ? 2.2 : 1.7} /></span>
            <span className="tab-label">Account</span>
          </button>
        </AppShell.Footer>
      </AppShell>

      {/* Phone: account sheet */}
      <Drawer opened={sheet} onClose={() => setSheet(false)} position="bottom" size="auto" radius="lg" withCloseButton={false} hiddenFrom="sm" zIndex={300}
        styles={{ content: { borderTopLeftRadius: 20, borderTopRightRadius: 20 }, body: { paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" } }}>
        <Box w={40} h={4} mx="auto" mb="md" style={{ borderRadius: 4, background: "var(--mantine-color-gray-4)" }} aria-hidden />
        <Group gap="sm" mb="md" wrap="nowrap">
          <Avatar color="brand" radius="xl" size={46}>{initial}</Avatar>
          <div style={{ minWidth: 0 }}>
            <Text fw={600} truncate>{who}</Text>
            <Text size="sm" c="dimmed" truncate>{email}</Text>
          </div>
        </Group>
        <Stack gap={4} mb="md">
          {showReports && isAdmin && (
            <NavLink {...link} href="/reports/daily-sales/settings" label="Email settings" leftSection={<IconSettings size={18} />} onClick={() => setSheet(false)} active={path.startsWith("/reports/daily-sales/settings")} />
          )}
        </Stack>
        {signOut}
      </Drawer>
    </>
  );
}

// Page content wrapper (kept local so the file stays self-contained).
function Container({ id, children }: { id: string; children: ReactNode }) {
  return <Box id={id} maw={1100} mx="auto">{children}</Box>;
}
