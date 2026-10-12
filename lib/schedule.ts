/** Timezone the admin's send time is expressed in. */
export const SEND_TZ = "Asia/Bahrain";
export const DEFAULT_SEND_TIME = "08:00";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isHHMM = (s: string) => HHMM.test(s);

/** "08:30" → 510 minutes after midnight; null if malformed. */
export function toMinutes(s: string): number | null {
  const m = HHMM.exec(s);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Minutes after midnight right now in the given timezone. */
export function minutesNow(tz: string, now = new Date()) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return get("hour") * 60 + get("minute");
}

/** True once the configured send time has passed today (in `tz`). The daily job is idempotent, so "due" can safely stay true all day. */
export function isDue(sendTime: string, tz = SEND_TZ, now = new Date()) {
  const at = toMinutes(sendTime);
  return at !== null && minutesNow(tz, now) >= at;
}
