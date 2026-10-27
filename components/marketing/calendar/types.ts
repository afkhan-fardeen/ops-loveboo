import type { Campaign, ColourBy, Item, Owner } from "@/lib/mkt";

export type Sel = { kind: "campaign" | "due" | "live" | "email"; id: string } | null;
export type ViewKey = "month" | "week" | "agenda" | "timeline" | "board" | "year";
export const VIEWS: { value: ViewKey; label: string }[] = [
  { value: "month", label: "Month" }, { value: "week", label: "Week" }, { value: "agenda", label: "Agenda" },
  { value: "timeline", label: "Timeline" }, { value: "board", label: "Board" }, { value: "year", label: "Year" },
];
export type ViewProps = { campaigns: Campaign[]; items: Item[]; owners: Owner[]; colourBy: ColourBy; canEdit: boolean; today: string; onSelect: (s: Sel) => void };
