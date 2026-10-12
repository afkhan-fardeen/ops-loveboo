import { Group, Paper, Skeleton, Stack } from "@mantine/core";

/** The body of the daily report while its data loads: the summary card and the orders table. */
export function BodySkeleton() {
  return (
    <Stack gap="lg" role="status" aria-label="Loading report">
      <Paper withBorder p="lg">
        <Stack gap="sm">
          <Skeleton h={18} w={240} />
          {[0, 1, 2, 3].map((i) => <Group key={i} justify="space-between"><Skeleton h={14} w={110} /><Skeleton h={14} w={80} /></Group>)}
        </Stack>
      </Paper>
      <Paper withBorder p="md"><Stack gap="sm">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} h={22} />)}</Stack></Paper>
    </Stack>
  );
}

export function PageSkeleton() {
  return (
    <Stack gap="lg">
      <Group justify="space-between"><Stack gap={6}><Skeleton h={12} w={90} /><Skeleton h={30} w={220} /></Stack><Skeleton h={34} w={260} /></Group>
      <BodySkeleton />
    </Stack>
  );
}
