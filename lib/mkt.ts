/** Marketing module: shared constants, types and pure helpers (used by the server pages and the client components). */

export type Link = { label: string; url: string };

export const KINDS = [
  { value: "campaign", label: "Campaign" },
  { value: "event", label: "Event" },
  { value: "launch", label: "Launch" },
  { value: "sale", label: "Sale" },
  { value: "key_date", label: "Key date" },
] as const;
export type Kind = (typeof KINDS)[number]["value"];

export const CAMPAIGN_STATUSES = [
  { value: "planned", label: "Planned", color: "gray" },
  { value: "confirmed", label: "Confirmed", color: "teal" },
  { value: "cancelled", label: "Cancelled", color: "red" },
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]["value"];

export const ITEM_TYPES = [
  { value: "banner", label: "Banner" },
  { value: "social_post", label: "Social post" },
  { value: "reel_video", label: "Reel / video" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "ad_creative", label: "Ad creative" },
  { value: "landing_page", label: "Landing page" },
  { value: "influencer", label: "Influencer" },
  { value: "in_store", label: "In-store / packaging" },
  { value: "copy", label: "Copy" },
  { value: "other", label: "Other" },
] as const;

export const ITEM_STATUSES = [
  { value: "todo", label: "To do", color: "gray" },
  { value: "in_progress", label: "In progress", color: "blue" },
  { value: "in_review", label: "In review", color: "orange" },
  { value: "ready", label: "Ready", color: "cyan" },
  { value: "live", label: "Live", color: "grape" },
  { value: "done", label: "Done", color: "teal" },
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number]["value"];

/** Brand-friendly colours for campaigns. */
export const COLOURS = ["#006D68", "#E0678A", "#E8A317", "#7B5EA7", "#3F8F5B", "#2F7FC1", "#D9572B", "#5F6B69"];

export const MARKET_SUGGESTIONS = [
  "Global", "UAE", "Bahrain", "Saudi Arabia", "Kuwait", "Qatar", "Oman", "Jordan", "Lebanon", "Egypt", "Iraq", "Morocco", "Tunisia", "Algeria",
  "United Kingdom", "Ireland", "France", "Germany", "Italy", "Spain", "Netherlands", "Sweden", "Norway", "Denmark", "Poland", "Turkey",
  "United States", "Canada", "Mexico", "Brazil", "India", "Pakistan", "Bangladesh", "Sri Lanka", "Singapore", "Malaysia", "Indonesia", "Philippines",
  "Thailand", "Vietnam", "China", "Hong Kong", "Japan", "South Korea", "Australia", "New Zealand", "South Africa", "Nigeria", "Kenya",
];

export type Campaign = {
  id: string; name: string; kind: Kind; status: CampaignStatus; colour: string; starts_on: string; ends_on: string;
  owner_id: string | null; markets: string[]; offer: string; brief: string; links: Link[];
};
export type Item = {
  id: string; campaign_id: string | null; title: string; type: string; status: ItemStatus; due_on: string | null; live_on: string | null;
  owner_id: string | null; markets: string[]; links: Link[]; notes: string;
};
export type Owner = { id: string; name: string | null; email: string };

export const label = <T extends { value: string; label: string }>(list: readonly T[], v: string) => list.find((x) => x.value === v)?.label ?? v;
export const itemStatus = (v: string) => ITEM_STATUSES.find((s) => s.value === v) ?? ITEM_STATUSES[0];
export const ownerName = (owners: Owner[], id: string | null) => {
  const o = owners.find((x) => x.id === id);
  return o ? o.name || o.email : "Unassigned";
};

/** Work that is not finished yet. Ready / Live / Done never count as overdue. */
export const isOpen = (s: string) => s === "todo" || s === "in_progress" || s === "in_review";
export const isOverdue = (i: Pick<Item, "status" | "due_on">, today: string) => !!i.due_on && i.due_on < today && isOpen(i.status);

const DAY = 864e5;
/** Whole days from `from` to `to` (both YYYY-MM-DD). Negative when `to` is earlier. */
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY);

export type CampaignState = "upcoming" | "live" | "ended";
export const campaignState = (c: Pick<Campaign, "starts_on" | "ends_on">, today: string): CampaignState =>
  today < c.starts_on ? "upcoming" : today > c.ends_on ? "ended" : "live";

/** "Starts in 12 days", "Ends tomorrow", "Ended 3 days ago". */
export function countdown(c: Pick<Campaign, "starts_on" | "ends_on">, today: string) {
  const plural = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
  const state = campaignState(c, today);
  if (state === "upcoming") {
    const n = daysBetween(today, c.starts_on);
    return n === 1 ? "Starts tomorrow" : `Starts in ${plural(n)}`;
  }
  if (state === "live") {
    const n = daysBetween(today, c.ends_on);
    return n === 0 ? "Last day today" : n === 1 ? "Ends tomorrow" : `Ends in ${plural(n)}`;
  }
  const n = daysBetween(c.ends_on, today);
  return n === 1 ? "Ended yesterday" : `Ended ${plural(n)} ago`;
}

export type LinkInfo = { kind: string; label: string; host: string };
/** What a pasted link points to, so it can be shown as a clean chip (Drive folder, Doc, Sheet, Slides, Canva, Figma...). */
export function describeLink(url: string): LinkInfo {
  let u: URL;
  try { u = new URL(url); } catch { return { kind: "link", label: "Link", host: url }; }
  const host = u.hostname.replace(/^www\./, "");
  const path = u.pathname;
  if (host === "drive.google.com") return /\/folders\//.test(path) || /^\/drive\/(u\/\d+\/)?folders/.test(path) ? { kind: "drive_folder", label: "Drive folder", host } : { kind: "drive_file", label: "Drive file", host };
  if (host === "docs.google.com") {
    if (path.startsWith("/document")) return { kind: "doc", label: "Google Doc", host };
    if (path.startsWith("/spreadsheets")) return { kind: "sheet", label: "Google Sheet", host };
    if (path.startsWith("/presentation")) return { kind: "slides", label: "Google Slides", host };
    if (path.startsWith("/forms")) return { kind: "form", label: "Google Form", host };
  }
  if (host.endsWith("canva.com")) return { kind: "canva", label: "Canva", host };
  if (host.endsWith("figma.com")) return { kind: "figma", label: "Figma", host };
  if (host.endsWith("dropbox.com")) return { kind: "dropbox", label: "Dropbox", host };
  if (host === "youtu.be" || host.endsWith("youtube.com")) return { kind: "video", label: "YouTube", host };
  return { kind: "link", label: host, host };
}

/** Parses the links submitted by the form (a JSON array). Keeps only http(s) links, at most 20, trims the labels. */
export function cleanLinks(raw: unknown): Link[] {
  let list: unknown = raw;
  if (typeof raw === "string") { try { list = JSON.parse(raw); } catch { return []; } }
  if (!Array.isArray(list)) return [];
  const out: Link[] = [];
  for (const x of list as Partial<Link>[]) {
    const url = String(x?.url ?? "").trim();
    if (!/^https?:\/\/\S+$/i.test(url)) continue;
    out.push({ label: String(x?.label ?? "").trim().slice(0, 80), url: url.slice(0, 2000) });
    if (out.length >= 20) break;
  }
  return out;
}

/** Markets submitted as a JSON array or comma text: trimmed, de-duplicated, at most 60. */
export function cleanMarkets(raw: unknown): string[] {
  let list: unknown = raw;
  if (typeof raw === "string") { try { list = JSON.parse(raw); } catch { list = raw.split(","); } }
  if (!Array.isArray(list)) return [];
  return [...new Set((list as unknown[]).map((m) => String(m).trim()).filter(Boolean).map((m) => m.slice(0, 40)))].slice(0, 60);
}

export type MarketingAccess = "none" | "view" | "edit";
/** A person's Marketing access from their module list: "edit" needs both `marketing` (see it) and `marketing_edit` (change it). */
export const marketingAccess = (modules: string[]): MarketingAccess =>
  !modules.includes("marketing") ? "none" : modules.includes("marketing_edit") ? "edit" : "view";
/** The module list with Marketing access set to `level`; every other module is kept as it was. */
export const withMarketingAccess = (modules: string[], level: MarketingAccess): string[] => {
  const rest = modules.filter((m) => m !== "marketing" && m !== "marketing_edit");
  return level === "edit" ? [...rest, "marketing", "marketing_edit"] : level === "view" ? [...rest, "marketing"] : rest;
};
