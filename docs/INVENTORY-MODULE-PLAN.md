# Inventory module — plan (v0.1)

Owner: Fardeen · Status: proposal for discussion

## 1. What we found in Love Boo's Shopify (12 Oct 2026)
- **3 locations:** Fidelity Fulfilment – UK (Daventry, the 3PL), Baby Expo (Dubai), YBA Kanoo Tower (Bahrain).
  Essentially all stock (186,888 units on hand) is at the UK 3PL; Dubai and Bahrain hold 0.
- **Catalogue:** 62 active products, 93 active variants (57 more are drafts). 25 variants are **bundles** and have their *own* stock (26–88 units each), so bundles are assembled/kitted in advance, not virtual.
- **Stock vs sales:** component items show 1,000–4,800 units each (median 1,177) but only 304 units were sold in the last 30 days across 52 variants. Days of cover are in the **years** for many items. Either a lot of dead stock, or quantities are not what they seem (cases, 3PL sync). 37 tracked variants with stock had **no sales in 30 days** (56,445 units).
- **Data quality:** 50 of 93 variants have **no unit cost**; 5 have no SKU; 4 are not inventory-tracked. Nothing is incoming; 70 units committed.
- **Only 1** tracked variant is at zero and none are low — the risk here is *overstock and bundle availability*, not stock-outs.

## 2. What a standard ("universal") inventory module contains
This is the model ERP/WMS-lite systems share; we adopt it, scaled down.
1. **Item master** — SKU/variant, barcode, unit of measure, cost, supplier, tracking flags (lot/expiry), BOM for kits.
2. **Quantity states per location** — on hand, available, committed/allocated, reserved, incoming/on order, damaged, quality-control. (Shopify exposes these.)
3. **Stock ledger** — every change is an append-only movement with a reason: receipt, sale/ship, return, adjustment, transfer in/out, assembly, write-off. Stock = sum of movements; this gives audit and shrinkage.
4. **Replenishment** — reorder point = (daily demand × lead time) + safety stock; min/max; suggested order quantity; **days of cover**; ABC classification (A = the few items that make most revenue).
5. **Purchasing** — suppliers, purchase orders (draft → sent → partly received → received → closed), lead times, landed cost, receiving with discrepancies.
6. **Transfers** between locations (UK → Dubai → Bahrain).
7. **Counting** — stocktake / cycle counts with variance and an approval step before adjusting.
8. **Lots and expiry (FEFO)** — important for skincare and baby products (shelf life, PAO).
9. **Kitting / BOM** — a bundle is made of components; bundle availability = min(component stock ÷ quantity); assembly orders consume components.
10. **Valuation and costing** — weighted-average or FIFO cost, inventory value, COGS, gross margin.
11. **KPIs and alerts** — out of stock, low stock, overstock/dead stock, turnover, days of cover, sell-through, stock value, ageing.
12. **Audit and permissions** — who changed what; view vs adjust vs approve.

## 3. Principles for us
- **Shopify stays the system of record** for on-hand/available per location (it is where orders decrement stock, and the 3PL syncs into it). The portal *reads, analyses and augments*: reorder settings, suppliers, POs, counts, lots, notes.
- **Read-only first.** No writes to Shopify until the numbers are trusted. Later writes (receipts, transfers, count adjustments) go through approved actions only.
- **Snapshot daily** so we can chart stock over time and compute velocity without hammering the API.
- **Useful on first login, not a setup project.** Sensible defaults from sales velocity; nothing blocks on someone filling forms.

## 4. Phases (lean)
**Phase 1 — Stock visibility (read-only).** Stock overview (units, SKUs, value where cost known, out of stock, low), per-variant table with search, filters and location split; **days of cover** from 30-day sales; **overstock / slow-mover list** (this store's biggest finding); bundle view showing own stock vs what components could make; **data-health card** (missing cost, SKU, untracked); daily stock snapshot table.
**Phase 2 — Replenishment.** Per-SKU reorder point, safety stock, lead time, supplier (defaults from velocity, editable); suggested reorder list; low-stock / stock-out alerts in the daily email or a small digest.
**Phase 3 — Purchasing and receiving.** Suppliers, POs, expected arrivals ("incoming"), receiving that updates Shopify stock, landed cost.
**Phase 4 — Control.** Transfers between the three locations, stocktake/cycle counts with approval, adjustment reasons and the ledger, bundle assembly (BOM), lots/expiry if needed.
**Phase 5 — Valuation and margin.** Weighted-average cost, inventory value, COGS, margin by SKU and by bundle (combined with the Sales module).

## 5. Data model (Phase 1–2)
- `inventory_snapshots(date, variant_id, sku, location_id, on_hand, available, committed, incoming, unit_cost)` — one row per variant per location per day.
- `items(variant_id, sku, title, product_type, is_bundle, supplier_id, lead_time_days, safety_stock, reorder_point, reorder_qty, notes)` — our augmentations to Shopify's item.
- Derived at read time: velocity, days of cover, value, status (out / low / healthy / overstock / dead).
- Later: `suppliers`, `purchase_orders`, `po_lines`, `stock_movements`, `counts`, `lots`, `bom_components`.

## 6. Permissions
New module id `inventory`, given per user like Sales. View for everyone with the module; adjust/approve actions admin-only.

## 7. Decisions we need
1. **Is the UK 3PL (Fidelity) the real source of truth?** Are 4,800 units per SKU real, or cases/packs or a sync artefact? This decides whether "dead stock" is a finding or a data issue.
2. **Bundles:** physically pre-assembled (own stock, as the data suggests) or should availability be derived from components?
3. **Purchasing:** do you want POs in the portal, or is Phase 1–2 (visibility + reorder suggestions) enough for now?
4. **Expiry/batches:** do you need lot and expiry tracking?
5. **Costs:** fill the 50 missing unit costs in Shopify, or store costs in the portal?
6. **Write-back:** read-only for now, or should the portal be able to adjust Shopify stock later?
