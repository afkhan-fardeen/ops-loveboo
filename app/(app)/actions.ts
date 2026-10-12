"use server";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase";

export async function signOut() {
  await (await serverClient()).auth.signOut();
  redirect("/login");
}
