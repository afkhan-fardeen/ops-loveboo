import assert from "node:assert/strict";
import { test } from "node:test";
import { daysLeft, hostedImage, buildReminderEmail, discountLink, endsLabel } from "../lib/reminder-email";

const products = [
  { title: "No More Knots Detangling Spray", handle: "no-more-knots", image: "https://cdn.shopify.com/a.jpg?v=1" },
  { title: "Soft & Swishy Gentle Shampoo", handle: "soft-swishy", image: "https://cdn.shopify.com/b.jpg" },
  { title: "Tame My Mane Gentle Conditioner", handle: "tame-my-mane", image: "https://cdn.shopify.com/c.jpg" },
];

test("reminder: short subject, true end date, the code, one offer", () => {
  const m = buildReminderEmail({ first_name: "Sara", email: "sara@example.com" }, products);
  assert.ok(m.subject.length <= 45, `subject is ${m.subject.length} characters`);
  assert.equal(endsLabel(), "23 November");
  assert.match(m.html, /EXPO-10OFF/);
  assert.match(m.html, /Hi Sara/);
  assert.match(m.html, /After <b[^>]*>23 November/);
  assert.match(m.html, /Unsubscribe/);
  assert.match(m.text, /Unsubscribe/);
});

test("reminder: buttons use the store discount link so the code is applied, with tracking", () => {
  const link = discountLink("/products/no-more-knots");
  assert.ok(link.startsWith("https://loveboo.com/discount/EXPO-10OFF?redirect="));
  assert.match(decodeURIComponent(link), /\/products\/no-more-knots\?utm_source=email&utm_medium=reminder&utm_campaign=expo_code_reminder/);
  const m = buildReminderEmail({ first_name: "Sara", email: "sara@example.com" }, products);
  assert.equal((m.html.match(/loveboo\.com\/discount\/EXPO-10OFF/g) ?? []).length >= 5, true);   // 2 main buttons + 3 product cards
  assert.match(m.html, /<img src="https:\/\/cdn\.shopify\.com\/a\.jpg/);
  assert.equal(hostedImage("soft-swishy-gentle-shampoo", "x"), "https://ops.loveboo.com/email/shampoo.jpg");
});

test("reminder: no name falls back to Hi there, and text is escaped", () => {
  assert.match(buildReminderEmail({ first_name: "", email: "info@example.com" }, products).html, /Hi there/);
  assert.doesNotMatch(buildReminderEmail({ first_name: "<b>x</b>", email: "x@example.com" }, products).html, /<b>x<\/b>/);
});

test("reminder: urgency is real and counts down to the true end date", () => {
  assert.equal(daysLeft(new Date("2026-11-03T09:00:00Z")), 20);
  assert.equal(daysLeft(new Date("2026-11-22T09:00:00Z")), 1);
  assert.equal(daysLeft(new Date("2026-11-30T09:00:00Z")), 0);
  assert.match(buildReminderEmail({ first_name: "Sara", email: "s@example.com" }, products).subject, /ends 23 November/);
});
