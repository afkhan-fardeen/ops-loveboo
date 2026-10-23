/** What a guest got, read from how they signed up. Shared by the Events screen and the emails. */
export const DISCOUNT_CODE = "EXPO2026";

/** Guests who signed up through the QR code page (their source ends in "_qr") get a discount code, not a prize. */
export const isQrSignup = (source?: string | null) => /_qr$/.test(source ?? "");

export type Outcome = {
  type: "qr" | "spin";
  typeLabel: "QR code" | "Spin & win";
  /** gift = won a prize; code = got the discount code (QR sign-up, or played and won no gift) */
  kind: "gift" | "code";
  label: string;
};

export function outcomeOf(r: { source?: string | null; prize?: string | null }): Outcome {
  if (isQrSignup(r.source)) return { type: "qr", typeLabel: "QR code", kind: "code", label: `${DISCOUNT_CODE} discount` };
  if (r.prize?.trim()) return { type: "spin", typeLabel: "Spin & win", kind: "gift", label: r.prize.trim() };
  return { type: "spin", typeLabel: "Spin & win", kind: "code", label: `No gift · ${DISCOUNT_CODE} sent` };
}
