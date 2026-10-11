# Love Boo Ops Portal — Design PRD (v0.1)

Owner: Fardeen · Date: 11 Oct 2026 · Status: Draft for build

## 1. Goal

A small internal portal for loveboo.com. **Module 1: Sales Reporting** — compute yesterday's numbers once a day, email them, and show the same numbers (plus history) in a fast, light, glass-style UI. Later modules (fulfilment, inventory, ads) plug into the same shell.

**Non-goals (v1):** multi-user roles, editable data, custom report builder, BI-style filtering, ad spend.

## 2. Engineering rules (keep it boring)

1. One job does the work: **cron → fetch → store → email**. The UI only reads stored rows.
2. No queues, no workers, no ORM. Route handlers + one SQL table.
3. Compute each number once, store it, reuse it (comparisons and MTD come from stored rows, not extra API calls).
4. If it takes 20 lines, don't write 60. No abstractions until a second module needs them.
5. Server Components by default. Client JS only for the date picker and nav state.
6. Few dependencies: `next`, `react`, `tailwindcss`, `@supabase/ssr`, `resend`. No chart library in v1 (inline SVG sparkline, ~15 lines).

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Same as SS-OPS, one mental model |
| Hosting | Vercel | Cron + env vars + preview deploys built in |
| Styling | Tailwind + CSS variables (see DESIGN-TOKENS) | Tokens in one file |
| Auth + DB | Supabase (Auth magic link + Postgres) | Already used in SS-OPS; free tier is enough |
| Data source | Shopify Admin GraphQL API (custom app, read-only) | Official, stable |
| Email | Resend (HTML string template) | 1 API call, no template engine |
| Fonts | `next/font` (self-hosted, no layout shift) | Fast |

### Flow

```
Vercel Cron (daily) ──▶ GET /api/cron/daily-report  (Bearer CRON_SECRET)
   1. day = yesterday in store timezone
   2. Shopify Admin API ──▶ net sales, orders, units, AOV, top 5 products
   3. upsert row in daily_sales (date is unique → safe to re-run)
   4. build email from today's row + stored comparison rows
   5. Resend ──▶ recipients; set emailed_at
UI pages ──▶ read daily_sales only (no live Shopify calls)
```

## 4. Module 1 — Sales Reporting

### 4.1 Metrics (v1, deliberately minimal)

| Metric | Definition |
|---|---|
| Net sales | Gross sales − discounts − returns (Shopify "net sales", excludes shipping/tax) |
| Orders | Count of orders in the day (excluding cancelled/test) |
| AOV | Net sales ÷ orders |
| Units | Total items sold |
| vs previous day | % change from stored row |
| vs same day last week | % change from stored row (date − 7) |
| Month to date | Sum of stored rows from 1st to yesterday: net sales + orders |
| Top 5 products | By net sales, name + units + net sales |

**Implementation note:** prefer one ShopifyQL query (`shopifyqlQuery`) per day for the totals and one for top products; fall back to the paginated `orders` query if ShopifyQL access isn't enabled on the app. Confirm exact ShopifyQL field names against Shopify docs at build time.

### 4.2 Email (daily)

- Subject: `Love Boo · Sales · Sat 10 Oct — £X net / N orders`
- Layout: single 600px column, Linen background, white card, wordmark at top, **4 KPI blocks** (Net sales, Orders, AOV, MTD), delta chips (teal up / ink-red down), top-5 table, "Open portal" button.
- Table-based HTML with inline styles (email clients ignore CSS variables and backdrop-filter). No images except the logo (hosted PNG, 2× size). Plain-text part included.
- Wordmark rule from toolkit: logo never recoloured outside palette, min 150px wide.
- Send time: configured via cron expression (UTC). 08:00 Bahrain = `0 5 * * *`.
- Recipients: env var `REPORT_RECIPIENTS` (comma list) in v1; a Settings page can come later.

### 4.3 Pages

| Route | Purpose |
|---|---|
| `/login` | Magic link, email allow-list |
| `/` Overview | Yesterday's KPI cards, 14-day sparkline, top products, "Send test email" |
| `/reports` | Table of past days (date, net sales, orders, AOV, emailed ✓). Click row → day detail |
| `/reports/[date]` | Day detail + email preview (same HTML as sent) |
| `/settings` | Read-only in v1: recipients, send time, store, currency |

## 5. Data model

```sql
create table daily_sales (
  date         date primary key,          -- store-timezone day
  net_sales    numeric(12,2) not null,
  orders       int           not null,
  units        int           not null,
  top_products jsonb         not null default '[]',  -- [{name, units, net}]
  currency     text          not null default 'GBP',
  emailed_at   timestamptz,
  created_at   timestamptz   not null default now()
);
alter table daily_sales enable row level security;
create policy "read for signed-in" on daily_sales for select to authenticated using (true);
-- writes happen only server-side with the service role key
```

AOV, deltas and MTD are derived at read time (cheap arithmetic, never stored).

**Backfill:** one-off script/route that loops the last 60 days through the same fetch function.

## 6. Security (simple and sufficient)

- **Auth:** Supabase magic link. Middleware checks session **and** that the email is in `ALLOWED_EMAILS`. Everything except `/login` and `/api/cron/*` is protected.
- **Cron endpoint:** requires `Authorization: Bearer ${CRON_SECRET}` (Vercel sends this automatically when `CRON_SECRET` is set). Reject otherwise.
- **Secrets** only in Vercel env vars, server-side. Never `NEXT_PUBLIC_` except the Supabase URL/anon key.
- **Shopify token:** read-only scopes (`read_orders`, plus `read_all_orders` only if backfilling beyond 60 days, `read_products`, and the reports scope if using ShopifyQL).
- **DB:** RLS on; service role key used only in the cron route.
- **Headers:** set `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options` in `next.config`.
- **Idempotency:** upsert by `date`; skip email if `emailed_at` is set (manual "resend" is a deliberate button).
- **Failure alert:** if the job throws, send a one-line failure email to the owner (same Resend call).

## 6b. Env vars

`SHOPIFY_STORE_DOMAIN`, `SHOPIFY_ADMIN_TOKEN`, `SHOPIFY_API_VERSION`, `STORE_TIMEZONE`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `REPORT_FROM`, `REPORT_RECIPIENTS`, `ALLOWED_EMAILS`, `CRON_SECRET`, `APP_URL`

## 7. UI / UX spec

### 7.1 Look and feel
Light, minimal, Shopify-admin-inspired: calm Linen canvas, frosted-glass cards, thin borders, lots of whitespace, Love Boo teal as the single strong accent, Strawberry only as a rare highlight. Brand personality (kind, natural, honest) shows in small touches — wordmark in the header, butterfly icon on empty/success states, a Meadowsweet glow behind the page — not in loud decoration. Full values in `LOVEBOO-OPS-DESIGN-TOKENS.md`.

### 7.2 Layout and responsiveness (mobile-first)

| Breakpoint | Navigation | Content |
|---|---|---|
| < 768px | **Bottom tab bar** (Overview, Reports, Settings), slim top bar with wordmark | Single column, KPI cards in 2×2 grid, tables become stacked cards |
| 768–1199px | Collapsed icon rail (64px) | 2-column grid |
| ≥ 1200px | Expanded sidebar (232px) | Up to 4 KPI cards per row, max content width 1200px |

- Touch targets ≥ 44px. Body text ≥ 16px on mobile (prevents iOS zoom).
- Tables: real `<table>` on desktop; on mobile each row renders as a card (CSS only, via `display:block` on small screens).
- Numbers: tabular figures, right-aligned in tables.
- States for every screen: loading (skeleton, no spinners), empty (butterfly + one line), error (plain message + retry).

### 7.3 Components (build only these)
`AppShell`, `Card` (glass), `Kpi` (label, value, delta chip), `Delta`, `Sparkline` (inline SVG), `DataTable`, `Button` (primary teal / ghost), `Badge`, `Skeleton`, `EmptyState`. Nothing else in v1.

### 7.4 Glass rules (for speed and legibility)
- Blur only on **cards and the nav surface**; never on table rows or full-screen overlays.
- Max 3 blurred layers on screen at once. 12px blur on mobile, 20px on desktop.
- Always provide an opaque fallback (`@supports not (backdrop-filter)` and `prefers-reduced-transparency`).
- Text sits on ≥ 70% white glass so contrast stays AA.

### 7.5 Accessibility
WCAG AA contrast (see tokens), visible focus ring, semantic landmarks, delta chips use icon + text not colour alone, respect `prefers-reduced-motion`.

## 8. Performance budget

| Item | Target |
|---|---|
| LCP (mobile, 4G) | < 1.8s |
| JS per page | < 90 KB gzip |
| CLS | < 0.05 |
| Fonts | ≤ 2 families, `font-display: swap`, subset Latin |
| Data | Pages read ≤ 60 rows; Overview does 1 query (last 15 days) |
| Caching | Pages are dynamic but cheap; add `revalidate` or Vercel Data Cache only if needed |

## 9. Folder structure

```
app/
  (auth)/login/page.tsx
  (app)/layout.tsx          # AppShell
  (app)/page.tsx            # Overview
  (app)/reports/page.tsx
  (app)/reports/[date]/page.tsx
  (app)/settings/page.tsx
  api/cron/daily-report/route.ts
lib/
  shopify.ts      # fetchDay(date) → {net_sales, orders, units, top_products}
  report.ts       # run(date): fetch → upsert → email
  email.ts        # buildEmail(row, compare) → {subject, html, text}
  supabase.ts     # server + browser clients
  format.ts       # money(), pct(), date()
styles/tokens.css
middleware.ts     # auth + allow-list
vercel.json       # cron
```

## 10. Build phases

1. **Foundation (½ day):** repo, Vercel project, Supabase project, tokens + AppShell, magic-link auth.
2. **Data (½ day):** `shopify.ts`, `daily_sales` table, backfill 60 days, verify numbers against Shopify admin.
3. **Email (½ day):** template, Resend domain verification (SPF/DKIM on loveboo.com or a subdomain), test send.
4. **UI (1 day):** Overview, Reports, day detail, responsive pass.
5. **Harden (½ day):** cron secret, failure email, security headers, Lighthouse mobile check, 3 days of dry-run emails before cutover.

## 11. Acceptance criteria

- Daily email arrives by the configured time with figures matching Shopify admin within rounding.
- Re-running the cron the same day updates data but does not send a duplicate.
- All pages usable at 360px width; Lighthouse mobile Performance ≥ 90, Accessibility ≥ 95.
- Unauthenticated users cannot reach any page or data; cron endpoint rejects missing/incorrect secret.

## 12. Open decisions

1. **Report currency:** GBP only, or also show a BHD equivalent like your other reports?
2. **Timezone for "a day":** the Shopify store timezone (recommended) vs Asia/Bahrain.
3. **Vercel plan:** Hobby cron runs once a day with up to ~1h timing slack; Pro is exact. Does 8:00 need to be exact?
4. **Recipients:** just you, or a team list?
5. **Fonts:** Magneta and Geograph are licensed. Do you have web-font licences? If not, v1 uses the free stand-ins listed in the tokens file.
6. **Toolkit inconsistency:** the toolkit lists Dark Teal and Fern with the same hex (#006D68) while the swatches render visibly different. Confirm the real Dark Teal value (tokens use #00504E as a placeholder).
7. **Store scope:** Love Boo is UK/GBP only for now (matches your SEO focus). Add a `store` column later if GCC is added.