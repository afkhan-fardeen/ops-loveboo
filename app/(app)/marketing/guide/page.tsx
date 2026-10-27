import { List, Paper, Stack, Table, Text, Title } from "@mantine/core";
import { requireModule } from "@/lib/auth";

export const metadata = { title: "Marketing · Guide" };

const SCREENS: [string, string][] = [
  ["What’s on", "Campaigns happening now and coming up with countdowns, and work that is overdue, due this week or going live this week."],
  ["Calendar", "The planning workspace, in six views: Month, Week, Agenda (a list by date), Timeline (campaigns as bars across 3 or 12 months), Board (cards by status) and Year. Filter by search, campaign, type, status, owner or market. Click anything for details."],
  ["My tasks", "Your open deliverables, soonest first. Switch to everyone’s, or include finished ones."],
  ["Campaign page", "The brief, dates, markets, offer, links, progress, and all deliverables grouped by type."],
  ["Team (admins)", "Add people and choose what each can do in Marketing."],
];
const STATUSES: [string, string][] = [
  ["To do", "Not started."], ["In progress", "Being made."], ["In review", "Made, waiting for feedback or approval."],
  ["Ready", "Approved, waiting for its go-live date."], ["Live", "Published."], ["Done", "Finished and wrapped up."],
];

const H = ({ children }: { children: React.ReactNode }) => <Title order={2} size="h4" mt="md">{children}</Title>;
const Grid = ({ rows }: { rows: [string, string][] }) => (
  <Paper withBorder p={0}>
    <Table verticalSpacing="sm" horizontalSpacing="md">
      <Table.Tbody>{rows.map(([a, b]) => <Table.Tr key={a}><Table.Td w={170}><Text fw={600} size="sm">{a}</Text></Table.Td><Table.Td><Text size="sm">{b}</Text></Table.Td></Table.Tr>)}</Table.Tbody>
    </Table>
  </Paper>
);

export default async function Guide() {
  await requireModule("marketing");
  return (
    <Stack gap="sm" maw={820}>
      <div>
        <Title order={1} size="h2">Marketing guide</Title>
        <Text c="dimmed">One place to see what is happening when, who owns it, when it is due, and where the files are.</Text>
      </div>

      <H>The idea in 30 seconds</H>
      <List spacing="xs" size="sm">
        <List.Item>A <b>campaign or event</b> is the big thing with dates, for example <i>Black Friday, 24–30 Nov</i>. It shows on the calendar as a coloured band.</List.Item>
        <List.Item><b>Deliverables</b> are the jobs inside it: a banner, a social post, an email, an ad. Each has a <b>Due</b> date (when the work is needed), a <b>Goes live</b> date (when it is published), an owner, a status and its Drive links.</List.Item>
      </List>

      <H>Getting started (people who can edit)</H>
      <List type="ordered" spacing="xs" size="sm">
        <List.Item>Press <b>New campaign</b> (top right). Give it a name, type, start and end dates, a colour, an owner, the markets, the offer or code, a short brief and the Drive folder link. Save.</List.Item>
        <List.Item>On the campaign page, press <b>New deliverable</b> for each banner, post or email. Set <i>Due</i> and <i>Goes live</i>, pick the owner, and add the Drive link to the file or folder.</List.Item>
        <List.Item><b>Update the status</b> as the work moves. Click the status badge anywhere to change it in one step.</List.Item>
        <List.Item>Check <b>What’s on</b> each morning: overdue work (red), due in the next 7 days, going live in the next 7 days.</List.Item>
      </List>

      <H>The screens</H>
      <Grid rows={SCREENS} />

      <H>Using the calendar</H>
      <List spacing="xs" size="sm">
        <List.Item><b>Switch views</b> with the buttons at the top right (a dropdown on phones). It remembers your last view.</List.Item>
        <List.Item><b>Colour by</b>: colour the deliverables by campaign, type, status or owner.</List.Item>
        <List.Item><b>Quick actions (people who can edit):</b> click an empty day to add a deliverable or campaign on that date; drag across several days to create a campaign for them; drag a campaign or deliverable to another day to reschedule it; drag a campaign’s edge to change its end date; on the Board, drag a card to another column to change its status.</List.Item>
      </List>

      <H>Statuses</H>
      <Grid rows={STATUSES} />
      <Text size="sm" c="dimmed">A deliverable is <b>overdue</b> when its due date has passed and it is still To do, In progress or In review. Ready, Live and Done are never overdue.</Text>

      <H>Drive links</H>
      <List spacing="xs" size="sm">
        <List.Item>Paste the link to the file or folder and give it a clear label, for example <i>Banners, final</i> or <i>Reel brief</i>. It shows as a chip (Drive folder, Google Doc, Sheet, Slides, Canva, Figma…).</List.Item>
        <List.Item>The portal only stores the link. <b>Google Drive decides who can open it</b>, so set the folder to “Anyone at Love Boo with the link”, or teammates will see Google’s request-access page.</List.Item>
        <List.Item>Tip: keep one Drive folder per campaign and put that folder on the campaign itself.</List.Item>
      </List>

      <H>Markets</H>
      <Text size="sm">Add the countries or regions a campaign runs in as tags. Pick from the suggestions or type any country and press Enter. Use the <i>Market</i> filter on the calendar to see one market at a time.</Text>

      <H>Who can do what</H>
      <List spacing="xs" size="sm">
        <List.Item><b>View:</b> can see everything in Marketing.</List.Item>
        <List.Item><b>Edit:</b> can also add and change campaigns and deliverables.</List.Item>
        <List.Item><b>Admins</b> always can edit. An admin chooses each person’s access in the <b>Team</b> tab (or in Users).</List.Item>
      </List>

      <H>Tips</H>
      <List spacing="xs" size="sm">
        <List.Item>Add one-day moments (Singles Day, Mother’s Day in a market) as the type <b>Key date</b>.</List.Item>
        <List.Item>A <b>Cancelled</b> campaign stays on the calendar, struck through, so people can see it was dropped.</List.Item>
        <List.Item>Deleting a campaign deletes all its deliverables. You are asked to confirm.</List.Item>
        <List.Item>Dates are plain calendar dates. “Today”, overdue and countdowns follow Bahrain time.</List.Item>
      </List>

      <H>Coming later</H>
      <Text size="sm">Reminders by email (a Monday summary, and a nudge the day before something is due), comments, and a campaign recap.</Text>
    </Stack>
  );
}
