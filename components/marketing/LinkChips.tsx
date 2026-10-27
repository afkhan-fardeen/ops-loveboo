import { Button, Group, Text } from "@mantine/core";
import { IconBrandDropbox, IconBrandFigma, IconBrandYoutube, IconFile, IconFileText, IconFolder, IconLink, IconPresentation, IconTable } from "@tabler/icons-react";
import { describeLink, type Link } from "@/lib/mkt";

const ICON: Record<string, typeof IconLink> = {
  drive_folder: IconFolder, drive_file: IconFile, doc: IconFileText, sheet: IconTable, slides: IconPresentation, form: IconFileText,
  canva: IconLink, figma: IconBrandFigma, dropbox: IconBrandDropbox, video: IconBrandYoutube, link: IconLink,
};

/** Links as clean chips (Drive folder, Google Doc, Canva...). They open in a new tab; Drive's own sharing decides who can open a file. */
export default function LinkChips({ links, empty = "No links yet." }: { links: Link[]; empty?: string }) {
  if (!links.length) return <Text size="sm" c="dimmed">{empty}</Text>;
  return (
    <Group gap={6}>
      {links.map((l, i) => {
        const info = describeLink(l.url);
        const Icon = ICON[info.kind] ?? IconLink;
        return (
          <Button key={`${l.url}-${i}`} component="a" href={l.url} target="_blank" rel="noopener noreferrer" variant="light" size="compact-sm" radius="xl"
            leftSection={<Icon size={14} />} title={`${info.label} · ${info.host}`}>
            {l.label || info.label}
          </Button>
        );
      })}
    </Group>
  );
}
