import { cache } from "react";
import { redirect } from "next/navigation";
import { moduleIds } from "./modules";
import { adminClient, serverClient } from "./supabase";

export type User = { id: string; email: string; name: string | null; role: "admin" | "user"; modules: string[] };

const adminEmails = () => (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/** Signed-in user with an active profile, or null. The first ADMIN_EMAILS login bootstraps its own admin profile. */
export const getUser = cache(async (): Promise<User | null> => {
  const { data } = await (await serverClient()).auth.getClaims();
  const user = data?.claims ? { id: data.claims.sub, email: data.claims.email as string | undefined } : null;
  if (!user?.email) return null;

  const db = adminClient();
  let { data: p } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!p && adminEmails().includes(user.email.toLowerCase())) {
    ({ data: p } = await db.from("profiles")
      .insert({ id: user.id, email: user.email, role: "admin", modules: moduleIds, active: true }).select().single());
  }
  if (!p || !p.active) return null;
  return { id: user.id, email: p.email, name: p.name, role: p.role, modules: p.role === "admin" ? moduleIds : p.modules ?? [] };
});

export async function requireUser() {
  const u = await getUser();
  if (!u) redirect(`/login?err=${encodeURIComponent("Your account doesn’t have access. Ask an admin.")}`);
  return u;
}
export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/");
  return u;
}
export async function requireModule(id: string) {
  const u = await requireUser();
  if (!u.modules.includes(id)) redirect("/");
  return u;
}
