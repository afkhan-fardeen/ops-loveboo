"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireModule } from "@/lib/auth";
import { canEditMarketing } from "@/lib/marketing";
import { CAMPAIGN_STATUSES, ITEM_STATUSES, ITEM_TYPES, KINDS, cleanLinks, cleanMarkets, cleanProducts, weekdayDates } from "@/lib/mkt";
import { adminClient } from "@/lib/supabase";

export type Result = { ok: boolean; message: string; id?: string };

const fail = (message: string): Result => ({ ok: false, message });
const done = (message: string, id?: string): Result => { revalidatePath("/marketing", "layout"); return { ok: true, message, id }; };
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));
const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const oneOf = (list: readonly { value: string }[], v: string) => list.some((x) => x.value === v);

/** Signed in, has the Marketing module, and is allowed to edit (admins, or "Marketing: can edit" in Users). Enforced here, not just in the UI. */
async function editor() {
  const user = await requireModule("marketing");
  if (!canEditMarketing(user)) throw new Error("You can view Marketing but not change it. Ask an admin for edit access.");
  return user;
}

async function guard<T>(fn: () => Promise<T>): Promise<T | Result> {
  try { return await fn(); } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw e;   // let a redirect (e.g. not allowed in) through
    return fail(e instanceof Error ? e.message : "Something went wrong.");
  }
}

export async function saveCampaign(form: FormData): Promise<Result> {
  return (await guard(async () => {
    const me = await editor();
    const id = str(form, "id");
    const name = str(form, "name").slice(0, 120);
    const kind = str(form, "kind"), status = str(form, "status") || "planned";
    const starts = str(form, "starts_on"), ends = str(form, "ends_on") || starts;
    const owner = str(form, "owner_id"), colour = str(form, "colour");
    if (!name) return fail("Give the campaign a name.");
    if (!oneOf(KINDS, kind)) return fail("Pick a type.");
    if (!oneOf(CAMPAIGN_STATUSES, status)) return fail("Pick a status.");
    if (!isDate(starts) || !isDate(ends)) return fail("Enter a start and end date.");
    if (ends < starts) return fail("The end date is before the start date.");
    if (owner && !isUuid(owner)) return fail("Pick an owner from the list.");
    const row = {
      name, kind, status, starts_on: starts, ends_on: kind === "key_date" ? starts : ends,
      colour: /^#[0-9a-f]{6}$/i.test(colour) ? colour : "#006D68", owner_id: owner || null,
      markets: cleanMarkets(form.get("markets")), offer: str(form, "offer").slice(0, 200), brief: str(form, "brief").slice(0, 4000),
      links: cleanLinks(form.get("links")), updated_at: new Date().toISOString(),
    };
    const db = adminClient();
    if (id) {
      if (!isUuid(id)) return fail("Unknown campaign.");
      const { error } = await db.from("mkt_campaigns").update(row).eq("id", id);
      return error ? fail(error.message) : done("Campaign saved.", id);
    }
    const { data, error } = await db.from("mkt_campaigns").insert({ ...row, created_by: me.id }).select("id").single();
    return error ? fail(error.message) : done("Campaign created.", data.id);
  })) as Result;
}

export async function saveItem(form: FormData): Promise<Result> {
  return (await guard(async () => {
    const me = await editor();
    const id = str(form, "id");
    const title = str(form, "title").slice(0, 160);
    const campaign = str(form, "campaign_id"), type = str(form, "type") || "other", status = str(form, "status") || "todo";
    const due = str(form, "due_on"), live = str(form, "live_on"), owner = str(form, "owner_id");
    if (!title) return fail("Give the deliverable a title.");
    if (campaign && !isUuid(campaign)) return fail("Pick a campaign from the list.");
    if (!oneOf(ITEM_TYPES, type)) return fail("Pick a type.");
    if (!oneOf(ITEM_STATUSES, status)) return fail("Pick a status.");
    if ((due && !isDate(due)) || (live && !isDate(live))) return fail("Enter valid dates.");
    if (due && live && live < due) return fail("It can't go live before it is due.");
    if (owner && !isUuid(owner)) return fail("Pick an owner from the list.");
    const row = {
      campaign_id: campaign || null, title, type, status, due_on: due || null, live_on: live || null, owner_id: owner || null,
      markets: cleanMarkets(form.get("markets")), links: cleanLinks(form.get("links")), notes: str(form, "notes").slice(0, 4000),
      updated_at: new Date().toISOString(),
    };
    const db = adminClient();
    if (id) {
      if (!isUuid(id)) return fail("Unknown deliverable.");
      const { error } = await db.from("mkt_items").update(row).eq("id", id);
      return error ? fail(error.message) : done("Deliverable saved.", id);
    }
    const { data, error } = await db.from("mkt_items").insert({ ...row, created_by: me.id }).select("id").single();
    return error ? fail(error.message) : done("Deliverable added.", data.id);
  })) as Result;
}

/** One-click status change from the lists. */
export async function setItemStatus(id: string, status: string): Promise<Result> {
  return (await guard(async () => {
    await editor();
    if (!isUuid(id) || !oneOf(ITEM_STATUSES, status)) return fail("Couldn't change the status.");
    const { error } = await adminClient().from("mkt_items").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    return error ? fail(error.message) : done("Status updated.");
  })) as Result;
}

/** Drag on the calendar: move (or resize) a campaign to new dates. A key date stays one day. */
export async function moveCampaign(id: string, starts: string, ends: string): Promise<Result> {
  return (await guard(async () => {
    await editor();
    if (!isUuid(id) || !isDate(starts) || !isDate(ends)) return fail("Couldn’t move that.");
    if (ends < starts) return fail("The end date is before the start date.");
    const db = adminClient();
    const { data: c } = await db.from("mkt_campaigns").select("kind").eq("id", id).maybeSingle();
    if (!c) return fail("That campaign wasn’t found.");
    const { error } = await db.from("mkt_campaigns").update({ starts_on: starts, ends_on: c.kind === "key_date" ? starts : ends, updated_at: new Date().toISOString() }).eq("id", id);
    return error ? fail(error.message) : done("Dates updated.");
  })) as Result;
}

/** Drag on the calendar: move a deliverable's due or go-live day. It can't go live before it is due. */
export async function moveItemDate(id: string, field: "due_on" | "live_on", date: string): Promise<Result> {
  return (await guard(async () => {
    await editor();
    if (!isUuid(id) || !isDate(date) || (field !== "due_on" && field !== "live_on")) return fail("Couldn’t move that.");
    const db = adminClient();
    const { data: i } = await db.from("mkt_items").select("due_on,live_on").eq("id", id).maybeSingle();
    if (!i) return fail("That deliverable wasn’t found.");
    const due = field === "due_on" ? date : i.due_on, live = field === "live_on" ? date : i.live_on;
    if (due && live && live < due) return fail("It can’t go live before it is due.");
    const { error } = await db.from("mkt_items").update({ [field]: date, updated_at: new Date().toISOString() }).eq("id", id);
    return error ? fail(error.message) : done(field === "due_on" ? "Due date updated." : "Go-live date updated.");
  })) as Result;
}

/** Create or edit one email in the plan. */
export async function saveEmail(form: FormData): Promise<Result> {
  return (await guard(async () => {
    const me = await editor();
    const id = str(form, "id"), send = str(form, "send_on"), status = str(form, "status") || "todo", owner = str(form, "owner_id");
    if (!isDate(send)) return fail("Pick the send date.");
    if (!oneOf(ITEM_STATUSES, status)) return fail("Pick a status.");
    if (owner && !isUuid(owner)) return fail("Pick an owner from the list.");
    const row = {
      send_on: send, name: str(form, "name").slice(0, 120), subject: str(form, "subject").slice(0, 200), status, owner_id: owner || null,
      products: cleanProducts(form.get("products")), copy: str(form, "copy").slice(0, 10000), notes: str(form, "notes").slice(0, 4000),
      links: cleanLinks(form.get("links")), updated_at: new Date().toISOString(),
    };
    const db = adminClient();
    if (id) {
      if (!isUuid(id)) return fail("Unknown email.");
      const { error } = await db.from("mkt_emails").update(row).eq("id", id);
      return error ? fail(error.message) : done("Email saved.", id);
    }
    const { data, error } = await db.from("mkt_emails").insert({ ...row, created_by: me.id }).select("id").single();
    return error ? fail(error.message) : done("Email added.", data.id);
  })) as Result;
}

/** Plan ahead: create an empty email slot on each chosen weekday between two dates (for example every Sunday and Thursday). Dates that already have an email are skipped. */
export async function planEmails(form: FormData): Promise<Result> {
  return (await guard(async () => {
    const me = await editor();
    const from = str(form, "from"), to = str(form, "to");
    const days = form.getAll("days").map((d) => Number(d)).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    if (!isDate(from) || !isDate(to)) return fail("Pick the dates to plan between.");
    if (to < from) return fail("The end date is before the start date.");
    if (!days.length) return fail("Pick at least one day of the week.");
    const dates = weekdayDates(from, to, days);
    if (dates.length > 120) return fail("That is more than 120 emails. Pick a shorter period.");
    if (!dates.length) return fail("No matching days in that period.");
    const db = adminClient();
    const { data: existing } = await db.from("mkt_emails").select("send_on").gte("send_on", from).lte("send_on", to);
    const have = new Set((existing ?? []).map((e) => e.send_on as string));
    const fresh = dates.filter((d) => !have.has(d));
    if (!fresh.length) return fail("Those days already have emails planned.");
    const { error } = await db.from("mkt_emails").insert(fresh.map((d) => ({ send_on: d, created_by: me.id })));
    if (error) return fail(error.message);
    return done(`Added ${fresh.length} email${fresh.length === 1 ? "" : "s"}${have.size ? ` (${dates.length - fresh.length} already existed)` : ""}.`);
  })) as Result;
}

export async function setEmailStatus(id: string, status: string): Promise<Result> {
  return (await guard(async () => {
    await editor();
    if (!isUuid(id) || !oneOf(ITEM_STATUSES, status)) return fail("Couldn’t change the status.");
    const { error } = await adminClient().from("mkt_emails").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    return error ? fail(error.message) : done("Status updated.");
  })) as Result;
}

/** Drag an email on the calendar to another send day. */
export async function moveEmail(id: string, date: string): Promise<Result> {
  return (await guard(async () => {
    await editor();
    if (!isUuid(id) || !isDate(date)) return fail("Couldn’t move that.");
    const { error } = await adminClient().from("mkt_emails").update({ send_on: date, updated_at: new Date().toISOString() }).eq("id", id);
    return error ? fail(error.message) : done("Send date updated.");
  })) as Result;
}

/** Deletes a row after the editor check; returns what happened so the caller can redirect (redirect() throws, so never inside a try). */
async function remove(table: "mkt_items" | "mkt_campaigns" | "mkt_emails", id: string, what: string): Promise<Result> {
  return (await guard(async () => {
    await editor();
    if (!isUuid(id)) return fail(`Unknown ${what}.`);
    const { error } = await adminClient().from(table).delete().eq("id", id);   // a campaign's deliverables go with it
    return error ? fail(error.message) : done(`${what[0].toUpperCase()}${what.slice(1)} deleted.`);
  })) as Result;
}

/** Only same-site paths are allowed as the place to return to. */
const backTo = (v: string, fallback: string) => (/^\/marketing(\/[\w-]*)*(\?[\w=&%-]*)?$/.test(v) ? v : fallback);
const withFlash = (path: string, r: Result) => `${path}${path.includes("?") ? "&" : "?"}${r.ok ? "ok" : "err"}=${encodeURIComponent(r.message)}`;

export async function deleteItem(form: FormData) {
  const r = await remove("mkt_items", str(form, "id"), "deliverable");
  redirect(withFlash(backTo(str(form, "back"), "/marketing"), r));
}

export async function deleteCampaign(form: FormData) {
  const r = await remove("mkt_campaigns", str(form, "id"), "campaign");
  redirect(withFlash("/marketing", r));
}

export async function deleteEmail(form: FormData) {
  const r = await remove("mkt_emails", str(form, "id"), "email");
  redirect(withFlash(backTo(str(form, "back"), "/marketing/emails"), r));
}
