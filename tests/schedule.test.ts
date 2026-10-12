import assert from "node:assert/strict";
import { test } from "node:test";
import { isDue, isHHMM, minutesNow, toMinutes } from "../lib/schedule";

test("toMinutes / isHHMM validate and convert times", () => {
  assert.equal(toMinutes("08:30"), 510);
  assert.equal(toMinutes("00:00"), 0);
  assert.equal(toMinutes("23:59"), 1439);
  assert.equal(toMinutes("24:00"), null);
  assert.equal(toMinutes("8:30"), null);
  assert.equal(isHHMM("07:05"), true);
  assert.equal(isHHMM("07:5"), false);
});

test("isDue compares the current time in the send timezone", () => {
  // 05:10 UTC is 08:10 in Bahrain (UTC+3, no DST)
  const now = new Date("2026-10-12T05:10:00Z");
  assert.equal(minutesNow("Asia/Bahrain", now), 8 * 60 + 10);
  assert.equal(isDue("08:00", "Asia/Bahrain", now), true);
  assert.equal(isDue("08:10", "Asia/Bahrain", now), true);
  assert.equal(isDue("08:11", "Asia/Bahrain", now), false);
  assert.equal(isDue("bad", "Asia/Bahrain", now), false);
  // just after midnight in Bahrain is still "yesterday" in UTC
  assert.equal(minutesNow("Asia/Bahrain", new Date("2026-10-11T21:05:00Z")), 5);
});
