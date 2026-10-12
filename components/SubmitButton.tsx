"use client";
import { useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps, Group, Modal, Text } from "@mantine/core";

type Props = { children: ReactNode; confirm?: string; confirmTitle?: string; confirmLabel?: string } & ButtonProps;

/**
 * Submit button that shows a spinner while its form action runs.
 * With `confirm`, it first opens a dialog (in place of the browser's plain popup) and submits the form on Confirm.
 */
export default function SubmitButton({ children, confirm, confirmTitle, confirmLabel, ...props }: Props) {
  const { pending } = useFormStatus();
  const [open, setOpen] = useState(false);
  const form = useRef<HTMLFormElement | null>(null);

  if (!confirm) return <Button type="submit" loading={pending} {...props}>{children}</Button>;

  const danger = props.color === "red";
  return (
    <>
      <Button type="button" loading={pending} onClick={(e) => { form.current = e.currentTarget.form; setOpen(true); }} {...props}>{children}</Button>
      <Modal opened={open} onClose={() => setOpen(false)} title={<Text fw={600}>{confirmTitle ?? (danger ? "Are you sure?" : "Please confirm")}</Text>} centered size="sm" zIndex={400}>
        <Text size="sm" style={{ whiteSpace: "pre-line" }}>{confirm}</Text>
        <Group justify="flex-end" mt="lg" gap="xs">
          <Button variant="default" onClick={() => setOpen(false)}>Cancel</Button>
          <Button color={danger ? "red" : undefined} data-autofocus onClick={() => { setOpen(false); form.current?.requestSubmit(); }}>{confirmLabel ?? (danger ? "Delete" : "Confirm")}</Button>
        </Group>
      </Modal>
    </>
  );
}
