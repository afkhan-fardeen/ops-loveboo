import { Group, Paper, Skeleton, Stack } from "@mantine/core";

export default function Loading() {
  return (
    <Stack gap="lg" maw={720} role="status" aria-label="Loading settings">
      <Stack gap={6}><Skeleton h={30} w={140} /><Skeleton h={14} w={320} /></Stack>
      <Paper withBorder p="lg">
        <Stack gap="md">
          <Group justify="space-between"><Skeleton h={18} w={110} /><Skeleton h={30} w={130} /></Group>
          {[0, 1].map((i) => <Group key={i} gap="sm"><Skeleton h={36} w={36} circle /><Stack gap={6}><Skeleton h={12} w={120} /><Skeleton h={10} w={190} /></Stack></Group>)}
          <Skeleton h={36} w={180} />
          <Skeleton h={20} w={200} /><Skeleton h={20} w={180} />
          <Skeleton h={36} w={150} />
        </Stack>
      </Paper>
      <Paper withBorder p="lg"><Stack gap={8}><Skeleton h={14} w={120} /><Skeleton h={14} w="60%" /><Skeleton h={14} w="40%" /></Stack></Paper>
    </Stack>
  );
}
