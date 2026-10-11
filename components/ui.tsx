import Link from "next/link";
import type { ReactNode } from "react";
import { pct } from "@/lib/format";

export const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function Card({ children, className, as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" }) {
  return <Tag className={cx("glass rounded-2xl p-5", className)}>{children}</Tag>;
}

export function Delta({ value, label }: { value: number | null; label?: string }) {
  if (value === null) return <span className="text-sm text-ink/70">{label ? `${label} ` : ""}—</span>;
  const up = value >= 0;
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium", up ? "bg-meadow text-teal" : "bg-berry/10 text-ink")}>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden className={cx(!up && "text-berry")}>
        <path d={up ? "M5 1 9 8H1z" : "M5 9 1 2h8z"} fill="currentColor" />
      </svg>
      <span className="tnum">{pct(value)}</span>
      {label && <span className="font-normal text-ink/70">{label}</span>}
      <span className="sr-only">{up ? "increase" : "decrease"}</span>
    </span>
  );
}

export function Kpi({ label, value, deltas, note }: { label: string; value: string; deltas?: { label: string; value: number | null }[]; note?: string }) {
  return (
    <Card className="flex flex-col gap-2 p-4 md:p-5">
      <h3 className="text-sm font-medium text-ink/70">{label}</h3>
      <p className="tnum font-display text-2xl font-semibold leading-tight md:text-3xl">{value}</p>
      {note && <p className="text-sm text-ink/70">{note}</p>}
      {deltas && <div className="flex flex-wrap gap-1.5">{deltas.map((d) => <Delta key={d.label} {...d} />)}</div>}
    </Card>
  );
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  if (values.length < 2) return null;
  const w = 600, h = 120, pad = 6;
  const min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => [pad + (i / (values.length - 1)) * (w - pad * 2), h - pad - ((v - min) / span) * (h - pad * 2)]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={label} className="h-32 w-full" preserveAspectRatio="none">
      <path d={`${line}L${w - pad} ${h}L${pad} ${h}Z`} className="fill-meadow/60" />
      <path d={line} fill="none" strokeWidth="2.5" vectorEffect="non-scaling-stroke" className="stroke-teal" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="4" className="fill-teal" />
    </svg>
  );
}

type Col<T> = { label: string; align?: "right"; render: (r: T) => ReactNode };
export function DataTable<T>({ cols, rows, rowKey, label }: { cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string; label: string }) {
  return (
    <table className="rtable w-full text-left text-base">
      <caption className="sr-only">{label}</caption>
      <thead>
        <tr className="border-b border-ink/10 text-sm text-ink/70">
          {cols.map((c) => <th key={c.label} scope="col" className={cx("px-4 py-3 font-medium", c.align === "right" && "text-right")}>{c.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={rowKey(r)} className="relative border-b border-ink/5 last:border-0 hover:bg-meadow/30">
            {cols.map((c) => <td key={c.label} data-label={c.label} className={cx("tnum px-4 py-3", c.align === "right" && "text-right")}>{c.render(r)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Button({ href, variant = "primary", children, ...rest }: { href?: string; variant?: "primary" | "ghost"; children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cx(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-base font-medium transition-colors",
    variant === "primary" ? "bg-teal text-white hover:bg-teal/90" : "border border-ink/15 bg-white/60 text-ink hover:bg-meadow/50",
  );
  return href ? <Link href={href} className={cls}>{children}</Link> : <button className={cls} {...rest}>{children}</button>;
}

export function Badge({ children, tone = "ok" }: { children: ReactNode; tone?: "ok" | "muted" }) {
  return <span className={cx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm", tone === "ok" ? "bg-meadow text-teal" : "bg-ink/5 text-ink/70")}>{children}</span>;
}

export const Skeleton = ({ className }: { className?: string }) => <div aria-hidden className={cx("rounded-xl bg-meadow/60 motion-safe:animate-pulse", className)} />;

export function Butterfly({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={className} fill="none">
      <path d="M32 30C26 14 10 10 8 22c-1 9 8 14 18 12-8 3-12 10-8 16 4 5 12 1 14-10" className="fill-meadow stroke-teal" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 30c6-16 22-20 24-8 1 9-8 14-18 12 8 3 12 10 8 16-4 5-12 1-14-10" className="fill-meadow stroke-teal" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 24v26M30 18c-1-3-3-5-5-6m9 6c1-3 3-5 5-6" className="stroke-teal" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-12 text-center">
      <Butterfly className="h-14 w-14" />
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {children && <p className="max-w-sm text-ink/70">{children}</p>}
      {action}
    </Card>
  );
}
