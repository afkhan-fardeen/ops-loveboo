import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase";
import { emailRegistration } from "@/lib/registration-email";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Constant-time check of "Authorization: Bearer <REGISTRATION_WEBHOOK_SECRET>". */
function authorised(req: NextRequest) {
  const secret = process.env.REGISTRATION_WEBHOOK_SECRET;
  if (!secret) return false;
  const a = Buffer.from(req.headers.get("authorization") ?? ""), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Row = { id?: string | number; client_id?: string | null; first_name?: string; last_name?: string | null; email?: string; phone?: string | null;
  is_parent?: string | boolean | null; source?: string | null; prize?: string | null; prize_image_url?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; created_at?: string };

/** The event a registration belongs to: the one whose dates include the day it was made, else the most recent one that has started. */
async function eventFor(registeredAt: string) {
  const day = new Date(registeredAt).toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  const { data } = await adminClient().from("events").select("id,starts_on,ends_on").order("starts_on", { ascending: false, nullsFirst: false });
  const events = data ?? [];
  return (events.find((e) => e.starts_on && e.ends_on && e.starts_on <= day && day <= e.ends_on)
    ?? events.find((e) => !e.starts_on || e.starts_on <= day))?.id ?? null;
}

/**
 * Supabase Database Webhook on registrations INSERT (registration site's project).
 * Stores a copy of the guest, then emails them. Always answers 200 once the copy is stored,
 * so Supabase doesn't retry; an email that fails is retried by the scheduler.
 */
export async function POST(req: NextRequest) {
  if (!authorised(req)) return new NextResponse("Unauthorised", { status: 401 });

  const body = await req.json().catch(() => null);
  const r: Row | undefined = body?.type === "INSERT" ? body.record : undefined;
  if (!r?.email || r.id == null) return NextResponse.json({ ignored: true });

  const registeredAt = r.created_at ?? new Date().toISOString();
  const db = adminClient();
  const row = {
    registration_id: String(r.id), client_id: r.client_id ?? null, event_id: await eventFor(registeredAt),
    first_name: r.first_name ?? "", last_name: r.last_name ?? null, email: r.email.trim().toLowerCase(), phone: r.phone ?? null,
    is_parent: r.is_parent == null ? null : String(r.is_parent), source: r.source ?? null, prize: r.prize?.trim() || null,
    utm_source: r.utm_source ?? null, utm_medium: r.utm_medium ?? null, utm_campaign: r.utm_campaign ?? null, registered_at: registeredAt,
  };
  const save = (extra: object) => db.from("event_registrations").upsert({ ...row, ...extra }, { onConflict: "registration_id", ignoreDuplicates: true }).select("id").maybeSingle();
  let { data, error } = await save({ prize_image_url: r.prize_image_url || null });
  // 010_prize_image.sql not run yet: store without the picture rather than losing the guest (their first email still gets it).
  if (error && /PGRST204|42703/.test(`${error.code} ${error.message}`)) ({ data, error } = await save({}));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ignoreDuplicates returns no row when it already existed (a webhook retry): nothing more to do.
  if (!data) return NextResponse.json({ duplicate: true });
  return NextResponse.json({ stored: true, email: await emailRegistration(data.id, r.prize_image_url) });
}
