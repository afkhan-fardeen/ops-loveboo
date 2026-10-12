"use client";
import { useState, useTransition } from "react";
import { Alert, Button, Group, Modal, SegmentedControl, Stack, Text, Textarea } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconAlertTriangle, IconCheck, IconSend } from "@tabler/icons-react";

type Result = { ok: boolean; message: string };

/** "Send email now" for one day: to the current recipients, or to someone who isn't one. */
export default function SendEmailDialog({ date, label, recipients, action }: {
  date: string; label: string; recipients: { name: string; email: string }[]; action: (form: FormData) => Promise<Result>;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("recipients");
  const [to, setTo] = useState("");
  const [pending, start] = useTransition();

  const send = () => start(async () => {
    const fd = new FormData();
    fd.set("date", date); fd.set("mode", mode); fd.set("to", to);
    const r = await action(fd);
    notifications.show(r.ok
      ? { color: "brand", title: "Email sent", message: r.message, icon: <IconCheck size={18} />, autoClose: 6000 }
      : { color: "red", title: "Couldn’t send", message: r.message, icon: <IconAlertCircle size={18} />, autoClose: 9000 });
    if (r.ok) { setOpen(false); setTo(""); }
  });

  return (
    <>
      <Button leftSection={<IconSend size={16} />} onClick={() => setOpen(true)}>Send email now</Button>
      <Modal opened={open} onClose={() => !pending && setOpen(false)} centered size="md" zIndex={400} title={<Text fw={600}>Send the report for {label}</Text>}>
        <Stack gap="md">
          <SegmentedControl fullWidth value={mode} onChange={setMode} data={[{ value: "recipients", label: "Current recipients" }, { value: "custom", label: "Someone else" }]} />

          {mode === "recipients" ? (
            recipients.length === 0 ? (
              <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>There are no active recipients. Add some in Email settings, or choose “Someone else”.</Alert>
            ) : (
              <Stack gap={4}>
                {recipients.map((r) => (
                  <Text key={r.email} size="sm">{r.name ? <b>{r.name}</b> : null}{r.name ? " · " : ""}<Text span c="dimmed">{r.email}</Text></Text>
                ))}
              </Stack>
            )
          ) : (
            <Textarea label="Send to" placeholder="name@example.com" autosize minRows={2} value={to} onChange={(e) => setTo(e.currentTarget.value)} data-autofocus
              description="One or more email addresses, separated by commas. The report goes only to them." />
          )}

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button leftSection={<IconSend size={16} />} loading={pending} onClick={send} disabled={mode === "recipients" && recipients.length === 0}>Send</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
