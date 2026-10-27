"use client";
import { useState } from "react";
import { ActionIcon, Button, Group, Stack, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { Link } from "@/lib/mkt";

/** A repeating label + URL field. Submits as one hidden input, `links`, holding a JSON array. */
export default function LinksField({ initial, description }: { initial: Link[]; description?: string }) {
  const [list, setList] = useState<Link[]>(initial.length ? initial : []);
  const set = (i: number, patch: Partial<Link>) => setList(list.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  return (
    <Stack gap={6}>
      <input type="hidden" name="links" value={JSON.stringify(list)} />
      <div style={{ fontSize: 14, fontWeight: 500 }}>Links{description && <span style={{ fontWeight: 400, opacity: 0.65 }}> · {description}</span>}</div>
      {list.map((l, i) => (
        <Group key={i} gap={6} wrap="nowrap" align="flex-start">
          <TextInput placeholder="Label, e.g. Banners folder" value={l.label} onChange={(e) => set(i, { label: e.currentTarget.value })} style={{ flex: "0 0 38%" }} maxLength={80} />
          <TextInput placeholder="https://drive.google.com/…" type="url" value={l.url} onChange={(e) => set(i, { url: e.currentTarget.value })} style={{ flex: 1 }} />
          <ActionIcon variant="subtle" color="red" mt={4} aria-label="Remove link" onClick={() => setList(list.filter((_, j) => j !== i))}><IconTrash size={16} /></ActionIcon>
        </Group>
      ))}
      <div><Button variant="default" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setList([...list, { label: "", url: "" }])} disabled={list.length >= 20}>Add link</Button></div>
    </Stack>
  );
}
