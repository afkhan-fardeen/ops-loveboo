"use client";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@mantine/core";

/** Submit button that shows a spinner while its form action runs; optional confirm prompt. */
export default function SubmitButton({ children, confirm, ...props }: { children: ReactNode; confirm?: string } & ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} onClick={confirm ? (e) => { if (!window.confirm(confirm)) e.preventDefault(); } : undefined} {...props}>
      {children}
    </Button>
  );
}
