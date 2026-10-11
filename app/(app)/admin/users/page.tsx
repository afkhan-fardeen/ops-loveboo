import { Badge, Button, Card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { MODULES } from "@/lib/modules";
import { adminClient } from "@/lib/supabase";
import { createUser, deleteUser, updateUser } from "./actions";

export const dynamic = "force-dynamic";

type Profile = { id: string; email: string; name: string | null; role: "admin" | "user"; modules: string[]; active: boolean };

const input = "min-h-11 w-full rounded-xl border border-ink/20 bg-white px-3 text-base placeholder:text-ink/50";
const Field = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5"><label htmlFor={id} className="text-sm font-medium">{label}</label>{children}</div>
);

function Modules({ selected = [] }: { selected?: string[] }) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-sm font-medium">Module access</legend>
      {MODULES.map((m) => (
        <label key={m.id} className="flex min-h-11 items-center gap-3">
          <input type="checkbox" name="modules" value={m.id} defaultChecked={selected.includes(m.id)} className="h-5 w-5 accent-teal" />
          {m.name}
        </label>
      ))}
    </fieldset>
  );
}

export default async function Users({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const me = await requireAdmin();
  const { ok, err } = await searchParams;
  const users = ((await adminClient().from("profiles").select("*").order("created_at")).data as Profile[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Users</h1>
        <p className="text-ink/70">Add people, set their password and choose which modules they can open.</p>
      </div>

      {ok && <p role="status" className="rounded-xl bg-meadow px-4 py-2">{ok}</p>}
      {err && <p role="alert" className="rounded-xl bg-berry/10 px-4 py-2">{err}</p>}

      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold">Add a user</h2>
        <form action={createUser} className="grid gap-4 md:grid-cols-2">
          <Field id="n-name" label="Name"><input id="n-name" name="name" autoComplete="off" className={input} /></Field>
          <Field id="n-email" label="Email"><input id="n-email" name="email" type="email" required autoComplete="off" className={input} /></Field>
          <Field id="n-pass" label="Password (min 8 characters)"><input id="n-pass" name="password" type="text" required minLength={8} autoComplete="off" className={input} /></Field>
          <Field id="n-role" label="Role">
            <select id="n-role" name="role" className={input} defaultValue="user"><option value="user">User</option><option value="admin">Admin</option></select>
          </Field>
          <div className="md:col-span-2"><Modules selected={["sales"]} /></div>
          <div className="md:col-span-2"><Button type="submit">Add user</Button></div>
        </form>
      </Card>

      <Card className="p-0">
        <h2 className="px-5 pt-5 font-display text-lg font-semibold">People ({users.length})</h2>
        <ul className="divide-y divide-ink/10">
          {users.map((u) => (
            <li key={u.id}>
              <details className="group">
                <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-5 py-3 hover:bg-meadow/30">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{u.name || u.email}{u.id === me.id && " (you)"}</span>
                    {u.name && <span className="block truncate text-sm text-ink/70">{u.email}</span>}
                  </span>
                  <span className="flex gap-2">
                    <Badge>{u.role === "admin" ? "Admin" : "User"}</Badge>
                    {!u.active && <Badge tone="muted">Disabled</Badge>}
                  </span>
                </summary>
                <div className="grid gap-4 border-t border-ink/10 px-5 py-4 md:grid-cols-2">
                  <form action={updateUser} className="grid gap-4 md:col-span-2 md:grid-cols-2">
                    <input type="hidden" name="id" value={u.id} />
                    <Field id={`name-${u.id}`} label="Name"><input id={`name-${u.id}`} name="name" defaultValue={u.name ?? ""} className={input} /></Field>
                    <Field id={`role-${u.id}`} label="Role">
                      <select id={`role-${u.id}`} name="role" defaultValue={u.role} disabled={u.id === me.id} className={input}><option value="user">User</option><option value="admin">Admin</option></select>
                    </Field>
                    <Field id={`pw-${u.id}`} label="New password (leave blank to keep)"><input id={`pw-${u.id}`} name="password" type="text" minLength={8} autoComplete="off" className={input} /></Field>
                    <label className="flex min-h-11 items-center gap-3 self-end">
                      <input type="checkbox" name="active" defaultChecked={u.active} disabled={u.id === me.id} className="h-5 w-5 accent-teal" /> Account active
                    </label>
                    <div className="md:col-span-2"><Modules selected={u.modules} /></div>
                    <div className="md:col-span-2"><Button type="submit">Save changes</Button></div>
                  </form>
                  {u.id !== me.id && (
                    <form action={deleteUser} className="md:col-span-2">
                      <input type="hidden" name="id" value={u.id} />
                      <button className="min-h-11 text-sm text-ink underline decoration-berry underline-offset-4">Delete this user</button>
                    </form>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
