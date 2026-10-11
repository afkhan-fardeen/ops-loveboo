export const MODULES = [
  { id: "sales", name: "Sales", description: "Daily sales, orders and locations, with reports, Excel exports and the daily email.", href: "/sales" },
] as const;
export const moduleIds = MODULES.map((m) => m.id) as string[];
