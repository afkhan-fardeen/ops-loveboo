import { Group, Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

export default function Loading() {
  return (
    <Stack gap="lg" role="status" aria-label="Loading">
      <Group justify="space-between"><Stack gap={6}><Skeleton h={12} w={90} /><Skeleton h={30} w={220} /></Stack><Skeleton h={34} w={260} /></Group>
      <SimpleGrid cols={{ base: 2, md: 4 }}>{[0, 1, 2, 3].map((i) => <Paper key={i} withBorder p="md"><Stack gap={8}><Skeleton h={10} w={70} /><Skeleton h={28} w="70%" /><Skeleton h={14} w="50%" /></Stack></Paper>)}</SimpleGrid>
      <Paper withBorder p="md"><Skeleton h={14} w={120} mb="md" /><Skeleton h={220} /></Paper>
      <Paper withBorder p="md"><Stack gap="sm">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={22} />)}</Stack></Paper>
    </Stack>
  );
}
