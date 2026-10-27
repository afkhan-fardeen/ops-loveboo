"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { withMarketingAccess, type MarketingAccess } from "@/lib/mkt";
import { normaliseModules } from "@/lib/modules";
import { adminClient } from "@/lib/supabase";

export type Result = { ok: boolean; message: string };
const fail = (message: string): Result => ({ ok: false, message });
const done = (message: string): Result => { revalidateTag("profiles"); revalidatePath("/marketing/team"); return { ok: true, message }; };
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const isLevel = (v: string): v is MarketingAccess => v === "none" || v === "view" || v === "edit";

/** Adds a person who can sign in. Admins only: they set the password and what the person can do in Marketing. */
export async function addMember(form: FormData): Promise<Result> {
  try {
    await requireAdmin();
    const email = str(form, "email").toLowerCase(), password = str(form, "password"), name = str(form, "name");
    const level = str(form, "access") || "view";
    if (!name) return fail("Enter their name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail("Enter a valid email address.");
    if (password.length < 10) return fail("The password must be at least 10 characters.");
    if (!isLevel(level)) return fail("Pick what they can do in Marketing.");

    const db = adminClient();
    const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) return fail(error?.message ?? "Couldn’t create the account.");
    const { error: pe } = await db.from("profiles").insert({ id: data.user.id, email, name, role: "user", modules: withMarketingAccess([], level), active: true });
    if (pe) { await db.auth.admin.deleteUser(data.user.id); return fail(pe.message); }
    return done(`${name} can now sign in at ops.loveboo.com.`);
  } catch (e) { return fail(e instanceof Error ? e.message : "Something went wrong."); }
}

/** Changes a person's Marketing access (none / view / edit); their other modules stay as they are. */
export async function setMarketingAccess(id: string, level: string): Promise<Result> {
  try {
    await requireAdmin();
    if (!/^[0-9a-f-]{36}$/i.test(id) || !isLevel(level)) return fail("Couldn’t change that.");
    const db = adminClient();
    const { data: p } = await db.from("profiles").select("modules,role").eq("id", id).maybeSingle();
    if (!p) return fail("That person wasn’t found.");
    if (p.role === "admin") return fail("Admins always have full access to Marketing.");
    const modules = withMarketingAccess(normaliseModules(p.modules), level);
    const { error } = await db.from("profiles").update({ modules }).eq("id", id);
    if (error) return fail(error.message);
    return done(level === "none" ? "Marketing access removed." : level === "view" ? "They can now view Marketing." : "They can now view and edit Marketing.");
  } catch (e) { return fail(e instanceof Error ? e.message : "Something went wrong."); }
}

