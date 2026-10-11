import Link from "next/link";
import { Badge, Card, EmptyState } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { MODULES } from "@/lib/modules";

const Chart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);
const People = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5c1.9.7 3 2.6 3 5.5" /></svg>
);

function ModuleCard({ href, title, text, icon, badge }: { href: string; title: string; text: string; icon: React.ReactNode; badge?: string }) {
  return (
    <Link href={href} className="group block rounded-2xl">
      <Card as="div" className="flex h-full flex-col gap-3 transition-shadow group-hover:shadow-lg motion-safe:group-hover:-translate-y-0.5">
        <div className="flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-meadow text-teal">{icon}</span>
          {badge && <Badge tone="muted">{badge}</Badge>}
        </div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <p className="text-ink/70">{text}</p>
        <span className="mt-auto pt-2 font-medium text-teal">Open →</span>
      </Card>
    </Link>
  );
}

export default async function Home() {
  const user = await requireUser();
  const mine = MODULES.filter((m) => user.modules.includes(m.id));
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-ink/70">Welcome back</p>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">{user.name || user.email}</h1>
      </div>
      {mine.length === 0 && user.role !== "admin" ? (
        <EmptyState title="No modules yet">An admin hasn’t given you access to any modules. Ask them to add you.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mine.map((m) => <ModuleCard key={m.id} href={m.href} title={m.name} text={m.description} icon={<Chart />} />)}
          {user.role === "admin" && <ModuleCard href="/admin/users" title="Users" text="Add people, set passwords and choose which modules they can open." icon={<People />} badge="Admin" />}
        </div>
      )}
    </div>
  );
}
