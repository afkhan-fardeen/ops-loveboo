export const money = (n: number, currency = "GBP", decimals = 0) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);

export const int = (n: number) => new Intl.NumberFormat("en-GB").format(n);

const d = (iso: string) => new Date(`${iso}T12:00:00Z`);
export const dateLabel = (iso: string, long = false) =>
  d(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", ...(long ? { year: "numeric" } : {}), timeZone: "UTC" });

export const addDays = (iso: string, n: number) => {
  const x = d(iso);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

/** Today's calendar date in the given IANA timezone, as YYYY-MM-DD. */
export const todayIn = (tz: string) => new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
export const yesterdayIn = (tz: string) => addDays(todayIn(tz), -1);

/** UTC instants for the start and end of a store-timezone day. */
export function dayRange(iso: string, tz: string) {
  const start = (day: string) => {
    const guess = Date.parse(`${day}T00:00:00Z`);
    const offset = (t: number) => {
      const p = Object.fromEntries(
        new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
          .formatToParts(t).map((x) => [x.type, x.value]),
      );
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t;
    };
    return new Date(guess - offset(guess - offset(guess))).toISOString();
  };
  return { from: start(iso), to: start(addDays(iso, 1)) };
}

export const num2 = (n: number) => new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** 12-hour clock with AM/PM in the given timezone, e.g. "3:26 PM". */
export const time12 = (iso: string, tz: string) =>
  new Date(iso).toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true });
