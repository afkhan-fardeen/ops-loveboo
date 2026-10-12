import { cookies } from "next/headers";
import { IconLogout } from "@tabler/icons-react";
import AppFrame from "@/components/AppFrame";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const collapsed = (await cookies()).get("sidebar")?.value === "collapsed";
  return (
    <AppFrame
      isAdmin={user.role === "admin"}
      showReports={user.modules.includes("reports")}
      who={user.name || user.email}
      email={user.email}
      initialCollapsed={collapsed}
      signOut={<form action={signOut}><SubmitButton variant="light" color="red" fullWidth leftSection={<IconLogout size={16} />}>Sign out</SubmitButton></form>}
      signOutCompact={<form action={signOut}><SubmitButton variant="subtle" color="red" px={8} aria-label="Sign out"><IconLogout size={18} /></SubmitButton></form>}
    >
      {children}
    </AppFrame>
  );
}
