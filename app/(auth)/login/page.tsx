import { redirect } from "next/navigation";
import { Butterfly, Button, Card } from "@/components/ui";
import { allowed, hasSupabase, serverClient } from "@/lib/supabase";

async function signIn(form: FormData) {
  "use server";
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  // Same response for allowed and unknown emails: don't reveal who has access.
  if (hasSupabase() && allowed(email))
    await (await serverClient()).auth.signInWithOtp({ email, options: { emailRedirectTo: `${process.env.APP_URL}/auth/callback`, shouldCreateUser: true } });
  redirect("/login?sent=1");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const { sent, error } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <Card className="flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
        <Butterfly className="h-14 w-14" />
        <h1 className="font-display text-2xl font-semibold text-teal">Love Boo Ops</h1>
        {sent ? (
          <p role="status" className="text-ink/80">If that email has access, a sign-in link is on its way. It can take a minute.</p>
        ) : (
          <form action={signIn} className="flex w-full flex-col gap-3 text-left">
            <label htmlFor="email" className="text-sm font-medium">Work email</label>
            <input id="email" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@loveboo.com"
              className="min-h-11 rounded-xl border border-ink/20 bg-white px-3 text-base placeholder:text-ink/50" />
            {error && <p role="alert" className="text-sm text-ink">That link didn’t work. Request a new one.</p>}
            <Button type="submit">Email me a sign-in link</Button>
          </form>
        )}
      </Card>
    </main>
  );
}
