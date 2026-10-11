import { redirect } from "next/navigation";
import { Alert, Box, Button, Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconAlertCircle, IconChartBar } from "@tabler/icons-react";
import { getUser } from "@/lib/auth";
import { serverClient } from "@/lib/supabase";

const safe = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/");

async function signIn(form: FormData) {
  "use server";
  const { error } = await (await serverClient()).auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  redirect(error ? "/login?error=1" : safe(String(form.get("next") ?? "")));
}

const MSG: Record<string, string> = {
  "1": "Incorrect email or password.",
  access: "Your account doesn’t have access. Ask an admin.",
};

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
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
              <TextInput name="email" type="email" label="Email" required autoComplete="username" />
              <PasswordInput name="password" label="Password" required autoComplete="current-password" />
              {error && MSG[error] && <Alert color="red" icon={<IconAlertCircle size={16} />} role="alert">{MSG[error]}</Alert>}
              <Button type="submit" fullWidth mt="xs">Sign in</Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Center>
  );
}
