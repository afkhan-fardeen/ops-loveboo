export const MODULES = [
  { id: "sales", name: "Sales Reporting", description: "Daily net sales, orders, AOV and top products.", href: "/sales" },
] as const;
export const moduleIds = MODULES.map((m) => m.id) as string[];
