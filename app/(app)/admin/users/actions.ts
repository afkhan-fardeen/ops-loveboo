"use server";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { moduleIds } from "@/lib/modules";
import { adminClient } from "@/lib/supabase";

const done = (msg: string, ok = true) => redirect(`/admin/users?${ok ? "ok" : "err"}=${encodeURIComponent(msg)}`);
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const mods = (f: FormData) => f.getAll("modules").map(String).filter((m) => moduleIds.includes(m));

export async function createUser(form: FormData) {
  await requireAdmin();
  const email = str(form, "email").toLowerCase(), password = str(form, "password");
  if (!email) return done("Email is required.", false);
  if (password.length < 8) return done("Password must be at least 8 characters.", false);

  const db = adminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return done(error?.message ?? "Couldn’t create the user.", false);
  const role = str(form, "role") === "admin" ? "admin" : "user";
  const { error: pe } = await db.from("profiles").insert({ id: data.user.id, email, name: str(form, "name") || null, role, modules: mods(form), active: true });
  if (pe) {
    await db.auth.admin.deleteUser(data.user.id);
    return done(pe.message, false);
  }
  done(`Added ${email}.`);
}

export async function updateUser(form: FormData) {
  const me = await requireAdmin();
  const id = str(form, "id"), password = str(form, "password");
  const self = id === me.id;
  if (password && password.length < 8) return done("Password must be at least 8 characters.", false);

  const db = adminClient();
  const { error } = await db.from("profiles").update({
    name: str(form, "name") || null,
    // Never let an admin lock themselves out.
    role: self || str(form, "role") === "admin" ? "admin" : "user",
    modules: mods(form),
    active: self || form.get("active") === "on",
  }).eq("id", id);
  if (error) return done(error.message, false);
  if (password) {
    const { error: pe } = await db.auth.admin.updateUserById(id, { password });
    if (pe) return done(pe.message, false);
  }
  done("Saved.");
}

export async function deleteUser(form: FormData) {
  const me = await requireAdmin();
  const id = str(form, "id");
  if (id === me.id) return done("You can’t delete your own account.", false);
  const { error } = await adminClient().auth.admin.deleteUser(id);
  if (error) return done(error.message, false);
  done("User deleted.");
}
