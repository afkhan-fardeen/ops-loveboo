import AppFrame from "@/components/AppFrame";
import SubmitButton from "@/components/SubmitButton";
import { requireUser } from "@/lib/auth";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppFrame
      isAdmin={user.role === "admin"}
      showSales={user.modules.includes("sales")}
      who={user.name || user.email}
      signOut={<form action={signOut}><SubmitButton variant="default" size="xs" fullWidth>Sign out</SubmitButton></form>}
    >
      {children}
    </AppFrame>
  );
}
