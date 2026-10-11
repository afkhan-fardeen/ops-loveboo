import { SimpleGrid, Skeleton, Stack } from "@mantine/core";

export default function Loading() {
  return (
    <Stack gap="lg" role="status" aria-label="Loading">
      <Skeleton h={36} w={240} />
      <SimpleGrid cols={{ base: 2, md: 4 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={110} />)}</SimpleGrid>
      <Skeleton h={260} />
    </Stack>
  );
}
