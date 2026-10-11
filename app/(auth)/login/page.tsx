import { redirect } from "next/navigation";
import { Butterfly, Button, Card } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { serverClient } from "@/lib/supabase";

async function signIn(form: FormData) {
  "use server";
  const { error } = await (await serverClient()).auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  redirect(error ? "/login?error=1" : "/");
}

const MSG: Record<string, string> = {
  "1": "Incorrect email or password.",
  access: "Your account doesn’t have access. Ask an admin.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (await getUser()) redirect("/");
  const input = "min-h-11 rounded-xl border border-ink/20 bg-white px-3 text-base placeholder:text-ink/50";
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <Card className="flex w-full max-w-sm flex-col items-center gap-4 p-8 text-center">
        <Butterfly className="h-14 w-14" />
        <h1 className="font-display text-2xl font-semibold text-teal">Love Boo Ops</h1>
        <form action={signIn} className="flex w-full flex-col gap-3 text-left">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required autoComplete="username" inputMode="email" className={input} />
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className={input} />
          {error && MSG[error] && <p role="alert" className="rounded-lg bg-berry/10 px-3 py-2 text-sm">{MSG[error]}</p>}
          <Button type="submit">Sign in</Button>
        </form>
      </Card>
    </main>
  );
}
