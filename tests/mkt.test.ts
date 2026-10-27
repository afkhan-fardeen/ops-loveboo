import assert from "node:assert/strict";
import { test } from "node:test";
import { campaignState, cleanLinks, cleanMarkets, countdown, daysBetween, describeLink, isOverdue, marketingAccess, withMarketingAccess } from "../lib/mkt";

test("describeLink recognises Drive, Docs, Canva and plain links", () => {
  assert.equal(describeLink("https://drive.google.com/drive/folders/abc123").kind, "drive_folder");
  assert.equal(describeLink("https://drive.google.com/file/d/abc/view").kind, "drive_file");
  assert.equal(describeLink("https://docs.google.com/document/d/abc/edit").label, "Google Doc");
  assert.equal(describeLink("https://docs.google.com/spreadsheets/d/abc").kind, "sheet");
  assert.equal(describeLink("https://docs.google.com/presentation/d/abc").kind, "slides");
  assert.equal(describeLink("https://www.canva.com/design/xyz").kind, "canva");
  assert.deepEqual(describeLink("https://www.loveboo.com/pages/black-friday"), { kind: "link", label: "loveboo.com", host: "loveboo.com" });
  assert.equal(describeLink("not a url").kind, "link");
});

test("cleanLinks keeps only http(s) links and trims labels", () => {
  const out = cleanLinks(JSON.stringify([{ label: "  Banners  ", url: " https://drive.google.com/x " }, { label: "bad", url: "javascript:alert(1)" }, { label: "", url: "ftp://x" }, { url: "http://ok.com" }]));
  assert.deepEqual(out, [{ label: "Banners", url: "https://drive.google.com/x" }, { label: "", url: "http://ok.com" }]);
  assert.deepEqual(cleanLinks("garbage"), []);
});

test("cleanMarkets trims, de-duplicates and accepts JSON or comma text", () => {
  assert.deepEqual(cleanMarkets('["UAE"," Bahrain ","UAE",""]'), ["UAE", "Bahrain"]);
  assert.deepEqual(cleanMarkets("UAE, KSA"), ["UAE", "KSA"]);
});

test("day maths and campaign state", () => {
  assert.equal(daysBetween("2026-11-01", "2026-11-04"), 3);
  assert.equal(daysBetween("2026-11-04", "2026-11-01"), -3);
  const bf = { starts_on: "2026-11-24", ends_on: "2026-11-30" };
  assert.equal(campaignState(bf, "2026-11-23"), "upcoming");
  assert.equal(campaignState(bf, "2026-11-24"), "live");
  assert.equal(campaignState(bf, "2026-11-30"), "live");
  assert.equal(campaignState(bf, "2026-12-01"), "ended");
  assert.equal(countdown(bf, "2026-10-28"), "Starts in 27 days");
  assert.equal(countdown(bf, "2026-11-23"), "Starts tomorrow");
  assert.equal(countdown(bf, "2026-11-29"), "Ends tomorrow");
  assert.equal(countdown(bf, "2026-11-30"), "Last day today");
  assert.equal(countdown(bf, "2026-12-03"), "Ended 3 days ago");
});

test("only unfinished work can be overdue", () => {
  const today = "2026-11-10";
  assert.equal(isOverdue({ status: "todo", due_on: "2026-11-09" }, today), true);
  assert.equal(isOverdue({ status: "in_review", due_on: "2026-11-09" }, today), true);
  assert.equal(isOverdue({ status: "ready", due_on: "2026-11-09" }, today), false);
  assert.equal(isOverdue({ status: "done", due_on: "2026-11-09" }, today), false);
  assert.equal(isOverdue({ status: "todo", due_on: "2026-11-10" }, today), false);
  assert.equal(isOverdue({ status: "todo", due_on: null }, today), false);
});

test("Marketing access is read from, and written to, the module list without touching other modules", () => {
  assert.equal(marketingAccess(["reports"]), "none");
  assert.equal(marketingAccess(["reports", "marketing"]), "view");
  assert.equal(marketingAccess(["marketing", "marketing_edit"]), "edit");
  assert.equal(marketingAccess(["marketing_edit"]), "none");   // the edit right alone doesn't let anyone in
  assert.deepEqual(withMarketingAccess(["reports"], "edit"), ["reports", "marketing", "marketing_edit"]);
  assert.deepEqual(withMarketingAccess(["reports", "marketing", "marketing_edit"], "view"), ["reports", "marketing"]);
  assert.deepEqual(withMarketingAccess(["events", "marketing", "marketing_edit"], "none"), ["events"]);
});
