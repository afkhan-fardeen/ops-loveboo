import assert from "node:assert/strict";
import { test } from "node:test";
import { ago, overall } from "../lib/health";
import { sourceFrom } from "../lib/jobs";

test("overall: the worst status wins", () => {
  assert.equal(overall([{ status: "ok" }, { status: "ok" }]), "ok");
  assert.equal(overall([{ status: "ok" }, { status: "warn" }]), "warn");
  assert.equal(overall([{ status: "warn" }, { status: "bad" }, { status: "ok" }]), "bad");
  assert.equal(overall([]), "ok");
});

test("ago reads naturally", () => {
  const now = Date.parse("2026-10-14T10:00:00Z");
  assert.equal(ago("2026-10-14T09:59:30Z", now), "just now");
  assert.equal(ago("2026-10-14T09:45:00Z", now), "15 min ago");
  assert.equal(ago("2026-10-14T05:00:00Z", now), "5 h ago");
  assert.equal(ago("2026-10-11T10:00:00Z", now), "3 days ago");
});

test("sourceFrom tells the callers apart", () => {
  assert.equal(sourceFrom("vercel-cron/1.0"), "vercel");
  assert.equal(sourceFrom("github-actions-scheduler"), "github");
  assert.equal(sourceFrom("curl/8.0"), "manual");
  assert.equal(sourceFrom(null), "manual");
});
