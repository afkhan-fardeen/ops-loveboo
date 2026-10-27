"use client";
import { useState } from "react";
import { ActionIcon, Button, Group, Stack, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { Product } from "@/lib/mkt";

/** The products to push in an email: a name, an optional link (e.g. the product page) and an optional note. Submits a hidden `products` JSON array. */
export default function ProductsField({ initial }: { initial: Product[] }) {
  const [list, setList] = useState<Product[]>(initial);
  const set = (i: number, patch: Partial<Product>) => setList(list.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  return (
    <Stack gap={6}>
      <input type="hidden" name="products" value={JSON.stringify(list)} />
      <div style={{ fontSize: 14, fontWeight: 500 }}>Products to push <span style={{ fontWeight: 400, opacity: 0.65 }}>· name, link to the product, and a note if useful</span></div>
      {list.map((p, i) => (
        <Group key={i} gap={6} wrap="nowrap" align="flex-start">
          <Stack gap={4} style={{ flex: 1 }}>
            <TextInput placeholder="Product name, e.g. Baby Body Wash" value={p.name} onChange={(e) => set(i, { name: e.currentTarget.value })} maxLength={120} />
            <Group gap={6} wrap="nowrap">
              <TextInput placeholder="Link (https://loveboo.com/products/…)" type="url" value={p.url} onChange={(e) => set(i, { url: e.currentTarget.value })} style={{ flex: 1 }} />
              <TextInput placeholder="Note, e.g. hero, 20% off" value={p.note} onChange={(e) => set(i, { note: e.currentTarget.value })} style={{ flex: "0 0 40%" }} maxLength={200} />
            </Group>
          </Stack>
          <ActionIcon variant="subtle" color="red" mt={4} aria-label="Remove product" onClick={() => setList(list.filter((_, j) => j !== i))}><IconTrash size={16} /></ActionIcon>
        </Group>
      ))}
      <div><Button variant="default" size="xs" leftSection={<IconPlus size={14} />} onClick={() => setList([...list, { name: "", url: "", note: "" }])} disabled={list.length >= 30}>Add product</Button></div>
    </Stack>
  );
}
