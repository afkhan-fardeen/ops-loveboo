import { Group, Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

/** The body of a report page while its data loads: KPI cards, a chart, and a table. */
export function BodySkeleton() {
  return (
    <Stack gap="lg" role="status" aria-label="Loading report">
      <SimpleGrid cols={{ base: 2, md: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <Paper key={i} withBorder p="md"><Stack gap={8}><Skeleton h={10} w={70} /><Skeleton h={28} w="70%" /><Skeleton h={14} w="50%" /></Stack></Paper>
        ))}
      </SimpleGrid>
      <Paper withBorder p="md"><Skeleton h={14} w={120} mb="md" /><Skeleton h={240} /></Paper>
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
