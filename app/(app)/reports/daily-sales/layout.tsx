import ReportTabs from "@/components/ReportTabs";
import { requireModule } from "@/lib/auth";

export default async function DailySalesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireModule("reports");
  const base = "/reports/daily-sales";
  return (
    <>
      <ReportTabs items={[
        { href: base, label: "Day" },
        { href: `${base}/period`, label: "Period" },
        ...(user.role === "admin" ? [{ href: `${base}/settings`, label: "Email settings" }] : []),
      ]} />
      {children}
    </>
  );
}
