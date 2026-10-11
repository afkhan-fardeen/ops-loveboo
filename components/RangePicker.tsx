"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Group, Loader, SegmentedControl } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconCalendar } from "@tabler/icons-react";

const shift = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;

/** Period selector: quick ranges plus a custom range. State lives in the URL (?from=&to=). */
export default function RangePicker({ from, to, min, max }: { from: string; to: string; min: string; max: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const clamp = (d: string) => (d < min ? min : d);
  const lastMonthEnd = shift(monthStart(max), -1);
  const presets = [
    { key: "7d", label: "7 days", from: clamp(shift(max, -6)), to: max },
    { key: "30d", label: "30 days", from: clamp(shift(max, -29)), to: max },
    { key: "mtd", label: "This month", from: clamp(monthStart(max)), to: max },
    { key: "last", label: "Last month", from: clamp(monthStart(lastMonthEnd)), to: lastMonthEnd < min ? max : lastMonthEnd },
  ];
  const actual = presets.find((p) => p.from === from && p.to === to)?.key ?? "custom";
  // Highlight the clicked choice immediately; settle on the real one when the new page arrives.
  const [picked, setPicked] = useState(actual);
  useEffect(() => setPicked(actual), [actual, from, to]);
  const current = picked;
  const go = (f: string, t: string) => start(() => router.push(`/sales/reports?from=${f}&to=${t}`));

  return (
    <Group gap="xs" wrap="wrap">
      <SegmentedControl
        value={current} size="sm" aria-label="Quick ranges"
        onChange={(k) => { const p = presets.find((x) => x.key === k); if (p) { setPicked(k); go(p.from, p.to); } }}
        data={[...presets.map((p) => ({ value: p.key, label: p.label })), ...(current === "custom" ? [{ value: "custom", label: "Custom" }] : [])]}
      />
      <DatePickerInput
        type="range" aria-label="Custom date range" value={[from, to]} minDate={min} maxDate={max} valueFormat="D MMM YYYY" w={230}
        leftSection={<IconCalendar size={16} />} rightSection={pending ? <Loader size={14} /> : undefined}
        onChange={([f, t]) => f && t && go(f, t)}
      />
    </Group>
  );
}
