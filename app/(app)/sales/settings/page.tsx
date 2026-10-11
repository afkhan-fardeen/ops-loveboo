import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function Settings() {
  const list = [
    ["Store", process.env.SHOPIFY_STORE_DOMAIN ?? "Not set"],
    ["Currency", "GBP"],
    ["Store timezone", process.env.STORE_TIMEZONE ?? "Europe/London"],
    ["Send time", "08:00 Bahrain (05:00 UTC) daily"],
    ["Recipients", (process.env.REPORT_RECIPIENTS ?? "").split(",").filter(Boolean).join(", ") || "Not set"],
  ];
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="text-ink/70">Read-only for now. Change these in Vercel environment variables.</p>
      </div>
      <Card>
        <dl className="divide-y divide-ink/10">
          {list.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0 md:flex-row md:justify-between md:gap-6">
              <dt className="text-ink/70">{k}</dt>
              <dd className="break-words font-medium md:text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
