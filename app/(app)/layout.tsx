import Link from "next/link";
import Nav from "@/components/Nav";
import { isDemo } from "@/lib/data";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <header className="glass sticky top-0 z-10 flex min-h-14 items-center border-x-0 border-t-0 px-4 md:hidden">
        <Link href="/" className="font-display text-xl font-semibold text-teal">Love Boo</Link>
      </header>
      <div className="md:pl-16 xl:pl-58">
        <main id="main" className="mx-auto max-w-[1200px] px-4 pb-28 pt-6 md:px-8 md:pb-12 md:pt-10">
          {isDemo() && (
            <p role="status" className="mb-6 rounded-xl bg-meadow px-4 py-2 text-sm text-ink">
              Showing sample data — connect Supabase (see .env.example) to see real figures.
            </p>
          )}
          {children}
        </main>
      </div>
    </>
  );
}
