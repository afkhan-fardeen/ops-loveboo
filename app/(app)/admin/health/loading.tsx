import { Group, Paper, Skeleton, Stack } from "@mantine/core";

export default function Loading() {
  return (
    <Stack gap="lg" role="status" aria-label="Loading system health">
      <Group justify="space-between"><Stack gap={6}><Skeleton h={12} w={60} /><Skeleton h={30} w={180} /></Stack><Skeleton h={36} w={150} /></Group>
      <Skeleton h={64} />
      <Paper withBorder>{[0, 1, 2, 3, 4].map((i) => <Group key={i} p="md" gap="md" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}><Skeleton h={34} w={34} circle /><Stack gap={6}><Skeleton h={12} w={140} /><Skeleton h={10} w={260} /></Stack></Group>)}</Paper>
    </Stack>
  );
}
