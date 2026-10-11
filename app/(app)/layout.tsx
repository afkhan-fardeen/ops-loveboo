import Nav from "@/components/Nav";
import { isDemo } from "@/lib/data";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 md:px-8 md:pt-10">
        {isDemo() && (
          <p role="status" className="glass mb-6 rounded-xl px-4 py-2 text-sm">
            Showing sample data — connect Supabase (see .env.example) to see real figures.
          </p>
        )}
        {children}
      </main>
      <footer className="mx-auto max-w-[1200px] px-4 pb-8 text-sm text-ink/70 md:px-8">Love Boo Ops · Sales reporting</footer>
    </>
  );
}
