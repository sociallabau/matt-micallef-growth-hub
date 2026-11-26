import { fmt, pct } from "@/lib/format";
import { CountUp } from "./count-up";

export function Stat({ label, value, sub, large }: { label: string; value: string; sub?: React.ReactNode; large?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className={`tabular mt-1 font-semibold tracking-tight ${large ? "glow-text text-3xl" : "text-xl"}`}>
        <CountUp text={value} />
      </p>
      {sub && <div className="tabular mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{children}</h2>
      {aside && <div className="text-xs text-muted">{aside}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`glow animate-rise rounded-xl border p-5 ${className}`}>{children}</div>;
}

export function AudienceBar({ male, female }: { male: number; female: number }) {
  const total = male + female;
  if (!total) return <p className="text-xs text-muted">No audience data</p>;
  const f = female / total;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full">
        <div className="bg-fg" style={{ width: `${f * 100}%` }} />
        <div className="ml-px flex-1 bg-muted/40" />
      </div>
      <div className="tabular mt-1.5 flex justify-between text-xs">
        <span>Female {pct(f, 0)}</span>
        <span className="text-muted">Male {pct(1 - f, 0)}</span>
      </div>
    </div>
  );
}

/** Two-part share bar, e.g. Instagram vs Facebook followers. */
export function SplitBar({ a, b }: { a: { label: string; value: number }; b: { label: string; value: number } }) {
  const total = a.value + b.value;
  if (!total) return <p className="text-xs text-muted">No data</p>;
  const share = a.value / total;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full">
        <div className="bg-fg" style={{ width: `${share * 100}%` }} />
        <div className="ml-px flex-1 bg-muted/40" />
      </div>
      <div className="tabular mt-1.5 flex justify-between text-xs">
        <span>
          {a.label} {fmt(a.value)}
        </span>
        <span className="text-muted">
          {b.label} {fmt(b.value)}
        </span>
      </div>
    </div>
  );
}

export function StatusDot({ active, status }: { active: boolean; status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs">
      <span className={`size-2 rounded-full ${active ? "bg-fg" : "border border-muted"}`} />
      <span className={active ? "" : "text-muted"}>
        {status.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
      </span>
    </span>
  );
}
