# Sales module — plan (v0.3)

Owner: Fardeen · Status: Phases 1, 1.5 and 2 shipped; 3–5 proposed

## Is this the best Sales module yet?
Not yet. It is now a solid, correct foundation, but "best" means answering the questions a store owner actually asks each day, quickly, on a phone.

**What it does well today**
- Numbers are correct and tie out: day total = products = locations = orders, and matches Shopify's own ShopifyQL net sales to the penny (checked 6–10 Oct 2026).
- One definition everywhere (portal, email, Excel): net sales after all discounts, excluding VAT and shipping, adjusted for returns, draft orders excluded.
- Fast, readable, live "Today so far", date switcher, period reports with comparison, Excel export, admin-managed recipients and access.

**Gaps vs. a best-in-class module**
1. No answers to "why": nothing explains what moved (which product, which country).
2. No goals/targets, so no "are we on track this month?".
3. No alerts: the owner finds out about a bad day only by looking.
4. No order-level search (find an order, a customer, a discount code).
5. Product history is limited to each day's top 15; no per-product trend, no returns view.
6. No data-health view (when did the job last run, did it fail, can I re-sync a day?).
7. Customer lens missing (new vs returning, repeat rate).

## Principles (unchanged)
Compute once, store, reuse. One definition of sales. Server-rendered and fast. Always show the period, currency and freshness. Read-only on Shopify.

## Information architecture
| Section | Route | Status |
|---|---|---|
| Overview: one day, date switcher, live today, orders, products, locations | `/sales` | Done |
| Reports: period (7d/30d/month/last month/custom), vs previous period, chart, days/products/locations, Excel | `/sales/reports` | Done |
| Settings: recipients, email on/off, Excel on/off, test send | `/sales/settings` | Done (admin) |
| Insights strip on Overview/Reports ("what changed") | on both | Phase 3 |
| Products: ranking, trend, share, returns | `/sales/products` | Phase 3 |
| Locations: country/city ranking and trend | `/sales/locations` | Phase 3 |
| Orders: search/filter across days, export | `/sales/orders` | Phase 4 |
| Targets: monthly goal, pace, projected finish | Overview card | Phase 4 |
| Alerts: email when a day is X% below the usual for that weekday | Settings | Phase 4 |
| Health: last run, last error, "Sync a day" button | `/sales/health` (admin) | Phase 5 |

## Phases
- **Phase 1–2 (done):** daily job → store → email + Excel; day view; live today; period reports with comparison and export.
- **Phase 3 — Understand (next):** "What changed" insights (biggest mover product, top growing country, best/worst day vs average); Products and Locations pages with trends. Needs: store all products per day (not just top 15) in a child table.
- **Phase 4 — Act:** targets and pace; weekday-aware alerts; Orders explorer (needs an `orders` table with one row per order: id, time, customer id hash, discount codes, net, country).
- **Phase 5 — Operate:** health page, re-sync a day, weekly summary email, send-time setting (needs Vercel Pro hourly cron), optional second store.

## Data
- `daily_sales`: one row per store-day: net, discounts, orders, units, top 15 products, locations, order list, emailed_at.
- Live today is not stored: fetched on demand, cached 60 s, shared across viewers.
- Period views sum stored rows (no extra Shopify calls).
- Phase 3–4 add `order_items` / `orders` tables so products and orders can be queried without JSON blobs.

## Open decisions
1. "Total sales" in the email: net (current) vs Shopify's "Total sales" (adds shipping + VAT).
2. Location = shipping country + city (current).
3. Targets: monthly net-sales goal per month, set by an admin?
4. Alert threshold and recipients.
