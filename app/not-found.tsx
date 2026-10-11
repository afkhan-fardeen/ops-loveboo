import { Center, Stack, Text, Title } from "@mantine/core";
import { LinkButton } from "@/components/Links";

export default function NotFound() {
  return (
    <Center mih="100dvh" p="md">
      <Stack align="center" gap="sm" ta="center" maw={420}>
        <Text fz={64} fw={800} lh={1} c="brand">404</Text>
        <Title order={2}>We can’t find that page</Title>
        <Text c="dimmed">The link may be old or mistyped. Head back and pick up where you left off.</Text>
        <div style={{ marginTop: 8 }}><LinkButton href="/">Back to home</LinkButton></div>
      </Stack>
    </Center>
  );
}
