import { Tabs } from "@/components/Nav";
import { requireModule } from "@/lib/auth";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  await requireModule("sales");
  return (
    <>
      <h1 className="sr-only">Sales Reporting</h1>
      <Tabs items={[{ href: "/sales", label: "Overview" }, { href: "/sales/reports", label: "Reports" }, { href: "/sales/settings", label: "Settings" }]} />
      {children}
    </>
  );
}
