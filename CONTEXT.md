# Love Boo Ops Portal — Project Context

> **Keep this file current.** After any change to logic, data model, files or infra, update the relevant section, the "Status" table and the "Last updated" line. Read this first instead of re-reading every file.

Last updated: 2026-10-19 (code at commit `9f5ef2b` and later, `main`)

## 1. What this is
Internal portal for **loveboo.com** at **ops.loveboo.com**. One module today: **Reports**, containing one report, **Daily Sales**: pick a date, see that day's orders, units, total sales and discounts, and email it on the spot. A scheduled job also stores yesterday's report and emails it to the recipients each day.

- **Stack:** Next.js 15 (App Router, TypeScript) · Mantine 8 (teal theme `#006D68`, glass surfaces) · Supabase (Auth + Postgres) · Shopify Admin GraphQL · Resend · Vercel. Repo: `afkhan-fardeen/ops-loveboo` (`main`).
- **Data source:** Shopify store `love-boo-store.myshopify.com` (GBP, prices include VAT), read-only, API version in `SHOPIFY_API_VERSION`.
- **Supabase project:** ref `mmsuyaymllemvztzbonk`. All access is server-side with the service-role key; RLS is on for every table with no public policies.
- **Timezone:** everything is **Bahrain time (GMT+3, no daylight saving)**, one constant in `lib/timezone.ts`: where a day starts and ends, the send time, and every time shown. London time was removed on purpose.
- **History:** `prd.md` is the original v0.1 plan and is outdated; this file supersedes it.

## 2. Status — what works now / what's pending
| Area | State |
|---|---|
| Sign-in (email + password), admin-managed users, module access | Live. |
| Daily Sales page (date switcher, report, orders table) | Live. Loads any missing day itself when the page opens. |
| Send email now (current recipients, or someone else) | Live, admins only. |
| Daily email + Excel (per-recipient, personalised greeting) | Live. Sender `reports@mail.loveboo.com` (verified in Resend). |
| Email settings (recipients, send time, switches) | Live, admins only. |
| System health screen (scheduler, report, email, connections, run log) | Live after redeploy; the run log is empty until the next scheduled call. |
| Phone app layout (bottom tabs, app bar with Back, account sheet), installable (PWA manifest) | Live. Not tested on real devices yet. |
| Scheduler | **Partly working.** Vercel Cron pings once a day (~08:53 Bahrain). The 15-minute GitHub scheduler is **not set up yet** (secrets missing), so a send time later than ~09:00 cannot fire. |
| Automatic daily email | **Not reliable until the scheduler is fixed** (send time is 09:30 in the DB). Emails have mostly gone out via Send email now. |
| Inventory module | Plan only (`docs/INVENTORY-MODULE-PLAN.md`). Not built. |
| Registration (Expo) guest email | **Code written, not live.** Webhook endpoint `/api/webhooks/registration` + `lib/registration-email.ts` + `migrations/009_events.sql` (run by hand). Needs the SQL run, env vars `REGISTRATION_WEBHOOK_SECRET` (+ optional `REGISTRATION_FROM`, `REGISTRATION_REPLY_TO`), and the Supabase webhook on the registration project. Events module (`/events`: KPIs, registrations with email status, event settings, test/retry buttons) is built; module id `events`. |

## 3. Files
| Path | Purpose |
|---|---|
| `app/(auth)/login/page.tsx` | Sign-in (split layout; `?next=` returns to the page you wanted). |
| `app/(app)/layout.tsx` | Auth gate + `AppFrame`. `page.tsx` is Home (greeting + module cards). `template.tsx` fade-in, `loading.tsx`, `error.tsx`. |
| `app/(app)/reports/daily-sales/page.tsx` | The report: `DateSwitcher`, `SendEmailDialog`, summary card, orders table. `actions.ts` has `sendDayEmail` and `loadMissingDays`. |
| `app/(app)/reports/daily-sales/settings/` | Email settings page + `save` action (admins). |
| `app/(app)/reports/page.tsx` | Redirects to Daily Sales (only one report). |
| `app/(app)/admin/users/` | Users: list, add/edit drawers, search. `admin/health/` System health + `runCheckNow`. `admin/page.tsx` redirects to users. |
| `app/api/cron/daily-report/route.ts` | The job endpoint (Bearer `CRON_SECRET`): scheduled mode, `?backfill=N` (loads data, never emails), `?date=YYYY-MM-DD[&resend=1]`. Logs every call to `job_runs`. |
| `lib/shopify.ts` | `fetchDay` and `fetchRefunds`: builds a day from Shopify with Shopify's booking rules (§5). |
| `lib/lines.ts` | Pure maths: `lineAmounts`, `refundAmounts`. |
| `lib/data.ts` | `fetchRow` (uncached), `dayRow`, `dateBounds` (cached 5 min, tag `sales`), `latestDate`. |
| `lib/report.ts` | `run` (scheduled/backfill), `sendDay` (Send email now), `deliver` (one email per recipient), `sendFailure`. |
| `lib/scheduled.ts` | One scheduler check: store yesterday if missing, email once after the send time. |
| `lib/missing.ts` | Days between the newest stored day and yesterday (max 7). |
| `lib/email.ts`, `lib/excel.ts` | Email HTML/text; Excel (sheets "Daily Report" and "Location Sales"). |
| `lib/settings.ts` | Recipients `{name,email,active}`, send time, switches (table `settings`, key `report`). |
| `lib/schedule.ts`, `lib/timezone.ts` | Send-time helpers; the single timezone constant. |
| `lib/health.ts`, `lib/jobs.ts` | Health checks; run log (`job_runs`, 14 days). |
| `lib/auth.ts`, `lib/modules.ts`, `lib/supabase.ts` | Session + profile (30 s cache), module ids (`reports`; legacy `sales` is mapped), Supabase clients. |
| `lib/format.ts`, `lib/names.ts`, `lib/progress.ts`, `lib/theme.ts` | Formatting/dates; greeting name; top-progress trigger; Mantine theme. |
| `components/` | `AppFrame` (sidebar + phone layout), `SendEmailDialog`, `RecipientsManager`, `UsersManager`, `DateSwitcher`, `LoadMissing`, `RunCheckButton`, `SubmitButton` (spinner + confirm dialog), `TopProgress`, `FlashToast`, `Skeletons`, `ui.tsx`, `Links.tsx`. |
| `middleware.ts` | Redirects signed-out users to `/login`; excludes static assets, `api/cron`, the manifest. |
| `next.config.ts` | Security headers (CSP, HSTS, etc.); redirects from old `/sales...` links. |
| `.github/workflows/daily-report.yml` | 15-minute scheduler ping (needs secrets `APP_URL`, `CRON_SECRET`). |
| `vercel.json` | Daily cron `0 5 * * *` (05:00 UTC; Hobby fires it any time that hour). |
| `schema.sql`, `migrations/` | Database setup (full schema) and incremental SQL, run by hand. |
| `tests/` | 10 unit tests (`npm test`): day ranges, line/refund maths, time helpers, health status. |
| `docs/INVENTORY-MODULE-PLAN.md` | Inventory proposal only. |

## 4. Daily Sales page
- Date switcher: previous/next, calendar (limited to stored days), "Latest", ←/→ keys; state in the URL (`?date=`). Switching shows a skeleton at once (keyed Suspense).
- Report card: "Love Boo Store — date", Orders, Units sold, **Total sales**, Discounts given, plus one line saying Total sales = net sales + shipping + VAT. Orders table: Order, Time (AM/PM), Amount (what the customer paid), Discount. Refunds appear as their own negative rows ("LB… · refund").
- **Send email now** (admins): dialog with *Current recipients* (lists them) or *Someone else* (1–10 addresses). It refreshes the day from Shopify first. Sending to recipients marks the day emailed (so the scheduler won't repeat); sending to someone else does not.
- If yesterday's report isn't stored, the page fetches it ("Loading yesterday's report from Shopify…"), data only, never email.
- A gear button (admins) opens Email settings.

## 5. How the numbers are computed (`lib/shopify.ts`)
Verified against Shopify's own ShopifyQL report (orders, net sales, shipping, VAT, total sales match to the penny except where noted).
- An order counts on the day it was **processed** (Shopify dates sales by processed time), in Bahrain time. Drafts (`sourceName = shopify_draft_order`), test and cancelled orders are excluded.
- **Net sales** = items after every discount (line and order level), excluding VAT, excluding shipping. **Total sales** = what customers paid = net + shipping + VAT. Per order: shipping = total paid − net − VAT. Discounts are shown ex-VAT.
- **Refunds and returns count on the day they happen** (negative lines), even for older orders. Quantity removed by an order *edit* reduces the order's own day (Shopify books edits on the edit day; we can't see edit dates, e.g. 31 Aug).
- Past days stay stable; they only change if that day is re-run.

## 6. Daily job and scheduler
- Every call (Vercel Cron, GitHub scheduler, an admin) hits `/api/cron/daily-report`, which runs `runScheduled()`: (1) store yesterday's report if missing, even if email is off; (2) after the send time (Bahrain), re-fetch and email the active recipients **once**. `emailed_at` on the day prevents duplicates.
- Settings that drive it live in the DB (`settings` key `report`): `sendTime` (currently 09:30), `emailEnabled`, `attachExcel`, recipients.
- Failure alerts go to `ADMIN_EMAILS`, at most one per day (`settings` key `last_alert`).
- Every call is recorded in `job_runs` (source `vercel` / `github` / `manual`, outcome, detail). System health reads it.
- **Limitation:** with only Vercel Cron, checks happen once a day (~08:00–09:00 Bahrain). Fix: add GitHub secrets (§12) or set the send time to 08:00.

## 7. Email and Excel
- One email per recipient (a rejected address never blocks the rest). Greeting "Hello <first name>": the name saved on the recipient, else the portal account name, else derived from the email (generic mailboxes like `finance@` get "there").
- Body (approved by the owner, keep simple): title, link to the day, Orders, Units sold, Total sales, Discounts given, one note with the net + shipping + VAT split. The link uses `APP_URL`; the logo shows only when it is `https`.
- Excel: sheet **Daily Report** (same lines + Order/Time/Amount/Discount) and **Location Sales** (by city, with a by-country summary underneath).

## 8. Admin
- **Users:** admins add people (name, email, password ≥ 10 chars, role, modules), edit, disable, delete. Admins can't demote/disable/delete themselves. Module id is `reports`; old `sales` access is mapped automatically.
- **Email settings:** recipients (name, email, on/off, add/edit/remove, pick from portal users), send time (Bahrain time), daily email on/off, attach Excel on/off. Warns before leaving with unsaved recipient edits.
- **System health (`/admin/health`):** overall status, scheduler (how often, last check), yesterday's report, daily email (sent/waiting/overdue), recipients, Shopify connection (live), email sending (sender not `resend.dev`), timezone, secrets (`CRON_SECRET`, `APP_URL` not localhost), recent runs table, and **Run the check now** (runs the scheduler check; sends the email if it is due).

## 9. Auth and security
- Supabase email + password. Access exists only if an admin created a `profiles` row (`role`, `modules`, `active`). There is **no self-sign-up path in the app**, but Supabase's own sign-up must be **disabled** in the dashboard (not confirmed done).
- Authorisation is checked on the server in every page, route and server action (`requireUser` / `requireModule` / `requireAdmin`); layouts are not relied on. Session is verified locally (`getClaims`), profile cached 30 s (cleared when an admin edits a user).
- Cron endpoint: constant-time Bearer check. Secrets only in Vercel env vars. CSP, HSTS, X-Frame-Options, nosniff, Permissions-Policy set in `next.config.ts`. Email HTML is escaped.
- The Shopify token only needs `read_orders` (+ `read_reports` for cross-checks). Resend key: sending access only.

## 10. Data model (Supabase)
- `daily_sales` (one row per Bahrain day): used columns `date, orders, units, net_sales, discounts, shipping, taxes, total_sales, currency, emailed_at, locations (json), order_list (json)`. **Unused legacy columns:** `gross_sales, returns, top_products, sessions, conversion, sources, discount_codes` (drop after the live site has redeployed).
- `profiles` (`id, email, name, role, modules text[], active`). `settings` (`key, value json`): `report`, `last_alert`; `scheduler` is a legacy heartbeat. `job_runs` (run log, pruned to 14 days).
- Reads are cached 5 min (`unstable_cache`, tag `sales`, keys versioned `v3`); writes call `revalidateTag("sales")`. Emails always read fresh rows.

## 11. UI conventions
- Mantine + brand teal; glass cards and sidebar, rounded corners; sidebar collapses to an icon rail (cookie `sidebar`); phones get a bottom tab bar (Home, Reports, Users, Account), an app bar (logo or title, Back on sub-screens, avatar) and a closable account sheet (X, swipe, tap outside, Escape, on navigation).
- Feedback: toasts for every result (`?ok=` / `?err=` or direct), top progress bar, per-page skeletons, spinner buttons, styled confirm dialogs (`SubmitButton confirm`), sign-out in red, page titles per route, skip link.

## 12. Config
Env vars (Vercel + `.env.local`; see `.env.example`): `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_API_VERSION`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `REPORT_FROM` (`Love Boo Ops <reports@mail.loveboo.com>`), `REPORT_RECIPIENTS` (only a fallback before recipients are saved), `ADMIN_EMAILS` (failure alerts), `CRON_SECRET`, `APP_URL` (`https://ops.loveboo.com`). `STORE_TIMEZONE` is no longer used.
GitHub Actions secrets for the 15-minute scheduler: `APP_URL`, `CRON_SECRET` (same value as Vercel).
Run: `npm install`, `npm run dev`, `npm test`, `npm run build`. SQL changes are run by hand (Supabase SQL editor or the pooler). Local checks use the production database, so anything run locally that emails really emails.

## 13. Related projects
- **Registration / spin-to-win site** (`registration.loveboo.com`, repo `afkhan-fardeen/loveboo-registration`, Supabase ref `esydiawzpmtgnugpaodn`, has its own `CONTEXT.md`). Planned integration: a Supabase Database Webhook on `registrations` inserts calls a secured ops-portal address, which sends the "thanks, you won X" email through Resend (once per person per event day); a read-only portal module to view registrations comes later. Open points: separate marketing-consent checkbox, event dates, collection details for the email.

## 14. To do / open items
1. **Scheduler:** add GitHub secrets `APP_URL` + `CRON_SECRET`, or set the send time to 08:00; confirm on System health.
2. Redeploy on Vercel and set `APP_URL`, `REPORT_FROM`; delete `STORE_TIMEZONE`.
3. Supabase: disable "Allow new users to sign up".
4. **Rotate secrets** that were shared in chat: Supabase service-role key and database password (the admin login used the same password), Resend key, Shopify token, `CRON_SECRET`; then change the admin password.
5. After redeploy, drop the unused `daily_sales` columns and the legacy `scheduler` settings row.
6. Emails sent on 14 Oct (for 12, 13, 14 Oct) used the old London-day figures; resend corrected copies if anyone relied on them. 15 and 17 Oct haven't been emailed.
7. Better home-screen icon than the "LB" placeholder; test on real phones.
8. Optional: Inventory module (plan exists), Expo registration email, more reports under Reports.

## 15. Known limits
- Order edits are booked on the order's day, not the edit day (31 Aug differs from Shopify for this reason).
- Shopify counts draft-order orders; we exclude them by design, so those days differ from Shopify's own report.
- The scheduler is only as precise as its pinger (§6).
- Time-of-day and "yesterday" always use Bahrain time.

## 16. Change log
- 2026-10-11 — PRD, build of Daily Sales (Next.js + Supabase + Shopify + Resend), sign-in and admin users, glass UI, Excel and email.
- 2026-10-12 — Net sales corrected (VAT on shipping, order-level discounts); refunds booked on the day they happen; processed-time dating; full breakdown; phone layout and PWA.
- 2026-10-13/14 — Recipients with names, Send now, admin send time and scheduler, site simplified to one Daily Sales page, System health screen, run log.
- 2026-10-18/19 — Missing days load when the page opens; timezone fixed (London removed, Bahrain everywhere); this file created.
- 2026-10-19 — Guest email for the Expo registration site: webhook stores a copy in `event_registrations`, emails from `registration@mail.loveboo.com` (Reply-To `hello@loveboo.com`), scheduler retries failures. Test emails went to fardeen@loveboo.com only.
