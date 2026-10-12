import { Group, Skeleton, Stack } from "@mantine/core";
import { BodySkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <Stack gap="lg">
      <Group justify="space-between"><Stack gap={6}><Skeleton h={12} w={90} /><Skeleton h={30} w={280} /></Stack><Skeleton h={34} w={140} /></Group>
      <Group gap="xs"><Skeleton h={36} w={300} /><Skeleton h={36} w={230} /></Group>
      <BodySkeleton />
    </Stack>
  );
}
