import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

/** Mantine's dotted parts (<List.Item>, <Table.Td>, <Menu.Target>…) don't exist when used from a server-rendered file and crash the page
 *  ("Element type is invalid… got: undefined"). Server files must use the named exports (ListItem, TableTd…); dotted parts are fine in "use client" files. */
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") ? [p] : []; });

test("server-rendered files don't use Mantine's dotted sub-components", () => {
  const bad: string[] = [];
  for (const file of [...walk("app"), ...walk("components")]) {
    const src = readFileSync(file, "utf8");
    if (/^\s*["']use client["']/.test(src)) continue;
    const m = src.match(/<[A-Z][A-Za-z]*\.[A-Z][A-Za-z]*[\s>/]/);
    if (m) bad.push(`${file}: ${m[0].trim()}`);
  }
  assert.deepEqual(bad, [], `Use named exports (e.g. ListItem) in server files:\n${bad.join("\n")}`);
});
