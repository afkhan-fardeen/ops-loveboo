"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { moduleIds } from "@/lib/modules";
import { adminClient } from "@/lib/supabase";

export type Result = { ok: boolean; message: string };

const done = (message: string): Result => { revalidatePath("/admin/users"); return { ok: true, message }; };
const fail = (message: string): Result => ({ ok: false, message });
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const mods = (f: FormData) => f.getAll("modules").map(String).filter((m) => moduleIds.includes(m));

export async function createUser(form: FormData): Promise<Result> {
  await requireAdmin();
  const email = str(form, "email").toLowerCase(), password = str(form, "password");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
  if (password.length < 10) return fail("Password must be at least 10 characters.");

  const db = adminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return fail(error?.message ?? "Couldn’t create the user.");
  const role = str(form, "role") === "admin" ? "admin" : "user";
  const { error: pe } = await db.from("profiles").insert({ id: data.user.id, email, name: str(form, "name") || null, role, modules: mods(form), active: true });
  if (pe) {
    await db.auth.admin.deleteUser(data.user.id);
    return fail(pe.message);
  }
  return done(`${email} can now sign in.`);
}

export async function updateUser(form: FormData): Promise<Result> {
  const me = await requireAdmin();
  const id = str(form, "id"), password = str(form, "password");
  const self = id === me.id;
  if (password && password.length < 10) return fail("Password must be at least 10 characters.");

  const db = adminClient();
  const { error } = await db.from("profiles").update({
    name: str(form, "name") || null,
    // Never let an admin lock themselves out.
    role: self || str(form, "role") === "admin" ? "admin" : "user",
    modules: mods(form),
    active: self || form.get("active") === "on",
  }).eq("id", id);
  if (error) return fail(error.message);
  if (password) {
    const { error: pe } = await db.auth.admin.updateUserById(id, { password });
    if (pe) return fail(pe.message);
  }
  return done("Changes saved.");
}

export async function deleteUser(form: FormData): Promise<Result> {
  const me = await requireAdmin();
  const id = str(form, "id");
  if (id === me.id) return fail("You can’t delete your own account.");
  const { error } = await adminClient().auth.admin.deleteUser(id);
  if (error) return fail(error.message);
  return done("User deleted.");
}
