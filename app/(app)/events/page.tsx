import { Alert, Badge, Button, Checkbox, Group, Paper, SimpleGrid, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { IconAlertTriangle, IconMailForward, IconSend } from "@tabler/icons-react";
import ActionButton from "@/components/ActionButton";
import SubmitButton from "@/components/SubmitButton";
import { DataTable, EmptyState, Kpi, PageHeader, Section } from "@/components/ui";
import { requireModule } from "@/lib/auth";
import { ago, clock } from "@/lib/health";
import { int } from "@/lib/format";
import { outcomeOf } from "@/lib/outcome";
import { adminClient } from "@/lib/supabase";
import { retryFailed, saveEvent, sendTestEmail } from "./actions";

export const metadata = { title: "Events" };
export const dynamic = "force-dynamic";

type Reg = { id: number; first_name: string; last_name: string | null; email: string; phone: string | null; prize: string | null; registered_at: string; source: string | null; email_status: string; email_error: string | null; email_attempts: number };

const STATUS: Record<string, { label: string; color: string }> = {
  sent: { label: "Sent", color: "teal" }, pending: { label: "Waiting", color: "yellow" }, sending: { label: "Sending", color: "blue" },
  failed: { label: "Failed", color: "red" }, skipped: { label: "Off", color: "gray" },
};

export default async function Events({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireModule("events");
  const type = ["spin", "qr"].includes((await searchParams).type ?? "") ? (await searchParams).type! : "all";
  const admin = user.role === "admin";
  const db = adminClient();
  const { data: event } = await db.from("events").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!event) return <EmptyState title="No event yet">Run migrations/009_events.sql to create the first event.</EmptyState>;

  const base = () => db.from("event_registrations").select("id", { count: "exact", head: true }).eq("event_id", event.id);
  const listQuery = () => {
    const q = db.from("event_registrations").select("id,first_name,last_name,email,phone,prize,source,registered_at,email_status,email_error,email_attempts").eq("event_id", event.id);
    return type === "qr" ? q.like("source", "%_qr") : type === "spin" ? q.not("source", "like", "%_qr") : q;
  };
  const [total, qrCount, winners, sent, trouble, regs, prizeRows] = await Promise.all([
    base().then((r) => r.count ?? 0),
    base().like("source", "%_qr").then((r) => r.count ?? 0),
    base().not("prize", "is", null).then((r) => r.count ?? 0),
    base().eq("email_status", "sent").then((r) => r.count ?? 0),
    base().in("email_status", ["failed", "pending", "sending"]).then((r) => r.count ?? 0),
    listQuery().order("registered_at", { ascending: false }).limit(300).then((r) => (r.data ?? []) as Reg[]),
    db.from("event_registrations").select("prize").eq("event_id", event.id).not("prize", "is", null).limit(20000).then((r) => (r.data ?? []) as { prize: string }[]),
  ]);
  const spinCount = total - qrCount;
  const gifts = Object.entries(prizeRows.reduce<Record<string, number>>((m, r) => ((m[r.prize] = (m[r.prize] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  const latest = regs[0]?.registered_at;
  const dates = event.starts_on ? `${event.starts_on}${event.ends_on ? ` → ${event.ends_on}` : ""}` : "dates not set";

  return (
    <Stack gap="lg">
      <PageHeader eyebrow={`Events · ${dates}`} title={event.name}>
        {admin && <ActionButton action={sendTestEmail} icon={<IconSend size={16} />}>Send test email to me</ActionButton>}
        {admin && <ActionButton action={retryFailed} icon={<IconMailForward size={16} />}>Retry unsent emails</ActionButton>}
      </PageHeader>

      {total === 0 && (
        <Alert color="yellow" icon={<IconAlertTriangle size={20} />} title="No registrations have reached the portal yet" variant="light">
          Signups are saved on the registration site and copied here by a database trigger. If guests have registered but nothing shows, the trigger isn’t reaching this portal.
        </Alert>
      )}
      {trouble > 0 && (
        <Alert color="red" icon={<IconAlertTriangle size={20} />} title={`${trouble} guest email${trouble === 1 ? " is" : "s are"} not sent yet`} variant="light">
          Failed emails are retried automatically by the scheduler (up to 5 times). {admin ? "Use “Retry unsent emails” to try again now." : "An admin can retry them."}
        </Alert>
      )}

      <SimpleGrid cols={{ base: 2, sm: 4 }}>
        <Kpi label="Registrations" value={int(total)} note={latest ? `Latest ${ago(latest)}` : "None yet"} />
        <Kpi label="Spin & win" value={int(spinCount)} note={`${int(winners)} won a gift`} />
        <Kpi label="QR code" value={int(qrCount)} note="got the discount code" />
        <Kpi label="Emails sent" value={int(sent)} note={trouble ? `${int(trouble)} waiting / failed` : "none waiting"} />
      </SimpleGrid>

      {gifts.length > 0 && (
        <Section title="Gifts given" subtitle="How many of each gift has been won (Spin & win only)." flush>
          <DataTable minWidth={320} rows={gifts} rowKey={(g) => g[0]} cols={[
            { label: "Gift", render: (g) => <Text size="sm" fw={600}>{g[0]}</Text> },
            { label: "Won", align: "right", render: (g) => <Text size="sm">{int(g[1])}</Text> },
          ]} />
        </Section>
      )}

      <Group gap="xs">
        {[["all", `All (${int(total)})`], ["spin", `Spin & win (${int(spinCount)})`], ["qr", `QR code (${int(qrCount)})`]].map(([key, label]) => (
          <Button key={key} component="a" href={key === "all" ? "/events" : `/events?type=${key}`} size="xs" radius="xl" variant={type === key ? "filled" : "default"}>{label}</Button>
        ))}
      </Group>

      <Section title="Registrations" subtitle="Newest first (latest 300). Times are Bahrain time." flush>
        {regs.length === 0 ? <Text c="dimmed" p="md">Nothing here yet.</Text> : (
          <DataTable minWidth={680} rows={regs} rowKey={(r) => String(r.id)} cols={[
            { label: "Guest", render: (r) => <div><Text size="sm" fw={600}>{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</Text><Text size="xs" c="dimmed">{r.email}</Text></div> },
            { label: "Signed up via", render: (r) => { const o = outcomeOf(r); return <Badge variant="light" color={o.type === "qr" ? "grape" : "teal"}>{o.typeLabel}</Badge>; } },
            { label: "Got", render: (r) => { const o = outcomeOf(r); return o.kind === "gift" ? <Badge variant="filled">{o.label}</Badge> : <Text size="sm" c="dimmed">{o.label}</Text>; } },
            { label: "Registered", hideBelow: "sm", render: (r) => <Text size="sm">{clock(r.registered_at)}</Text> },
            { label: "Email", render: (r) => {
              const s = STATUS[r.email_status] ?? { label: r.email_status, color: "gray" };
              return <div><Badge variant="light" color={s.color}>{s.label}</Badge>{r.email_error && <Text size="xs" c="red" mt={2}>{r.email_error}</Text>}</div>;
            } },
          ]} />
        )}
      </Section>

      {admin && (
        <Section title="Event and email settings" subtitle="The collection text appears in the winner email. Registrations are matched to the event by their date.">
          <form action={saveEvent}>
            <input type="hidden" name="id" value={event.id} />
            <Stack gap="md" maw={560}>
              <Group grow align="flex-start">
                <TextInput type="date" name="starts_on" label="Starts" defaultValue={event.starts_on ?? ""} />
                <TextInput type="date" name="ends_on" label="Ends" defaultValue={event.ends_on ?? ""} />
              </Group>
              <Textarea name="collection_text" label="How to collect (winner email)" autosize minRows={3} maxLength={600} defaultValue={event.collection_text}
                placeholder="Collect your gift at the Love Boo booth (Hall 3, Booth 12) any day of the expo, 10am–8pm." description="If empty: “Show this email at the Love Boo booth to collect your gift.”" />
              <Checkbox name="email_enabled" label="Email guests when they register" defaultChecked={event.email_enabled} />
              <Paper><SubmitButton>Save</SubmitButton></Paper>
            </Stack>
          </form>
        </Section>
      )}
    </Stack>
  );
}
