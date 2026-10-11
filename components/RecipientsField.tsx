"use client";
import { useState } from "react";
import { Alert, Group, Text, TagsInput } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Recipient chips: type an email and press Enter, comma or Tab; × removes. Only valid, unique addresses are kept. */
export default function RecipientsField({ initial }: { initial: string[] }) {
  const [list, setList] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const changed = list.join() !== initial.join();

  const onChange = (next: string[]) => {
    const clean = [...new Set(next.map((e) => e.trim().toLowerCase()))];
    const bad = clean.find((e) => !EMAIL.test(e));
    setError(bad ? `“${bad}” isn’t a valid email address.` : null);
    setList(clean.filter((e) => EMAIL.test(e)));
  };

  return (
    <>
      <input type="hidden" name="recipients" value={list.join(",")} />
      <TagsInput
        label="Recipients" placeholder={list.length ? "Add another email" : "name@loveboo.com"} value={list} onChange={onChange}
        splitChars={[",", " ", ";"]} acceptValueOnBlur clearable error={error}
        description="Type an email and press Enter. These people get the daily sales email."
        styles={{ pill: { fontWeight: 500 } }}
      />
      <Group justify="space-between" gap="xs" mt={-6}>
        <Text size="xs" c="dimmed">{list.length} {list.length === 1 ? "recipient" : "recipients"}{changed ? " · unsaved changes" : ""}</Text>
      </Group>
      {list.length === 0 && (
        <Alert color="yellow" icon={<IconAlertTriangle size={16} />}>No recipients — the daily email won’t be sent until you add one.</Alert>
      )}
      <Text size="xs" c="dimmed">Until loveboo.com is verified in Resend, only the Resend account owner’s address will receive mail.</Text>
    </>
  );
}
