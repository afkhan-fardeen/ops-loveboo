"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActionIcon, AppShell, Avatar, Badge, Box, Divider, Drawer, Group, NavLink, ScrollArea, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from "@mantine/core";
import { IconArrowLeft, IconCalendarEvent, IconChevronRight, IconFileText, IconHeartbeat, IconHome2, IconLayoutSidebarLeftCollapse, IconLayoutSidebarLeftExpand, IconSettings, IconUser, IconUsers, IconX } from "@tabler/icons-react";

const Logo = () => <Image src="/logo.png" alt="Love Boo" width={92} height={29} priority />;
const WIDE = 248, RAIL = 84;

/** Phone screens: a title for the app bar, and (for sub-screens) where Back goes. Everything else is a tab root. */
const SCREENS: { match: (p: string) => boolean; title: string | null; back?: string }[] = [
  { match: (p) => p === "/", title: null },
  { match: (p) => p === "/reports/daily-sales/settings", title: "Email settings", back: "/reports/daily-sales" },
  { match: (p) => p.startsWith("/reports"), title: "Daily Sales" },
  { match: (p) => p.startsWith("/events"), title: "Events" },
  { match: (p) => p.startsWith("/admin/health"), title: "System health" },
  { match: (p) => p.startsWith("/admin"), title: "Users" },
];

/**
 * Desktop: collapsible sidebar (remembered in a cookie).
 * Phone: app layout. Bottom tabs for the main places, an app bar (logo or title, Back on sub-screens, account button),
 * and an account sheet that closes with its button, a swipe down, a tap outside, Escape, or by navigating.
 */
export default function AppFrame({ isAdmin, showReports, showEvents, who, email, signOut, signOutCompact, initialCollapsed, children }: {
  isAdmin: boolean; showReports: boolean; showEvents: boolean; who: string; email: string; signOut: ReactNode; signOutCompact: ReactNode; initialCollapsed: boolean; children: ReactNode;
}) {
  const path = usePathname();
  const [rail, setRail] = useState(initialCollapsed);
  const [sheet, setSheet] = useState(false);
  const link = { component: Link } as const;

  // Account sheet: close on navigation; swipe down to dismiss.
  useEffect(() => setSheet(false), [path]);
  const startY = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const touch = {
    onTouchStart: (e: React.TouchEvent) => { startY.current = e.touches[0].clientY; },
    onTouchMove: (e: React.TouchEvent) => { if (startY.current !== null) setDrag(Math.max(0, e.touches[0].clientY - startY.current)); },
    onTouchEnd: () => { if (drag > 70) setSheet(false); setDrag(0); startY.current = null; },
  };

  const toggleRail = () => {
    setRail((r) => {
      document.cookie = `sidebar=${r ? "open" : "collapsed"}; path=/; max-age=31536000; samesite=lax`;
      return !r;
    });
  };

  const railItems = [
    { href: "/", label: "Home", icon: IconHome2, on: path === "/", show: true },
    { href: "/reports/daily-sales", label: "Reports", icon: IconFileText, on: path.startsWith("/reports"), show: showReports },
    { href: "/events", label: "Events", icon: IconCalendarEvent, on: path.startsWith("/events"), show: showEvents },
    { href: "/admin/users", label: "Users", icon: IconUsers, on: path.startsWith("/admin") && !path.startsWith("/admin/health"), show: isAdmin },
    { href: "/admin/health", label: "System health", icon: IconHeartbeat, on: path.startsWith("/admin/health"), show: isAdmin },
  ].filter((i) => i.show);

  const screen = SCREENS.find((s) => s.match(path)) ?? SCREENS[0];
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
          {showEvents && <NavLink {...link} href="/events" label="Events" leftSection={<IconCalendarEvent size={18} />} active={path.startsWith("/events")} />}
          {isAdmin && <Text size="xs" tt="uppercase" fw={700} c="dimmed" px="sm" pt="md" pb={4} style={{ letterSpacing: 0.5 }}>Admin</Text>}
          {isAdmin && <NavLink {...link} href="/admin/users" label="Users" leftSection={<IconUsers size={18} />} active={path.startsWith("/admin") && !path.startsWith("/admin/health")} />}
          {isAdmin && <NavLink {...link} href="/admin/health" label="System health" leftSection={<IconHeartbeat size={18} />} active={path.startsWith("/admin/health")} />}
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

  const tabs = [...railItems.filter((i) => i.href !== "/admin/health"), { href: "#account", label: "Account", icon: IconUser, on: sheet, show: true }];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <AppShell
        header={{ height: { base: 56, sm: 0 } }}
        footer={{ height: { base: "calc(62px + env(safe-area-inset-bottom, 0px))", sm: 0 } }}
        navbar={{ width: rail ? RAIL : WIDE, breakpoint: "sm", collapsed: { mobile: true } }}
        padding={{ base: "md", sm: "xl" }}
      >
        {/* Phone app bar: logo or title; Back on sub-screens; account button on main screens */}
        <AppShell.Header hiddenFrom="sm">
          <Group h="100%" px="sm" justify="space-between" wrap="nowrap">
            <Group gap={4} wrap="nowrap" style={{ minWidth: 0 }}>
              {screen.back && (
                <ActionIcon component={Link} href={screen.back} variant="subtle" color="gray" size={44} aria-label="Back" style={{ marginLeft: -6 }}>
                  <IconArrowLeft size={22} />
                </ActionIcon>
              )}
              {screen.title === null
                ? <Link href="/" aria-label="Love Boo Ops home" style={{ paddingLeft: 6, lineHeight: 0 }}><Logo /></Link>
                : <Text fw={700} size="lg" truncate style={{ paddingLeft: screen.back ? 0 : 6 }}>{screen.title}</Text>}
            </Group>
            {!screen.back && (
              <UnstyledButton onClick={() => setSheet(true)} aria-label="Open account" aria-haspopup="dialog" style={{ lineHeight: 0, padding: 4 }}>
                <Avatar color="brand" radius="xl" size={36}>{initial}</Avatar>
              </UnstyledButton>
            )}
          </Group>
        </AppShell.Header>

        {/* Desktop: collapsible sidebar */}
        <AppShell.Navbar p={10} component="nav" aria-label="Main" withBorder={false} bg="transparent" visibleFrom="sm">
          <Stack gap={0} h="100%" p={rail ? 8 : "md"} className="sidebar-panel" style={{ overflow: "hidden" }}>{rail ? compact : wide}</Stack>
        </AppShell.Navbar>

        <AppShell.Main>
          <Box id="main" maw={1100} mx="auto">{children}</Box>
        </AppShell.Main>

        {/* Phone: bottom tab bar. Tapping the current tab scrolls to the top. */}
        <AppShell.Footer hiddenFrom="sm" component="nav" aria-label="Main" className="tabbar">
          {tabs.map(({ href, label, icon: Icon, on }) =>
            href === "#account" ? (
              <button key={href} type="button" className="tab" data-active={on || undefined} onClick={() => setSheet(true)} aria-haspopup="dialog">
                <span className="tab-icon"><Icon size={22} stroke={on ? 2.2 : 1.7} /></span>
                <span className="tab-label">{label}</span>
              </button>
            ) : (
              <Link key={href} href={href} className="tab" data-active={on || undefined} aria-current={on ? "page" : undefined}
                onClick={() => { if (on) window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                <span className="tab-icon"><Icon size={22} stroke={on ? 2.2 : 1.7} /></span>
                <span className="tab-label">{label}</span>
              </Link>
            ),
          )}
        </AppShell.Footer>
      </AppShell>

      {/* Phone: account sheet (always closable: X button, swipe down, tap outside, Escape, or navigating) */}
      <Drawer opened={sheet} onClose={() => setSheet(false)} position="bottom" size="auto" withCloseButton={false} zIndex={400}
        closeOnClickOutside closeOnEscape overlayProps={{ opacity: 0.35, blur: 2 }}
        styles={{
          content: { borderTopLeftRadius: 20, borderTopRightRadius: 20, transform: drag ? `translateY(${drag}px)` : undefined, transition: drag ? "none" : undefined },
          body: { paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))" },
        }}>
        <div {...touch} style={{ touchAction: "none" }}>
          <Box w={40} h={5} mx="auto" mb="xs" style={{ borderRadius: 4, background: "var(--mantine-color-gray-4)" }} aria-hidden />
          <Group justify="space-between" mb="md" wrap="nowrap">
            <Text fw={700} size="lg">Account</Text>
            <ActionIcon variant="subtle" color="gray" size={44} onClick={() => setSheet(false)} aria-label="Close account"><IconX size={22} /></ActionIcon>
          </Group>
        </div>
        <Group gap="sm" mb="md" wrap="nowrap">
          <Avatar color="brand" radius="xl" size={48}>{initial}</Avatar>
          <div style={{ minWidth: 0 }}>
            <Group gap={6} wrap="nowrap"><Text fw={600} truncate>{who}</Text>{isAdmin && <Badge variant="light" size="sm">Admin</Badge>}</Group>
            <Text size="sm" c="dimmed" truncate>{email}</Text>
          </div>
        </Group>
        {showReports && isAdmin && (
          <NavLink {...link} href="/reports/daily-sales/settings" label="Email settings" description="Recipients and send time" leftSection={<IconSettings size={20} />}
            rightSection={<IconChevronRight size={16} />} onClick={() => setSheet(false)} mb="md" />
        )}
        {isAdmin && (
          <NavLink {...link} href="/admin/health" label="System health" description="Scheduler, reports and email status" leftSection={<IconHeartbeat size={20} />}
            rightSection={<IconChevronRight size={16} />} onClick={() => setSheet(false)} mb="md" />
        )}
        {signOut}
      </Drawer>
    </>
  );
}
