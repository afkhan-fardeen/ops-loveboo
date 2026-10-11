import Image from "next/image";
import { redirect } from "next/navigation";
import { Box, Group, Paper, PasswordInput, Stack, Text, TextInput, ThemeIcon, Title } from "@mantine/core";
import { IconChartBar, IconFileSpreadsheet, IconMail } from "@tabler/icons-react";
import SubmitButton from "@/components/SubmitButton";
import { getUser } from "@/lib/auth";
import { serverClient } from "@/lib/supabase";

const safe = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") && !n.includes("\\") ? n : "/");

async function signIn(form: FormData) {
  "use server";
  const { error } = await (await serverClient()).auth.signInWithPassword({
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  });
  const next = String(form.get("next") ?? "");
  redirect(error ? `/login?err=${encodeURIComponent("Incorrect email or password.")}${next ? `&next=${encodeURIComponent(next)}` : ""}` : safe(next));
}

const POINTS = [
  { icon: IconChartBar, title: "Yesterday at a glance", text: "Net sales, orders and locations, ready every morning." },
  { icon: IconMail, title: "Daily email", text: "The same numbers in your inbox, with the Excel attached." },
  { icon: IconFileSpreadsheet, title: "Every day on record", text: "Jump to any date and export it in one click." },
];

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getUser()) redirect(safe(next));
  return (
    <Box mih="100dvh" style={{ display: "flex" }}>
      <Box visibleFrom="md" w="46%" p={56} c="white" style={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(145deg, #006d68 0%, #00403d 100%)" }}>
        <span aria-hidden style={{ position: "absolute", width: 420, height: 420, borderRadius: "50%", top: -140, right: -120, background: "rgb(255 255 255 / 0.07)" }} />
        <span aria-hidden style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", bottom: -100, left: -80, background: "rgb(255 255 255 / 0.06)" }} />
        <Image src="/logo.png" alt="Love Boo" width={118} height={37} priority style={{ filter: "brightness(0) invert(1)", position: "relative" }} />
        <Stack gap="xl" style={{ position: "relative" }}>
          <div>
            <Title order={1} fz={34} lh={1.2} c="white">Love Boo operations,<br />in one place.</Title>
            <Text c="rgb(255 255 255 / 0.75)" mt="sm" maw={420}>Sign in to see how the store is doing and manage the team’s access.</Text>
          </div>
          <Stack gap="md">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <Group key={title} gap="md" wrap="nowrap" align="flex-start">
                <ThemeIcon size={36} radius="md" variant="white" color="brand" style={{ background: "rgb(255 255 255 / 0.14)", color: "#fff" }}><Icon size={18} /></ThemeIcon>
                <div><Text fw={600} c="white" size="sm">{title}</Text><Text size="sm" c="rgb(255 255 255 / 0.7)">{text}</Text></div>
              </Group>
            ))}
          </Stack>
        </Stack>
        <Text size="xs" c="rgb(255 255 255 / 0.55)" style={{ position: "relative" }}>© Love Boo</Text>
      </Box>

      <Box style={{ flex: 1, display: "grid", placeItems: "center" }} p="md">
        <Stack gap="lg" w="100%" maw={400} className="page-in">
          <Stack gap={6} align="center" hiddenFrom="md"><Image src="/logo.png" alt="Love Boo" width={112} height={35} priority /></Stack>
          <Paper withBorder shadow="sm" p={{ base: "lg", sm: "xl" }}>
            <Stack gap="lg">
              <div>
                <Title order={2} size="h3">Welcome back</Title>
                <Text c="dimmed" size="sm">Sign in to the ops portal.</Text>
              </div>
              <form action={signIn}>
                <input type="hidden" name="next" value={next ?? ""} />
                <Stack gap="sm">
                  <TextInput name="email" type="email" label="Email" required autoComplete="username" autoFocus size="md" />
                  <PasswordInput name="password" label="Password" required autoComplete="current-password" size="md" />
                  <SubmitButton fullWidth size="md" mt="xs">Sign in</SubmitButton>
                </Stack>
              </form>
            </Stack>
          </Paper>
          <Text size="xs" c="dimmed" ta="center">Trouble signing in? Ask an admin to reset your password.</Text>
        </Stack>
      </Box>
    </Box>
  );
}
