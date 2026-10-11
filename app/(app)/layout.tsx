import Nav from "@/components/Nav";
import { Button } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = [{ href: "/", label: "Home" }, ...(user.role === "admin" ? [{ href: "/admin/users", label: "Users" }] : [])];
  return (
    <>
      <Nav items={items}>
        <form action={signOut} className="flex items-center gap-3">
          <span className="hidden max-w-48 truncate text-sm text-ink/70 md:inline">{user.name || user.email}</span>
          <Button variant="ghost" type="submit">Sign out</Button>
        </form>
      </Nav>
      <main id="main" className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-8 md:pt-10">
        {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <p role="status" className="glass mb-6 rounded-xl px-4 py-2 text-sm">
            Demo mode — connect Supabase (see .env.example) to use real sign-in, users and data.
          </p>
        )}
        {children}
      </main>
      <footer className="mx-auto max-w-[1200px] px-4 pb-8 text-sm text-ink/70 md:px-8">Love Boo Ops</footer>
    </>
  );
}
