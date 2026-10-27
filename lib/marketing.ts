import { cache } from "react";
import { adminClient } from "./supabase";
import type { User } from "./auth";
import type { Campaign, Item, Owner } from "./mkt";

/** Admins always edit; everyone else needs the "Marketing: can edit" box ticked in Users. */
export const canEditMarketing = (u: Pick<User, "role" | "modules">) => u.role === "admin" || u.modules.includes("marketing_edit");

export type MarketingData = { campaigns: Campaign[]; items: Item[]; owners: Owner[]; missing: boolean };

/** Everything the Marketing screens need. `missing` = migrations/011_marketing.sql hasn't been run yet. */
export const loadMarketing = cache(async (): Promise<MarketingData> => {
  const db = adminClient();
  const [c, i, o] = await Promise.all([
    db.from("mkt_campaigns").select("*").order("starts_on"),
    db.from("mkt_items").select("*").order("due_on", { nullsFirst: false }),
    db.from("profiles").select("id,name,email").eq("active", true).order("name"),
  ]);
  const missing = [c.error, i.error].some((e) => e && (e.code === "42P01" || /does not exist|schema cache/i.test(e.message)));
  return { campaigns: (c.data ?? []) as Campaign[], items: (i.data ?? []) as Item[], owners: (o.data ?? []) as Owner[], missing };
});
