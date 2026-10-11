import { redirect } from "next/navigation";
import { Box, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconChartBar } from "@tabler/icons-react";
import SubmitButton from "@/components/SubmitButton";
import { getUser } from "@/lib/auth";
import { serverClient } from "@/lib/supabase";

const safe = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

async function signIn(form: FormData) {
  "use server";
  const { error } = await (await serverClient()).auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  const next = String(form.get("next") ?? "");
  redirect(error ? `/login?err=${encodeURIComponent("Incorrect email or password.")}${next ? `&next=${encodeURIComponent(next)}` : ""}` : safe(next));
}

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getUser()) redirect(safe(next));
  return (
    <Center mih="100dvh" p="md" bg="var(--mantine-color-gray-0)">
      <Paper withBorder shadow="sm" radius="md" p="xl" w="100%" maw={400}>
        <Stack gap="lg">
          <Stack gap={4} align="center">
            <Box c="blue"><IconChartBar size={36} aria-hidden /></Box>
            <Title order={2}>Love Boo Ops</Title>
            <Text c="dimmed" size="sm">Sign in to continue</Text>
          </Stack>
          <form action={signIn}>
            <input type="hidden" name="next" value={next ?? ""} />
            <Stack gap="sm">
              <TextInput name="email" type="email" label="Email" required autoComplete="username" data-autofocus autoFocus />
              <PasswordInput name="password" label="Password" required autoComplete="current-password" />
              <SubmitButton fullWidth mt="xs">Sign in</SubmitButton>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Center>
  );
}
