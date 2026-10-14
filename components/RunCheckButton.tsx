"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertCircle, IconCheck, IconPlayerPlay } from "@tabler/icons-react";

type Result = { ok: boolean; message: string };

/** Runs the scheduler check on demand, shows what happened, and refreshes the screen. */
export default function RunCheckButton({ action }: { action: () => Promise<Result> }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button variant="default" leftSection={<IconPlayerPlay size={16} />} loading={pending} onClick={() => start(async () => {
      const r = await action();
      notifications.show(r.ok
        ? { color: "brand", title: "Check finished", message: r.message, icon: <IconCheck size={18} />, autoClose: 7000 }
        : { color: "red", title: "Check failed", message: r.message, icon: <IconAlertCircle size={18} />, autoClose: 10000 });
      router.refresh();
    })}>
      Run the check now
    </Button>
  );
}
