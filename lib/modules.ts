/** Portal modules (what an admin grants to a person). */
export const MODULES = [
  { id: "reports", name: "Reports", description: "Business reports in one place, starting with Daily Sales: orders, sales, shipping, VAT, traffic and locations, with Excel and the daily email.", href: "/reports" },
] as const;
export const moduleIds = MODULES.map((m) => m.id) as string[];

/** Reports inside the Reports module. */
export const REPORTS = [
  { id: "daily-sales", name: "Daily Sales", description: "Orders, sales, shipping, VAT, traffic and locations for any day, with period summaries, Excel exports and the daily email.", href: "/reports/daily-sales" },
] as const;

/** Module ids changed once ("sales" became "reports"); keep old saved access working. */
export const normaliseModules = (ids: string[] | null | undefined) =>
  [...new Set((ids ?? []).map((m) => (m === "sales" ? "reports" : m)))];
