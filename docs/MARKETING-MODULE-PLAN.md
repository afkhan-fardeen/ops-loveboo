# Marketing module — plan and progress

Owner: Fardeen · Started: 2026-10-27 · Module id: `marketing` (edit right: `marketing_edit`)

> Keep the **Progress** section current: tick items as they ship, and add new ideas to "Later".

## 1. Purpose
One place where every team sees **what is happening when**: campaigns and events (Black Friday, Ramadan, Baby Expo, launches, sales), and the **deliverables** inside them (banners, social posts, emails, SMS, ad creatives, landing pages) with who owns them, when they are due, when they go live, and where the files are (Google Drive links).

Not a sync tool: no Google/Outlook calendar sync. Assets are files in Drive; the portal stores links only.

## 2. Decisions (agreed 2026-10-27)
- **Two levels:** a *campaign / event* (dates, colour, owner, markets, offer, brief, links) and *deliverables* inside it.
- **Deliverables carry two dates:** *due* (when the work is needed) and *goes live* (publish date).
- **Deliverable statuses:** To do · In progress · In review · Ready · Live · Done.
- **Campaign kinds:** Campaign · Event · Launch · Sale · Key date (single day). Campaign status: Planned · Confirmed · Cancelled; "Upcoming / Live now / Ended" is worked out from the dates.
- **Markets:** many countries, free tags (suggestions offered). No built-in holiday list: the team adds key dates per market themselves.
- **Who edits:** decided by an admin, per person, in Users (module "Marketing" = view, "Marketing: can edit" = edit). Admins always edit.
- **Assets:** Drive links (file or folder) with a clean chip (Folder / Doc / Sheet / Slides / File, also Canva, Figma, etc.). No uploads in v1. Drive's own sharing settings decide who can open a file.
- **No templates** for now. **Reminders and the Monday digest come later.**
- Dates are plain calendar dates; "today", "overdue" and countdowns use Bahrain time (`lib/timezone.ts`).

## 3. Screens
| Screen | Path | What it shows |
|---|---|---|
| What's on | `/marketing` | Live now, coming up (with countdowns), deliverables due or going live this week, overdue. |
| Calendar | `/marketing/calendar` | Planning workspace with six views (Month, Week, Agenda, Timeline, Board, Year), filters, colour-by, quick add and drag to reschedule. |
| My tasks | `/marketing/tasks` | Open deliverables sorted by due date: mine, or everyone's. Editors change status in one click. |
| Team (admins) | `/marketing/team` | People who can sign in, with their Marketing access in one dropdown; Add member. |
| Guide | `/marketing/guide` | How to use the module (same text as `docs/MARKETING-GUIDE.md`). |
| Campaign | `/marketing/campaigns/[id]` | Brief, dates, markets, offer, links, progress, all deliverables grouped by type. |

## 4. Data (Supabase, ops project) — `migrations/011_marketing.sql`
- `mkt_campaigns`: name, kind, status, colour, starts_on, ends_on, owner_id, markets[], offer, brief, links (jsonb: [{label,url}]).
- `mkt_items`: campaign_id, title, type, status, due_on, live_on, owner_id, markets[], links, notes.
- RLS on, no public policies; all access is server-side with the service role (like every other table).

## 5. Progress
Phase 1 — calendar and deliverables
- [x] Plan agreed, decisions recorded (this file, CONTEXT.md)
- [x] Migration `011_marketing.sql` written (tested on a scratch Postgres: runs twice, constraints hold, deleting a campaign removes its deliverables)
- [ ] **Migration run in the ops Supabase SQL Editor** (manual step, not done yet)
- [x] Module registered (`marketing` to view, `marketing_edit` to edit), sidebar, phone tab, Home card
- [x] Campaign and deliverable create / edit / delete (drawers + server actions; edit rights enforced on the server)
- [x] What's on screen (happening now, coming up, overdue, due this week, going live)
- [x] Month calendar + list view + filters (campaign, type, status, owner, market)
- [x] My tasks screen with one-click status change
- [x] Campaign page with progress and deliverables grouped by type
- [x] Drive link chips
- [x] **Team tab** (admins): add members (name, email, generated password) and set each person's Marketing access: No access / Can view / Can view and edit
- [x] **Calendar upgrade**: six views (Month, Week, Agenda, Timeline, Board, Year), a modern look (tinted chips with type icons and Due / Live tags), search, colour by campaign / type / status / owner, live-now / due / overdue counters, remembered view
- [x] **Quick actions** (editors): click a day to add, drag across days to create a campaign, drag to reschedule (campaigns can be resized), drag Board cards between statuses; rules enforced on the server (not live before due)
- [x] **Guide**: in the portal (Marketing → Guide) and `docs/MARKETING-GUIDE.md`; the repo `README.md` points to it
- [x] Unit tests (`tests/mkt.test.ts`: link chips, date maths, overdue rule)
- [ ] **Checked with real data** (first campaign: Black Friday) after the migration is run and "Marketing" is ticked for people in Users

To switch it on: (1) run `migrations/011_marketing.sql`; (2) in Users, tick **Marketing** for everyone who should see it and **Marketing: can edit** for those who may change things (admins always can).

Phase 2 — later
- [ ] Reminders: Monday digest email (this week + overdue) and a nudge to the owner the day before something is due (Resend)
- [ ] Comments on a campaign or deliverable
- [ ] Campaign recap (what ran, results notes)
- [ ] Repeating items (e.g. a weekly post)

Ideas, not committed
- Attach a Shopify product or collection to a deliverable
- Show Klaviyo campaign send dates on the calendar
- Approvals step
- Uploads into the portal (instead of Drive links)
