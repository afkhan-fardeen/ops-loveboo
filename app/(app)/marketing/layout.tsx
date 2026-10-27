import { Group, Stack } from "@mantine/core";
import MarketingNav from "@/components/marketing/MarketingNav";
import { CampaignEditor, ItemEditor } from "@/components/marketing/Editors";
import { requireModule } from "@/lib/auth";
import { canEditMarketing, loadMarketing } from "@/lib/marketing";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const user = await requireModule("marketing");
  const { campaigns, owners, missing } = await loadMarketing();
  const canEdit = canEditMarketing(user);
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <MarketingNav />
        {canEdit && !missing && (
          <Group gap="xs">
            <ItemEditor campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} owners={owners} trigger={{ label: "New deliverable", icon: "plus" }} />
            <CampaignEditor owners={owners} trigger={{ label: "New campaign", variant: "filled", icon: "plus" }} />
          </Group>
        )}
      </Group>
      {children}
    </Stack>
  );
}
