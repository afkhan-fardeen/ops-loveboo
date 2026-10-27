"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, ColorSwatch, Drawer, Group, Menu, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconChevronDown, IconPencil, IconPlus } from "@tabler/icons-react";
import SubmitButton from "@/components/SubmitButton";
import LinksField from "./LinksField";
import MarketsField from "./MarketsField";
import { deleteCampaign, deleteItem, saveCampaign, saveItem, setItemStatus, type Result } from "@/app/(app)/marketing/actions";
import { CAMPAIGN_STATUSES, COLOURS, ITEM_STATUSES, ITEM_TYPES, KINDS, itemStatus, type Campaign, type Item, type Owner } from "@/lib/mkt";

const ownerData = (owners: Owner[]) => owners.map((o) => ({ value: o.id, label: o.name ? `${o.name} (${o.email})` : o.email }));
const toast = (r: Result) =>
  notifications.show(r.ok
    ? { color: "brand", message: r.message, icon: <IconCheck size={18} />, autoClose: 4000 }
    : { color: "red", title: "Couldn’t save", message: r.message, icon: <IconAlertCircle size={18} />, autoClose: 9000 });

type Trigger = { label: string; variant?: string; size?: string; icon?: "plus" | "pencil" };
const Trigger = ({ t, onClick }: { t: Trigger; onClick: () => void }) => (
  <Button variant={t.variant ?? "default"} size={t.size ?? "sm"} onClick={onClick}
    leftSection={t.icon === "pencil" ? <IconPencil size={16} /> : t.icon === "plus" ? <IconPlus size={16} /> : undefined}>{t.label}</Button>
);

/** Create or edit a campaign / event in a side drawer. Rights are enforced again on the server. */
export function CampaignEditor({ campaign, owners, trigger, controlled, prefill }: {
  campaign?: Campaign; owners: Owner[]; trigger?: Trigger; controlled?: { open: boolean; onClose: () => void }; prefill?: { starts_on?: string; ends_on?: string };
}) {
  const [openState, setOpenState] = useState(false);
  const open = controlled ? controlled.open : openState;
  const setOpen = (v: boolean) => (controlled ? !v && controlled.onClose() : setOpenState(v));
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<string>(campaign?.kind ?? "campaign");
  const [colour, setColour] = useState(campaign?.colour ?? COLOURS[0]);
  const router = useRouter();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    start(async () => {
      const r = await saveCampaign(form);
      toast(r);
      if (r.ok) { setOpen(false); if (!campaign && r.id) router.push(`/marketing/campaigns/${r.id}`); else router.refresh(); }
    });
  };

  return (
    <>
      {trigger && <Trigger t={trigger} onClick={() => setOpen(true)} />}
      <Drawer opened={open} onClose={() => setOpen(false)} position="right" size="lg" zIndex={300} title={<Text fw={700}>{campaign ? "Edit campaign" : "New campaign or event"}</Text>}>
        <form onSubmit={submit}>
          <Stack gap="sm">
            <input type="hidden" name="id" value={campaign?.id ?? ""} />
            <input type="hidden" name="colour" value={colour} />
            <TextInput name="name" label="Name" placeholder="e.g. Black Friday" required defaultValue={campaign?.name} maxLength={120} data-autofocus />
            <SimpleGrid cols={2}>
              <Select name="kind" label="Type" data={KINDS.map((k) => ({ value: k.value, label: k.label }))} value={kind} onChange={(v) => setKind(v ?? "campaign")} allowDeselect={false} comboboxProps={{ zIndex: 400 }} />
              <Select name="status" label="Status" data={CAMPAIGN_STATUSES.map((s) => ({ value: s.value, label: s.label }))} defaultValue={campaign?.status ?? "planned"} allowDeselect={false} comboboxProps={{ zIndex: 400 }} />
            </SimpleGrid>
            <SimpleGrid cols={kind === "key_date" ? 1 : 2}>
              <TextInput name="starts_on" type="date" label={kind === "key_date" ? "Date" : "Starts"} required defaultValue={campaign?.starts_on ?? prefill?.starts_on} />
              {kind !== "key_date" && <TextInput name="ends_on" type="date" label="Ends" required defaultValue={campaign?.ends_on ?? prefill?.ends_on ?? prefill?.starts_on} />}
            </SimpleGrid>
            <div>
              <Text size="sm" fw={500} mb={4}>Colour on the calendar</Text>
              <Group gap={8}>
                {COLOURS.map((c) => (
                  <ColorSwatch key={c} color={c} size={26} component="button" type="button" aria-label={`Colour ${c}`} aria-pressed={colour === c} onClick={() => setColour(c)}
                    style={{ cursor: "pointer", outline: colour === c ? "2px solid var(--mantine-color-dark-6)" : "none", outlineOffset: 2 }} />
                ))}
              </Group>
            </div>
            <Select name="owner_id" label="Owner" placeholder="Unassigned" data={ownerData(owners)} defaultValue={campaign?.owner_id ?? null} clearable searchable comboboxProps={{ zIndex: 400 }} />
            <MarketsField initial={campaign?.markets ?? []} />
            <TextInput name="offer" label="Offer or code" placeholder="e.g. 30% off sitewide, code BLACK30" defaultValue={campaign?.offer} maxLength={200} />
            <Textarea name="brief" label="Brief" placeholder="What is this, who is it for, what do we want people to do?" autosize minRows={3} maxRows={8} defaultValue={campaign?.brief} maxLength={4000} />
            <LinksField initial={campaign?.links ?? []} description="Drive folder, landing page, Klaviyo campaign…" />
            <Group justify="flex-end" mt="xs"><Button variant="default" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={pending}>Save</Button></Group>
          </Stack>
        </form>
        {campaign && (
          <form action={deleteCampaign} style={{ marginTop: 24 }}>
            <input type="hidden" name="id" value={campaign.id} />
            <SubmitButton color="red" variant="subtle" size="xs" confirm={`Delete “${campaign.name}” and all its deliverables? This can’t be undone.`} confirmLabel="Delete campaign">Delete this campaign</SubmitButton>
          </form>
        )}
      </Drawer>
    </>
  );
}

/** Create or edit a deliverable (banner, post, email…) in a side drawer. */
export function ItemEditor({ item, campaigns, owners, defaultCampaignId, back = "/marketing", trigger, controlled, prefill }: {
  item?: Item; campaigns: { id: string; name: string }[]; owners: Owner[]; defaultCampaignId?: string; back?: string; trigger?: Trigger;
  controlled?: { open: boolean; onClose: () => void }; prefill?: { due_on?: string; live_on?: string };
}) {
  const [openState, setOpenState] = useState(false);
  const open = controlled ? controlled.open : openState;
  const setOpen = (v: boolean) => (controlled ? !v && controlled.onClose() : setOpenState(v));
  const [pending, start] = useTransition();
  const router = useRouter();
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    start(async () => {
      const r = await saveItem(form);
      toast(r);
      if (r.ok) { setOpen(false); router.refresh(); }
    });
  };
  return (
    <>
      {trigger && <Trigger t={trigger} onClick={() => setOpen(true)} />}
      <Drawer opened={open} onClose={() => setOpen(false)} position="right" size="lg" zIndex={300} title={<Text fw={700}>{item ? "Edit deliverable" : "New deliverable"}</Text>}>
        <form onSubmit={submit}>
          <Stack gap="sm">
            <input type="hidden" name="id" value={item?.id ?? ""} />
            <TextInput name="title" label="Title" placeholder="e.g. Homepage banner, desktop + mobile" required defaultValue={item?.title} maxLength={160} data-autofocus />
            <Select name="campaign_id" label="Campaign" placeholder="Not part of a campaign" data={campaigns.map((c) => ({ value: c.id, label: c.name }))}
              defaultValue={item?.campaign_id ?? defaultCampaignId ?? null} clearable searchable comboboxProps={{ zIndex: 400 }} />
            <SimpleGrid cols={2}>
              <Select name="type" label="Type" data={ITEM_TYPES.map((t) => ({ value: t.value, label: t.label }))} defaultValue={item?.type ?? "banner"} allowDeselect={false} comboboxProps={{ zIndex: 400 }} />
              <Select name="status" label="Status" data={ITEM_STATUSES.map((s) => ({ value: s.value, label: s.label }))} defaultValue={item?.status ?? "todo"} allowDeselect={false} comboboxProps={{ zIndex: 400 }} />
            </SimpleGrid>
            <SimpleGrid cols={2}>
              <TextInput name="due_on" type="date" label="Due" description="When the work is needed" defaultValue={item?.due_on ?? prefill?.due_on ?? ""} />
              <TextInput name="live_on" type="date" label="Goes live" description="When it is published" defaultValue={item?.live_on ?? prefill?.live_on ?? ""} />
            </SimpleGrid>
            <Select name="owner_id" label="Owner" placeholder="Unassigned" data={ownerData(owners)} defaultValue={item?.owner_id ?? null} clearable searchable comboboxProps={{ zIndex: 400 }} />
            <MarketsField initial={item?.markets ?? []} />
            <LinksField initial={item?.links ?? []} description="the file or folder in Drive" />
            <Textarea name="notes" label="Notes" autosize minRows={2} maxRows={8} defaultValue={item?.notes} maxLength={4000} />
            <Group justify="flex-end" mt="xs"><Button variant="default" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" loading={pending}>Save</Button></Group>
          </Stack>
        </form>
        {item && (
          <form action={deleteItem} style={{ marginTop: 24 }}>
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="back" value={back} />
            <SubmitButton color="red" variant="subtle" size="xs" confirm={`Delete “${item.title}”? This can’t be undone.`} confirmLabel="Delete">Delete this deliverable</SubmitButton>
          </form>
        )}
      </Drawer>
    </>
  );
}

/** A status badge. For people who can edit, clicking it opens a menu to change the status in one step. */
export function StatusMenu({ item, canEdit }: { item: Pick<Item, "id" | "status">; canEdit: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const s = itemStatus(item.status);
  if (!canEdit) return <Badge variant="light" color={s.color} styles={{ label: { overflow: "visible", textOverflow: "clip" } }}>{s.label}</Badge>;
  return (
    <Menu position="bottom-start" withinPortal zIndex={400} shadow="md">
      <Menu.Target>
        <Badge variant="light" color={s.color} style={{ cursor: "pointer" }} styles={{ label: { overflow: "visible", textOverflow: "clip" } }} rightSection={<IconChevronDown size={12} />} aria-label={`Status: ${s.label}. Change status`}>{pending ? "…" : s.label}</Badge>
      </Menu.Target>
      <Menu.Dropdown>
        {ITEM_STATUSES.map((o) => (
          <Menu.Item key={o.value} disabled={o.value === item.status} onClick={() => start(async () => { const r = await setItemStatus(item.id, o.value); toast(r); if (r.ok) router.refresh(); })}>
            <Badge variant="light" color={o.color}>{o.label}</Badge>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
