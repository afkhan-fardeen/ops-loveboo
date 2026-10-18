"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Group, Loader, Text } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

type Result = { ok: boolean; message: string };

/** Shown when yesterday's report isn't stored yet: fetches it, then refreshes the page. */
export default function LoadMissing({ action }: { action: () => Promise<Result> }) {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (started.current && attempt === 0) return;
    started.current = true;
    setError(null);
    action().then((r) => (r.ok ? router.refresh() : setError(r.message)), () => setError("Couldn’t reach the server."));
  }, [attempt, action, router]);

  return error ? (
    <Alert color="red" icon={<IconAlertCircle size={18} />} title="Couldn’t load yesterday’s report">
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Text size="sm">{error}</Text>
        <Button size="xs" variant="default" onClick={() => setAttempt((n) => n + 1)}>Try again</Button>
      </Group>
    </Alert>
  ) : (
    <Alert color="brand" variant="light" icon={<Loader size={16} />} role="status">
      <Text size="sm" fw={500}>Loading yesterday’s report from Shopify…</Text>
    </Alert>
  );
}
