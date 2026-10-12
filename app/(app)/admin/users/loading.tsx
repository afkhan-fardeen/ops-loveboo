import { Group, Paper, SimpleGrid, Skeleton, Stack } from "@mantine/core";

export default function Loading() {
  return (
    <Stack gap="lg" role="status" aria-label="Loading users">
      <Stack gap={6}><Skeleton h={12} w={220} /><Skeleton h={30} w={110} /></Stack>
      <SimpleGrid cols={3} spacing={{ base: "xs", sm: "md" }}>
        {[0, 1, 2].map((i) => <Paper key={i} withBorder p="md"><Stack gap={8}><Skeleton h={10} w={60} /><Skeleton h={26} w={40} /></Stack></Paper>)}
      </SimpleGrid>
      <Group justify="space-between"><Skeleton h={36} w={260} /><Skeleton h={36} w={110} /></Group>
      <Paper withBorder>
        {[0, 1, 2, 3].map((i) => (
          <Group key={i} p="md" gap="sm" style={{ borderTop: i ? "1px solid var(--mantine-color-default-border)" : undefined }}>
            <Skeleton h={38} w={38} circle /><Stack gap={6}><Skeleton h={12} w={140} /><Skeleton h={10} w={190} /></Stack>
          </Group>
        ))}
      </Paper>
    </Stack>
  );
}
