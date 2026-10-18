import { latestDate } from "./data";
import { addDays, yesterdayIn } from "./format";
import { TZ } from "./timezone";

/** Days between the newest stored day and yesterday (store timezone) that have no report yet, oldest first. At most 7. */
export async function missingDays(): Promise<string[]> {
  const latest = await latestDate();
  if (!latest) return [];
  const yesterday = yesterdayIn(TZ);
  const days: string[] = [];
  for (let d = addDays(latest, 1); d <= yesterday && days.length < 7; d = addDays(d, 1)) days.push(d);
  return days;
}
