"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox, CheckboxGroup, Drawer, Group, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCalendarPlus } from "@tabler/icons-react";
import { planEmails } from "@/app/(app)/marketing/actions";
import { addDays } from "@/lib/format";
import { WEEKDAYS, weekdayDates } from "@/lib/mkt";

/** Creates the empty email slots on the days you send (default: every Sunday and Thursday) for the weeks ahead. */
export default function PlanAhead({ today, existingDates }: { today: string; existingDates: string[] }) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<string[]>(["0", "4"]);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 56));
  const [pending, start] = useTransition();
  const router = useRouter();
  const have = useMemo(() => new Set(existingDates), [existingDates]);
  const dates = useMemo(() => (from && to && to >= from && days.length ? weekdayDates(from, to, days.map(Number)) : []), [from, to, days]);
  const fresh = dates.filter((d) => !have.has(d));

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    start(async () => {
      const r = await planEmails(form);
      notifications.show(r.ok ? { color: "brand", message: r.message, autoClose: 5000 } : { color: "red", title: "Couldn’t plan ahead", message: r.message, autoClose: 8000 });
      if (r.ok) { setOpen(false); router.refresh(); }
    });
  };
  return (
    <>
      <Button variant="default" leftSection={<IconCalendarPlus size={16} />} onClick={() => setOpen(true)}>Plan ahead</Button>
      <Drawer opened={open} onClose={() => setOpen(false)} position="right" size="md" zIndex={300} title={<Text fw={700}>Plan the emails ahead</Text>}>
        <form onSubmit={submit}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">Creates an empty email on each day you send, so the whole schedule is plotted. Then you or the team fill in the theme, products and copy. Days that already have an email are left alone.</Text>
            <CheckboxGroup value={days} onChange={setDays} label="Send on">
              <Group gap="md" mt={6}>{WEEKDAYS.map((d) => <Checkbox key={d.value} name="days" value={String(d.value)} label={d.short} />)}</Group>
            </CheckboxGroup>
            <Group grow>
              <TextInput name="from" type="date" label="From" value={from} onChange={(e) => setFrom(e.currentTarget.value)} required />
              <TextInput name="to" type="date" label="Until" value={to} onChange={(e) => setTo(e.currentTarget.value)} required />
            </Group>
            <Text size="sm" fw={500}>{fresh.length === 0 ? "Nothing new to add for these days." : `This will add ${fresh.length} email${fresh.length === 1 ? "" : "s"}${dates.length > fresh.length ? ` (${dates.length - fresh.length} already planned)` : ""}.`}</Text>
            <Group justify="flex-end"><Button variant="default" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={pending} disabled={fresh.length === 0}>Add emails</Button></Group>
          </Stack>
        </form>
      </Drawer>
    </>
  );
}
