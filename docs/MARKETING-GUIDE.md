# Marketing guide

For everyone on the team. The same guide is in the portal under **Marketing → Guide**.

## What it is for
One place to see **what is happening when**: campaigns and events (Black Friday, Ramadan, launches, sales, Baby Expo), the work inside them (banners, social posts, emails…), **who owns it**, **when it is due**, **when it goes live**, and **where the files are** (Google Drive links).

## The idea in 30 seconds
- A **campaign or event** is the big thing with dates, for example *Black Friday, 24–30 Nov*. It shows on the calendar as a coloured band.
- **Deliverables** are the jobs inside it: a banner, a social post, an email, an ad. Each has a **Due** date (when the work is needed), a **Goes live** date (when it is published), an owner, a status and its Drive links.

## Getting started (people who can edit)
1. **New campaign** (top right). Give it a name, type, start and end dates, a colour, an owner, the markets it runs in, the offer or code, a short brief, and the Drive folder link. Save.
2. On the campaign page, press **New deliverable** for each banner, post or email. Set *Due* and *Goes live*, pick the owner, and add the Drive link to the file or folder.
3. **Update the status** as the work moves. Click the status badge anywhere to change it in one step.
4. **Check What's on** each morning: overdue work (red), due in the next 7 days, going live in the next 7 days.

## The screens
| Screen | What it shows |
|---|---|
| **What's on** | Campaigns happening now and coming up with countdowns, and the work that is overdue, due this week or going live this week. |
| **Calendar** | The planning workspace with **six views** of the same plan: **Month**, **Week**, **Agenda** (a list by date), **Timeline** (campaigns as bars across 3 or 12 months, with deliverables as markers), **Board** (cards in columns by status) and **Year** (the whole year at a glance). Filter by search, campaign, type, status, owner or market. Click anything for the details. |
| **My tasks** | Your open deliverables, soonest first. Switch to everyone's, or include finished ones. |
| **Campaign page** | The brief, dates, markets, offer, links, progress, and all deliverables grouped by type. |
| **Team** (admins) | Add people and choose what each can do in Marketing. |

## Using the calendar
- **Switch views** with the buttons at the top right (a dropdown on phones). The app remembers your last view.
- **Colour by**: colour the deliverables by campaign, type, status or owner.
- **Quick actions (people who can edit):** click an empty day to add a deliverable or a campaign on that date; drag across several days to create a campaign for those dates; drag a campaign or a deliverable to another day to reschedule it; drag a campaign's edge to change its end date; on the **Board**, drag a card to another column to change its status.
- The little counters (live now, due in 7 days, overdue) update with your data.

## Statuses
| Status | Means |
|---|---|
| **To do** | Not started. |
| **In progress** | Being made. |
| **In review** | Made, waiting for feedback or approval. |
| **Ready** | Approved, waiting for its go-live date. |
| **Live** | Published. |
| **Done** | Finished and wrapped up. |

A deliverable is **overdue** when its due date has passed and it is still *To do*, *In progress* or *In review*. *Ready*, *Live* and *Done* are never overdue.

## Drive links
- Paste the link to the file or folder and give it a clear label, for example *Banners, final* or *Reel brief*. The portal shows it as a chip (Drive folder, Google Doc, Sheet, Slides, Canva, Figma…).
- The portal only stores the link. Google Drive decides who can open it, so set the folder to **"Anyone at Love Boo with the link"** or teammates will see Google's request-access page.
- Tip: keep one Drive folder per campaign and put that folder on the campaign itself.

## Markets
Add the countries or regions a campaign runs in as tags. Pick from the suggestions or type any country and press Enter. Use the *Market* filter on the calendar to see one market at a time.

## Who can do what
- **View:** can see everything in Marketing.
- **Edit:** can also add and change campaigns and deliverables.
- **Admins** always can edit. An admin chooses each person's access in the **Team** tab (or **Users**).

### For admins: adding a member
1. Marketing → **Team** → **Add member**.
2. Enter their name and work email, press the wand to generate a password, and choose **Can view** or **Can view and edit**.
3. Share the sign-in details with them privately. The password is not shown again.
4. To change someone's access later, use the dropdown next to their name. To disable a person or give access to Reports or Events, use **Users**.

## Tips
- Add one-day moments (Singles Day, Mother's Day in a market) as the type **Key date**.
- A **Cancelled** campaign stays on the calendar, struck through, so people can see it was dropped.
- Deleting a campaign deletes all its deliverables. There is a confirmation.
- Dates are plain calendar dates. "Today", overdue and countdowns follow Bahrain time.

## Setting it up (admins, once)
1. Run `migrations/011_marketing.sql` in the ops Supabase SQL Editor.
2. In **Users** (or Marketing → **Team**), give people access.

## Coming later
Reminders by email (Monday summary, and a nudge the day before something is due), comments, and a campaign recap. See `docs/MARKETING-MODULE-PLAN.md` for what is done and what is open.
