"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionIcon, Button, Group, Loader } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useHotkeys } from "@mantine/hooks";
import { IconCalendar, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const shift = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Jump between report days: arrows, calendar, "Latest", and ←/→ keys. State lives in the URL (?date=). */
export default function DateSwitcher({ value, min, max }: { value: string; min: string; max: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const prev = shift(value, -1), next = shift(value, 1);
  const canPrev = prev >= min, canNext = next <= max;

  const go = (d: string) => start(() => router.push(d === max ? "/sales" : `/sales?date=${d}`));
  useHotkeys([["ArrowLeft", () => canPrev && go(prev)], ["ArrowRight", () => canNext && go(next)]]);

  return (
    <Group gap={6} wrap="nowrap">
      <ActionIcon variant="default" size="lg" aria-label="Previous day" disabled={!canPrev} onClick={() => go(prev)}><IconChevronLeft size={18} /></ActionIcon>
      <DatePickerInput
        aria-label="Report date" value={value} minDate={min} maxDate={max} valueFormat="ddd D MMM YYYY" w={176}
        leftSection={<IconCalendar size={16} />} rightSection={pending ? <Loader size={14} /> : undefined}
        onChange={(d) => d && go(d)} popoverProps={{ withinPortal: true }}
      />
      <ActionIcon variant="default" size="lg" aria-label="Next day" disabled={!canNext} onClick={() => go(next)}><IconChevronRight size={18} /></ActionIcon>
      {value !== max && <Button variant="light" size="sm" onClick={() => go(max)} visibleFrom="xs">Latest</Button>}
    </Group>
  );
}
