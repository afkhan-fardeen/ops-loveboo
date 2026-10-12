import { requireModule } from "@/lib/auth";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  await requireModule("reports");
  return children;
}
