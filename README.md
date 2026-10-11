# Love Boo Ops portal

Internal portal for loveboo.com. Module 1: **Sales** (daily report, period reports, live today, Excel, daily email).

Stack: Next.js 15 (App Router) · Mantine 8 · Supabase (Auth + Postgres) · Shopify Admin GraphQL · Resend · Vercel.

## Run locally
```
cp .env.example .env.local   # fill in values
npm install
npm run dev
npm test                     # unit tests (dates, timezones, summaries)
```
Database: run `schema.sql` once on a new Supabase project (or the files in `migrations/` in order).

## How it works
`Vercel Cron → /api/cron/daily-report` (Bearer `CRON_SECRET`) fetches yesterday from Shopify (store timezone), upserts one row in `daily_sales`, emails recipients (one email each, Excel attached). Pages read stored rows; "Today so far" calls Shopify live (cached 60 s).
Backfill: `GET /api/cron/daily-report?backfill=60` with the cron secret (no emails). Re-send a day: `?date=YYYY-MM-DD&resend=1`.

## Net sales definition
Items sold after every discount (line and order level), excluding VAT when prices include it, excluding shipping, adjusted for returns. Draft orders excluded. Verified against Shopify ShopifyQL `net_sales`.

## Security model
- Auth: Supabase email + password. Access exists only if an admin created a `profiles` row (role, modules, active). No self-signup path: **disable "Allow new users to sign up"** in Supabase → Authentication → Providers → Email.
- Authorisation is checked on the server in every page, route and server action (`requireUser` / `requireModule` / `requireAdmin`); layouts are not relied on.
- All data access is server-side with the service-role key; RLS is enabled on every table with no public policies, so the anon key can read nothing.
- Cron endpoint: constant-time Bearer comparison. Secrets live only in Vercel env vars.
- Headers: CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy. Email HTML is escaped; the email preview is a sandboxed iframe.
- Least privilege: the Shopify token only needs `read_orders` (+ `read_reports` for cross-checks). Resend key: sending access only.
- Known, accepted: `npm audit` reports a build-time PostCSS advisory bundled inside Next and a uuid advisory inside exceljs; neither processes untrusted input here.

## Operations checklist
Vercel env vars: see `.env.example`. Sender must be on the verified Resend domain (`reports@mail.loveboo.com`). Rotate any key that has been shared in chat or email.
