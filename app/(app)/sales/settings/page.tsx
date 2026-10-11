import { Button, Card } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { save } from "./actions";

export const dynamic = "force-dynamic";

export default async function Settings({ searchParams }: { searchParams: Promise<{ saved?: string; err?: string }> }) {
  await requireAdmin();
  const { saved, err } = await searchParams;
  const cfg = await getSettings();
  const info = [
    ["Store", process.env.SHOPIFY_STORE_DOMAIN ?? "Not set"],
    ["Currency", "GBP"],
    ["Store timezone", process.env.STORE_TIMEZONE ?? "Europe/London"],
    ["Send time", "08:00 Bahrain (05:00 UTC), every day for the previous day"],
  ];
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-ink/70">Who gets the daily sales email, and what’s in it. Only admins can see this page.</p>
      </div>

      {saved && <p role="status" className="rounded-xl bg-meadow px-4 py-2">Settings saved.</p>}
      {err && <p role="alert" className="rounded-xl bg-berry/10 px-4 py-2">{err}</p>}

      <Card>
        <form action={save} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="recipients" className="font-medium">Recipients</label>
            <textarea id="recipients" name="recipients" rows={5} defaultValue={cfg.recipients.join("\n")} spellCheck={false}
              placeholder={"name@loveboo.com\nanother@loveboo.com"}
              className="rounded-xl border border-ink/20 bg-white px-3 py-2 text-base placeholder:text-ink/50" />
            <p className="text-sm text-ink/70">One email per line (commas work too). Until loveboo.com is verified in Resend, only the Resend account owner’s address will receive mail.</p>
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="emailEnabled" defaultChecked={cfg.emailEnabled} className="h-5 w-5 accent-teal" />
            Send the daily email
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="attachExcel" defaultChecked={cfg.attachExcel} className="h-5 w-5 accent-teal" />
            Attach the Excel file
          </label>
          <div><Button type="submit">Save settings</Button></div>
        </form>
      </Card>

      <Card>
        <dl className="divide-y divide-ink/10">
          {info.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 md:flex-row md:justify-between md:gap-6">
              <dt className="text-ink/70">{k}</dt>
              <dd className="break-words font-medium md:text-right">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-sm text-ink/70">These are set in Vercel environment variables and the cron schedule.</p>
      </Card>
    </div>
  );
}
