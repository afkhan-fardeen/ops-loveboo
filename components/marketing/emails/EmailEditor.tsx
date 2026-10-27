"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Drawer, Group, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconPencil, IconPlus } from "@tabler/icons-react";
import SubmitButton from "@/components/SubmitButton";
import LinksField from "../LinksField";
import ProductsField from "./ProductsField";
import { deleteEmail, saveEmail, type Result } from "@/app/(app)/marketing/actions";
import { dateLabel } from "@/lib/format";
import { ITEM_STATUSES, type Email, type Owner } from "@/lib/mkt";

const toast = (r: Result) => notifications.show(r.ok
  ? { color: "brand", message: r.message, icon: <IconCheck size={18} />, autoClose: 4000 }
  : { color: "red", title: "Couldn’t save", message: r.message, icon: <IconAlertCircle size={18} />, autoClose: 9000 });

/** Add or edit one email: the date, the theme (e.g. "Mums & Babies"), the products to push, the copy and the links. */
export function EmailEditor({ email, owners, prefillDate, trigger, controlled }: {
  email?: Email; owners: Owner[]; prefillDate?: string; trigger?: { label: string; variant?: string; size?: string; icon?: "plus" | "pencil" }; controlled?: { open: boolean; onClose: () => void };
}) {
  const [openState, setOpenState] = useState(false);
  const open = controlled ? controlled.open : openState;
  const setOpen = (v: boolean) => (controlled ? !v && controlled.onClose() : setOpenState(v));
  const [pending, start] = useTransition();
  const router = useRouter();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    start(async () => { const r = await saveEmail(form); toast(r); if (r.ok) { setOpen(false); router.refresh(); } });
  };
  return (
    <>
      {trigger && <Button variant={trigger.variant ?? "default"} size={trigger.size ?? "sm"} onClick={() => setOpen(true)}
        leftSection={trigger.icon === "pencil" ? <IconPencil size={16} /> : trigger.icon === "plus" ? <IconPlus size={16} /> : undefined}>{trigger.label}</Button>}
      <Drawer opened={open} onClose={() => setOpen(false)} position="right" size="lg" zIndex={300} title={<Text fw={700}>{email ? `Email · ${dateLabel(email.send_on, true)}` : "New email"}</Text>}>
        <form onSubmit={submit}>
          <Stack gap="sm">
            <input type="hidden" name="id" value={email?.id ?? ""} />
            <Group grow align="flex-start">
              <TextInput name="send_on" type="date" label="Send date" required defaultValue={email?.send_on ?? prefillDate} />
              <Select name="status" label="Status" data={ITEM_STATUSES.map((s) => ({ value: s.value, label: s.label }))} defaultValue={email?.status ?? "todo"} allowDeselect={false} comboboxProps={{ zIndex: 400 }} />
            </Group>
            <TextInput name="name" label="Theme" placeholder="e.g. Mums & Babies" defaultValue={email?.name} maxLength={120} data-autofocus description="What this email is about. It is the name you see on the calendar." />
            <TextInput name="subject" label="Subject line" defaultValue={email?.subject} maxLength={200} />
            <ProductsField initial={email?.products ?? []} />
            <Textarea name="copy" label="Copy" placeholder="Draft the email copy here, or link the doc below." autosize minRows={4} maxRows={14} defaultValue={email?.copy} maxLength={10000} />
            <Select name="owner_id" label="Owner" placeholder="Unassigned" data={owners.map((o) => ({ value: o.id, label: o.name ? `${o.name} (${o.email})` : o.email }))} defaultValue={email?.owner_id ?? null} clearable searchable comboboxProps={{ zIndex: 400 }} />
            <LinksField initial={email?.links ?? []} description="Klaviyo campaign, Drive doc or design" />
            <Textarea name="notes" label="Notes" autosize minRows={2} maxRows={8} defaultValue={email?.notes} maxLength={4000} />
            <Group justify="flex-end" mt="xs"><Button variant="default" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={pending}>Save</Button></Group>
          </Stack>
        </form>
        {email && (
          <form action={deleteEmail} style={{ marginTop: 24 }}>
            <input type="hidden" name="id" value={email.id} />
            <input type="hidden" name="back" value="/marketing/emails" />
            <SubmitButton color="red" variant="subtle" size="xs" confirm={`Delete the email on ${dateLabel(email.send_on, true)}${email.name ? ` (${email.name})` : ""}? This can’t be undone.`} confirmLabel="Delete">Delete this email</SubmitButton>
          </form>
        )}
      </Drawer>
    </>
  );
}
