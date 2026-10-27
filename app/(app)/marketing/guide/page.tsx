import { Anchor, Group, List, ListItem, Paper, SimpleGrid, Stack, Table, TableTbody, TableTd, TableTr, Text, Title } from "@mantine/core";
import { requireModule } from "@/lib/auth";

export const metadata = { title: "Marketing · Guide" };

// Note: this is a server page, so Mantine's dotted parts (List.Item, Table.Td…) can't be used; the named exports can.

const START: { title: string; who: string; steps: string[] }[] = [
  { title: "I want to see what’s on", who: "Everyone", steps: ["Open What’s on for campaigns running now and coming up, and what is due this week.", "Open Calendar and click anything for the details, the owner and the Drive links.", "Use the filters (campaign, type, status, owner, market) to see only what matters to you."] },
  { title: "I plan and update the work", who: "People who can edit", steps: ["Press New campaign, then add a New deliverable for each banner, post or email.", "Change a status in one click as the work moves (click the status badge).", "On the Calendar, click a day to add something, or drag things to reschedule."] },
  { title: "I look after the team", who: "Admins", steps: ["Open the Team tab and press Add member: name, email, a generated password.", "Choose what each person can do in Marketing: no access, can view, or can view and edit.", "Share the sign-in details privately. Use Users to disable someone or give Reports or Events access."] },
];
const VIEWS: [string, string][] = [
  ["Month", "The big picture of a month: campaign bands with deliverable chips."],
  ["Week", "One busy week with room to read everything."],
  ["Agenda", "A plain list by date. Good on a phone."],
  ["Timeline", "Campaigns as bars across 3 or 12 months, with deliverables as markers. Best for seeing overlaps."],
  ["Board", "Cards in columns by status: who is at what stage."],
  ["Year", "The whole year at a glance: where campaigns cluster."],
];
const ACTIONS: [string, string][] = [
  ["Click an empty day", "Add a deliverable (due or going live that day) or a campaign starting that day."],
  ["Drag across several days", "Create a campaign for those dates."],
  ["Drag a campaign or deliverable", "Reschedule it to another day."],
  ["Drag a campaign’s edge", "Change when it ends."],
  ["Drag a Board card", "Change its status."],
  ["Click a status badge", "Change the status from a menu, anywhere you see it."],
];
const STATUSES: [string, string][] = [
  ["To do", "Not started."], ["In progress", "Being made."], ["In review", "Made, waiting for feedback or approval."],
  ["Ready", "Approved, waiting for its go-live date."], ["Live", "Published."], ["Done", "Finished and wrapped up."],
];
const SCREENS: [string, string][] = [
  ["What’s on", "Campaigns happening now and coming up with countdowns, and work that is overdue, due this week or going live this week."],
  ["Calendar", "The planning workspace in six views, with filters, search and colour options."],
  ["My tasks", "Your open deliverables, soonest first. Switch to everyone’s, or include finished ones."],
  ["Campaign page", "The brief, dates, markets, offer, links, progress, and all deliverables grouped by type."],
  ["Team (admins)", "Add people and choose what each can do in Marketing."],
];
const FAQ: [string, string][] = [
  ["I can’t see Marketing in the menu.", "An admin needs to give you access. Ask them to open Marketing → Team and set you to “Can view” or “Can view and edit”."],
  ["I can see Marketing but can’t add or change anything.", "You have view access. Ask an admin for “Can view and edit”."],
  ["A Drive link asks me to request access.", "Google Drive decides who can open a file, not the portal. Ask the file’s owner to share it with “Anyone at Love Boo with the link”, or with you."],
  ["I dragged something to the wrong day.", "Drag it back, or open it and change the date. Nothing is lost."],
  ["It won’t let me move a deliverable.", "A deliverable can’t go live before it is due. Change its due date first, or move the go-live day later."],
  ["I deleted a campaign by mistake.", "There is no undo, and deleting a campaign also deletes its deliverables. To drop a campaign but keep the record, set its status to Cancelled instead: it stays on the calendar, struck through."],
  ["Why is something marked overdue?", "Its due date has passed and it is still To do, In progress or In review. Move it to Ready, Live or Done and the red goes away."],
  ["The date looks a day off.", "Dates are plain calendar dates, with no time of day. “Today”, overdue and countdowns follow Bahrain time."],
  ["The page says it couldn’t load.", "Refresh once. If it keeps happening, tell an admin what you were opening."],
];

const H = ({ id, children }: { id: string; children: React.ReactNode }) => <Title id={id} order={2} size="h4" mt="lg" style={{ scrollMarginTop: 16 }}>{children}</Title>;
const Grid = ({ rows, w = 190 }: { rows: [string, string][]; w?: number }) => (
  <Paper withBorder p={0}>
    <Table verticalSpacing="sm" horizontalSpacing="md">
      <TableTbody>{rows.map(([a, b]) => <TableTr key={a}><TableTd w={w}><Text fw={600} size="sm">{a}</Text></TableTd><TableTd><Text size="sm">{b}</Text></TableTd></TableTr>)}</TableTbody>
    </Table>
  </Paper>
);

export default async function Guide() {
  await requireModule("marketing");
  return (
    <Stack gap="sm" maw={860}>
      <div>
        <Title order={1} size="h2">Marketing guide</Title>
        <Text c="dimmed">One place to see what is happening when, who owns it, when it is due, and where the files are.</Text>
      </div>
      <Group gap="md" wrap="wrap">
        {[["start", "Start here"], ["portal", "The portal"], ["idea", "The idea"], ["calendar", "Calendar"], ["statuses", "Statuses"], ["drive", "Drive links"], ["access", "Who can do what"], ["faq", "Questions"]].map(([id, l]) => <Anchor key={id} href={`#${id}`} size="sm">{l}</Anchor>)}
      </Group>

      <H id="start">Start here</H>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        {START.map((s) => (
          <Paper key={s.title} withBorder radius="lg" p="md">
            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{s.who}</Text>
            <Text fw={700} mb={6}>{s.title}</Text>
            <List size="sm" spacing={6}>{s.steps.map((t) => <ListItem key={t}>{t}</ListItem>)}</List>
          </Paper>
        ))}
      </SimpleGrid>

      <H id="portal">The portal at a glance</H>
      <List spacing="xs" size="sm">
        <ListItem><b>Sign in</b> at ops.loveboo.com with the email and password an admin gave you. The menu on the left (the tabs at the bottom on a phone) shows only the areas you can open.</ListItem>
        <ListItem><b>On your phone:</b> open ops.loveboo.com, then use your browser’s “Add to Home Screen” (Safari: Share → Add to Home Screen; Chrome: menu → Install app) to keep it like an app.</ListItem>
        <ListItem><b>Forgot your password?</b> Ask an admin to set a new one for you in Users.</ListItem>
      </List>

      <H id="idea">The idea in 30 seconds</H>
      <List spacing="xs" size="sm">
        <ListItem>A <b>campaign or event</b> is the big thing with dates, for example <i>Black Friday, 24–30 Nov</i>. It shows on the calendar as a coloured band.</ListItem>
        <ListItem><b>Deliverables</b> are the jobs inside it: a banner, a social post, an email, an ad. Each has a <b>Due</b> date (when the work is needed), a <b>Goes live</b> date (when it is published), an owner, a status and its Drive links.</ListItem>
        <ListItem>Everyone sees the same plan, so nobody has to ask “what’s happening this week?”.</ListItem>
      </List>

      <H id="getting-started">Getting started (people who can edit)</H>
      <List type="ordered" spacing="xs" size="sm">
        <ListItem>Press <b>New campaign</b> (top right). Give it a name, type, start and end dates, a colour, an owner, the markets, the offer or code, a short brief and the Drive folder link. Save.</ListItem>
        <ListItem>On the campaign page, press <b>New deliverable</b> for each banner, post or email. Set <i>Due</i> and <i>Goes live</i>, pick the owner, and add the Drive link to the file or folder.</ListItem>
        <ListItem><b>Update the status</b> as the work moves. Click the status badge anywhere to change it in one step.</ListItem>
        <ListItem>Check <b>What’s on</b> each morning: overdue work (red), due in the next 7 days, going live in the next 7 days.</ListItem>
      </List>

      <H id="screens">The screens</H>
      <Grid rows={SCREENS} />

      <H id="calendar">The calendar: six views</H>
      <Text size="sm">Switch with the buttons at the top right (a dropdown on a phone). It remembers your last view. <b>Colour by</b> lets you colour deliverables by campaign, type, status or owner.</Text>
      <Grid rows={VIEWS} w={120} />
      <Title order={3} size="h5" mt="sm">Quick actions (people who can edit)</Title>
      <Grid rows={ACTIONS} w={230} />

      <H id="statuses">Statuses</H>
      <Grid rows={STATUSES} w={150} />
      <Text size="sm" c="dimmed">A deliverable is <b>overdue</b> when its due date has passed and it is still To do, In progress or In review. Ready, Live and Done are never overdue.</Text>

      <H id="drive">Drive links</H>
      <List spacing="xs" size="sm">
        <ListItem>Paste the link to the file or folder and give it a clear label, for example <i>Banners, final</i> or <i>Reel brief</i>. It shows as a chip (Drive folder, Google Doc, Sheet, Slides, Canva, Figma…).</ListItem>
        <ListItem>The portal only stores the link. <b>Google Drive decides who can open it</b>, so set the folder to “Anyone at Love Boo with the link”, or teammates will see Google’s request-access page.</ListItem>
        <ListItem>Tip: keep one Drive folder per campaign and put that folder on the campaign itself.</ListItem>
      </List>

      <H id="markets">Markets</H>
      <Text size="sm">Add the countries or regions a campaign runs in as tags. Pick from the suggestions or type any country and press Enter. Use the <i>Market</i> filter on the calendar to see one market at a time.</Text>

      <H id="access">Who can do what</H>
      <List spacing="xs" size="sm">
        <ListItem><b>Can view:</b> sees everything in Marketing.</ListItem>
        <ListItem><b>Can view and edit:</b> can also add and change campaigns and deliverables.</ListItem>
        <ListItem><b>Admins</b> always can edit. An admin chooses each person’s access in the <b>Team</b> tab (or in Users).</ListItem>
      </List>

      <H id="tips">Tips</H>
      <List spacing="xs" size="sm">
        <ListItem>Add one-day moments (Singles Day, Mother’s Day in a market) as the type <b>Key date</b>.</ListItem>
        <ListItem>Keep deliverable titles specific, for example “Homepage banner, desktop + mobile”, so they are easy to find with the search box.</ListItem>
        <ListItem>Set the <b>owner</b> on everything: it is what makes <b>My tasks</b> useful.</ListItem>
      </List>

      <H id="faq">Questions people ask</H>
      <Stack gap={8}>
        {FAQ.map(([q, a]) => (
          <Paper key={q} withBorder radius="md" p="sm">
            <Text fw={600} size="sm">{q}</Text>
            <Text size="sm" c="dimmed" mt={2}>{a}</Text>
          </Paper>
        ))}
      </Stack>

      <H id="later">Coming later</H>
      <Text size="sm">Reminders by email (a Monday summary, and a nudge the day before something is due), comments, and a campaign recap.</Text>
    </Stack>
  );
}
