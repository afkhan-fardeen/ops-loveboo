# Sales module — plan (v0.2)

Owner: Fardeen · Status: Phase 1 shipped, Phase 2–4 proposed

## Purpose
One place for Love Boo's sales: yesterday at a glance, any past day, any period, and the daily email. Read-only on Shopify, numbers stored once and reused.

## Principles
- **One definition of "sales"**: net sales = after discounts and returns, excluding VAT and shipping. Draft orders excluded. Same number in the portal, the email and the Excel.
- **Compute once, store, reuse.** The nightly job writes one row per store-day; every view is arithmetic on stored rows.
- **Fast on a phone.** Server-rendered pages, lazy charts, skeletons, no layout shift.
- **Honest data.** Always show which day/period, currency, and when the data was last refreshed.

## Information architecture
| Section | Route | Status |
|---|---|---|
| Overview (one day, date switcher, orders, products, locations, share) | `/sales` | Done |
| Reports (every stored day) | `/sales/reports` | Done |
| Live "Today so far" strip | on Overview | Phase 1.5 (this iteration) |
| Period reports (range picker, comparison, export) | `/sales/reports?range=` | Phase 2 |
| Products (best/worst sellers over a period) | `/sales/products` | Phase 3 |
| Locations (country/city breakdown over a period) | `/sales/locations` | Phase 3 |
| Orders (search across days) | `/sales/orders` | Phase 3 |
| Settings (recipients, email on/off, Excel on/off) | `/sales/settings` | Done (admin) |

## Phases
**Phase 1 — Daily report (done):** nightly Shopify fetch → store → email + Excel; day view with date switcher; admin-managed recipients; module access per user.

**Phase 1.5 — Feel (this iteration):** live "Today so far" (auto-refresh, paused when the tab is hidden); page transitions; skeletons; phone-friendly tables (secondary columns hide on small screens); button/row micro-interactions.

**Phase 2 — Period reports:** quick ranges (Yesterday, Last 7, Last 30, This month, Last month, Custom); totals with change vs the previous equal period; daily chart; daily table; Excel export for the range; shareable URL.

**Phase 3 — Drill-downs:** Products and Locations pages (ranked, with share-of-total and change); Orders page with search and filters (needs per-order storage beyond 60 days).

**Phase 4 — Operations:** "Sync now" button (admin) and job health (last run, last error); weekly summary email option; optional send-time setting once on a plan with hourly cron; targets/goals on the Overview.

## Data
- `daily_sales`: one row per store-day (net, orders, units, discounts, top products, locations, order list, emailed_at).
- Live today is **not stored**: fetched on demand, cached 60 s server-side.
- Period views sum stored rows; no extra Shopify calls.

## Open decisions
1. **Total sales definition** in the email: net (current) vs Shopify's "Total sales" (adds shipping + VAT).
2. **Location**: shipping country + city (current) vs country only.
3. **Stores**: Love Boo only for now; add a `store` column if another store joins.
4. **Retention**: keep daily rows forever (tiny) — confirm.
