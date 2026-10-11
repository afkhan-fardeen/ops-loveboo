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
