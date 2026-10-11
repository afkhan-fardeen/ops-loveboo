"use client";
import { Alert, Button, Stack } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Stack align="flex-start">
      <Alert color="red" icon={<IconAlertCircle size={18} />} title="We couldn’t load this page">
        Something went wrong reading the data. Try again.
      </Alert>
      <Button onClick={reset}>Try again</Button>
    </Stack>
  );
}
