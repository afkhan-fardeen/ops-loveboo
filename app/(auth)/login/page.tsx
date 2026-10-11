import Image from "next/image";
import { redirect } from "next/navigation";
import { Center, Paper, PasswordInput, Stack, Text, TextInput, Title } from "@mantine/core";
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
    <Center mih="100dvh" p="md">
      <Paper withBorder shadow="sm" radius="lg" p="xl" w="100%" maw={400}>
        <Stack gap="lg">
          <Stack gap={4} align="center">
            <Image src="/logo.png" alt="Love Boo" width={150} height={47} priority />
            <Title order={2} size="h3">Ops portal</Title>
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
