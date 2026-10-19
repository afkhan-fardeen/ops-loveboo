import assert from "node:assert/strict";
import { test } from "node:test";
import { buildRegistrationEmail } from "../lib/registration-email";

const event = { name: "Dubai Baby Expo 2026", collection_text: "Booth 12, Hall 3." };

test("winner: names the prize and how to collect", () => {
  const m = buildRegistrationEmail({ first_name: "Sara", email: "sara@example.com", prize: "Baby Bundle" }, event, "https://ops.loveboo.com");
  assert.match(m.subject, /won Baby Bundle/);
  assert.match(m.html, /Hello Sara/);
  assert.match(m.html, /Booth 12, Hall 3\./);
  assert.match(m.text, /How to collect/);
});

test("no prize: thanks for playing, no collection block", () => {
  const m = buildRegistrationEmail({ first_name: "Sara", email: "sara@example.com", prize: null }, event);
  assert.match(m.subject, /Thanks for visiting/);
  assert.doesNotMatch(m.html, /How to collect/);
});

test("guest text is escaped", () => {
  const m = buildRegistrationEmail({ first_name: "<b>x</b>", email: "a@b.com", prize: "<script>" }, null);
  assert.doesNotMatch(m.html, /<script>/);
  assert.match(m.html, /&lt;b&gt;x&lt;\/b&gt;/);
});
