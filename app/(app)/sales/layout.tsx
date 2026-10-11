import { requireModule } from "@/lib/auth";

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  await requireModule("sales");
  return children;
}
