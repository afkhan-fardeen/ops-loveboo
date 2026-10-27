/** Portal modules (what an admin grants to a person). */
export const MODULES = [
  { id: "reports", name: "Reports", description: "Daily Sales: pick a day to see its orders, sales and discounts, and email it.", href: "/reports/daily-sales" },
  { id: "events", name: "Events", description: "Expo registrations: who signed up, what they won, and whether their thank-you email went out.", href: "/events" },
  { id: "marketing", name: "Marketing", description: "Calendar of campaigns and events, the banners, posts and emails each one needs, who owns them and where the files are.", href: "/marketing" },
  // The edit right: ticked per person in Users. Not shown as a card on Home.
  { id: "marketing_edit", name: "Marketing: can edit", description: "Add and change campaigns and deliverables.", href: "/marketing", hidden: true },
] as const;
export const moduleIds = MODULES.map((m) => m.id) as string[];

/** Module ids changed once ("sales" became "reports"); keep old saved access working. */
export const normaliseModules = (ids: string[] | null | undefined) =>
  [...new Set((ids ?? []).map((m) => (m === "sales" ? "reports" : m)))];
