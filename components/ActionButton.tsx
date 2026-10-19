"use client";
import { useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

type Result = { ok: boolean; message: string };

/** Runs a server action on click, shows what happened as a toast, and refreshes the screen. */
export default function ActionButton({ action, icon, children }: { action: () => Promise<Result>; icon?: ReactNode; children: ReactNode }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button variant="default" leftSection={icon} loading={pending} onClick={() => start(async () => {
      const r = await action();
      notifications.show(r.ok
        ? { color: "brand", message: r.message, icon: <IconCheck size={18} />, autoClose: 7000 }
        : { color: "red", title: "Failed", message: r.message, icon: <IconAlertCircle size={18} />, autoClose: 10000 });
      router.refresh();
    })}>
      {children}
    </Button>
  );
}
