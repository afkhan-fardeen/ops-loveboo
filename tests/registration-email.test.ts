import assert from "node:assert/strict";
import { test } from "node:test";
import { outcomeOf } from "../lib/outcome";
import { buildDiscountEmail, buildRegistrationEmail, isQrSignup } from "../lib/registration-email";

const event = { name: "Dubai Baby Expo 2026", collection_text: "Booth 12, Hall 3." };

test("winner: names the prize and how to collect", () => {
  const m = buildRegistrationEmail({ first_name: "Sara", email: "sara@example.com", prize: "Baby Bundle", prize_image_url: "https://example.com/p.png" }, event);
  assert.match(m.subject, /Sara, you won Baby Bundle/);
  assert.match(m.html, /Congratulations, Sara!/);
  assert.match(m.html, /Booth 12, Hall 3\./);
  assert.match(m.text, /How to collect/);
  assert.match(m.html, /<img src="https:\/\/example\.com\/p\.png"/);
});

test("no prize: thanks for playing, no collection block", () => {
  const m = buildRegistrationEmail({ first_name: "Sara", email: "sara@example.com", prize: null }, event);
  assert.match(m.subject, /Thanks for stopping by/);
  assert.doesNotMatch(m.html, /How to collect/);
});

test("guest text is escaped", () => {
  const m = buildRegistrationEmail({ first_name: "<b>x</b>", email: "a@b.com", prize: "<script>" }, null);
  assert.doesNotMatch(m.html, /<script>/);
  assert.match(m.html, /&lt;b&gt;x&lt;\/b&gt;/);
});

test("non-https prize image is never embedded", () => {
  const m = buildRegistrationEmail({ first_name: "Sara", email: "s@e.com", prize: "X", prize_image_url: "javascript:alert(1)" }, null);
  assert.doesNotMatch(m.html, /javascript:/);
});

test("QR sign-ups are recognised by their source", () => {
  assert.equal(isQrSignup("baby_expo_2026_qr"), true);
  assert.equal(isQrSignup("baby_expo_2026"), false);
  assert.equal(isQrSignup(null), false);
});

test("discount email: thank-you, the code and one button", () => {
  const m = buildDiscountEmail({ first_name: "Sara", email: "sara@example.com", prize: null, source: "baby_expo_2026_qr" }, { name: "Dubai Baby Expo 2026", collection_text: "" });
  assert.equal(m.subject, "Your 10% off Love Boo code: EXPO-10OFF");
  assert.match(m.html, /10% off your order at loveboo\.com\. Your code expires in 30 days/);
  assert.match(m.html, /Thank you for signing up!/);
  assert.match(m.html, /EXPO-10OFF/);
  assert.match(m.html, /Shop now/);
  assert.match(m.text, /Your 10% off code: EXPO-10OFF/);
  assert.match(m.html, /It expires in 30 days/);
  assert.doesNotMatch(m.html, /How to collect/);
});

test("outcomeOf: QR = discount code, spin = gift or no gift", () => {
  assert.deepEqual(outcomeOf({ source: "baby_expo_2026_qr", prize: null }), { type: "qr", typeLabel: "QR code", kind: "code", label: "EXPO-10OFF discount" });
  assert.deepEqual(outcomeOf({ source: "baby_expo_2026", prize: "Mama Set" }), { type: "spin", typeLabel: "Spin & win", kind: "gift", label: "Mama Set" });
  assert.deepEqual(outcomeOf({ source: "baby_expo_2026", prize: null }), { type: "spin", typeLabel: "Spin & win", kind: "none", label: "No gift" });
});

test("spin guests never get the discount code: a gift email, or the plain thank-you", () => {
  const win = buildRegistrationEmail({ first_name: "Sara", email: "s@x.com", prize: "Mama Set", source: "baby_expo_2026" }, null);
  const none = buildRegistrationEmail({ first_name: "Sara", email: "s@x.com", prize: null, source: "baby_expo_2026" }, null);
  assert.doesNotMatch(win.html + none.html, /EXPO-10OFF/);
});
