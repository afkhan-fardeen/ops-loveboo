import { Container, Group, Text } from "@mantine/core";
import SubmitButton from "@/components/SubmitButton";
import Nav from "@/components/Nav";
import { requireUser } from "@/lib/auth";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const items = [{ href: "/", label: "Home" }, ...(user.role === "admin" ? [{ href: "/admin/users", label: "Users" }] : [])];
  return (
    <>
      <Nav items={items}>
        <form action={signOut}>
          <Group gap="sm" wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="sm" maw={220} truncate>{user.name || user.email}</Text>
            <SubmitButton variant="default" size="xs">Sign out</SubmitButton>
          </Group>
        </form>
      </Nav>
      <Container size={1200} px="md" py="xl" component="main" id="main">{children}</Container>
    </>
  );
}
