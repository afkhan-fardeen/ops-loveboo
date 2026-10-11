/** Raw money for one order line, all in the shop currency. `vat` is the VAT inside the line price (0 when prices exclude tax). */
export type RawLine = { quantity: number; currentQuantity: number; original: number; allocated: number; vat: number };

/**
 * Splits a line into what counts as sales, what was discounted, and what was returned, all excluding VAT.
 * `kept` is the share still standing after returns.
 */
export function lineAmounts(l: RawLine) {
  const kept = l.quantity ? l.currentQuantity / l.quantity : 1;
  const afterDiscount = l.original - l.allocated;
  const exVat = afterDiscount - l.vat;
  return {
    net: exVat * kept,
    // Discount ex-VAT, so net + discount ties back to pre-discount sales.
    discount: (afterDiscount > 0 ? l.allocated * (exVat / afterDiscount) : l.allocated) * kept,
    returned: exVat * (1 - kept),
  };
}

export type RefundInput = {
  taxesIncluded: boolean;
  items: { quantity: number; subtotal: number; tax: number }[];
  shipping: { subtotal: number; tax: number }[];
};

/**
 * What one refund removes from sales, in the shop currency. When prices include VAT, Shopify's refund
 * subtotals include it too, so the ex-VAT value is subtotal − tax. Mirrors Shopify's Sales report:
 * returns (items ex VAT), shipping (ex VAT), tax, and the total taken back from "Total sales".
 */
export function refundAmounts(r: RefundInput) {
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const itemsSub = sum(r.items.map((i) => i.subtotal)), itemsTax = sum(r.items.map((i) => i.tax));
  const shipSub = sum(r.shipping.map((s) => s.subtotal)), shipTax = sum(r.shipping.map((s) => s.tax));
  const ex = (sub: number, tax: number) => (r.taxesIncluded ? sub - tax : sub);
  const gross = (sub: number, tax: number) => (r.taxesIncluded ? sub : sub + tax);
  return {
    returnsEx: ex(itemsSub, itemsTax),
    shippingEx: ex(shipSub, shipTax),
    tax: itemsTax + shipTax,
    total: gross(itemsSub, itemsTax) + gross(shipSub, shipTax),
    units: sum(r.items.map((i) => i.quantity)),
  };
}
