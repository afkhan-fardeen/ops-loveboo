import { ModuleTabs } from "@/components/Nav";
import { requireModule } from "@/lib/auth";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireModule("sales");
  const items = [
    { href: "/sales", label: "Overview" },
    { href: "/sales/reports", label: "Reports" },
    ...(user.role === "admin" ? [{ href: "/sales/settings", label: "Settings" }] : []),
  ];
  return (
    <>
      <ModuleTabs items={items} />
      {children}
    </>
  );
}
