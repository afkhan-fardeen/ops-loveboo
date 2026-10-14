# Love Boo Ops portal

Internal portal for loveboo.com. One module, **Reports**, with one report, **Daily Sales**: pick a date, see that day's orders, units, total sales and discounts, and email it on the spot.

Stack: Next.js 15 (App Router) · Mantine 8 · Supabase (Auth + Postgres) · Shopify Admin GraphQL · Resend · Vercel.

## Run locally
```
cp .env.example .env.local   # fill in values
npm install
npm run dev
npm test                     # unit tests (dates, timezones, line and refund maths)
```
Database: run `schema.sql` once on a new Supabase project (or the files in `migrations/` in order).

## What it does
- **Daily Sales** (`/reports/daily-sales`): a date switcher (arrows, calendar, "Latest", ←/→ keys) and that day's report.
- **Send email now** (admins): sends the day's report immediately, with the Excel attached, to the current recipients, or only to addresses you type in (people who aren't recipients). Sending to someone else does not mark the day as emailed.
- **Email settings** (admins, the gear button): recipients (name, email, on/off), the daily send time (Bahrain time), and whether the daily email and the Excel attachment are on.
- **Users** (admins): add people, set passwords, choose which modules they can open.

## How the daily email works
A scheduler pings `/api/cron/daily-report` with the cron secret. It stores yesterday's report (fetched from Shopify in the store timezone, one row in `daily_sales`) at the first check after the day ends, so it appears in the portal right away. Once the admin's send time has passed, it re-fetches and emails the active recipients once (a manual **Send email now** to the recipients counts, so there are no duplicates).
- **Exact times:** `.github/workflows/daily-report.yml` pings every 15 minutes, free. In GitHub → Settings → Secrets and variables → Actions add `APP_URL` (e.g. `https://ops.loveboo.com`) and `CRON_SECRET` (same value as in Vercel).
- **Fallback:** `vercel.json` also pings once a day at 05:00 UTC (Vercel Hobby allows daily crons only).
- Backfill: `GET /api/cron/daily-report?backfill=60` with the cron secret loads past days, never sends email. Re-run a day: `?date=YYYY-MM-DD&resend=1`.

## Numbers
Booked the way Shopify's Sales report books them, and checked against it: an order counts on the day it was processed (items after every discount, excluding VAT and shipping); each refund or return counts as a negative line on the day it happens, even for older orders. Draft orders are excluded. **Total sales** = what customers paid = net sales + shipping + VAT.

## Security model
- Auth: Supabase email + password. Access exists only if an admin created a `profiles` row (role, modules, active). **Disable "Allow new users to sign up"** in Supabase → Authentication → Providers → Email.
- Authorisation is checked on the server in every page, route and server action (`requireUser` / `requireModule` / `requireAdmin`).
- All data access is server-side with the service-role key; RLS is on for every table with no public policies.
- Cron endpoint: constant-time Bearer comparison. Secrets live only in Vercel env vars.
- Headers: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy. Email HTML is escaped.
- Least privilege: the Shopify token needs `read_orders` only. Resend key: sending access only.

## Structure
`/reports` redirects to Daily Sales. The old module id `sales` is mapped to `reports` automatically, and old `/sales/...` addresses (and links in earlier emails) redirect.
Operations checklist: Vercel env vars are in `.env.example`; the sender must be on the verified Resend domain (`reports@mail.loveboo.com`).
