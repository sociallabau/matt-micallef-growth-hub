import type { Client, MonthPoint } from "@/lib/airtable";
import type { ClientWithAds } from "@/lib/data";
import type { MonthDrivers } from "@/lib/organic";
import { compact, fmt } from "@/lib/format";
import { comparisonCopy, windowReasons, type NinetyDayWindows, type Reason } from "@/lib/windows";
import { MonthlyChart } from "./monthly-chart";
import { CountUp } from "./count-up";

type Verdict = "growing" | "mixed" | "slowing";

export function verdict(c: Client): { kind: Verdict; label: string } {
  const followersUp = c.netGrowth > 0;
  const viewsUp = c.viewsSince > c.viewsBefore;
  const interactionsUp = c.interactionsSince > c.interactionsBefore;
  const ups = [followersUp, viewsUp, interactionsUp].filter(Boolean).length;
  if (ups === 3) return { kind: "growing", label: "Growing" };
  if (ups === 0) return { kind: "slowing", label: "Slowing" };
  return { kind: "mixed", label: followersUp ? "Growing followers" : "Mixed" };
}

export function VerdictBadge({ client }: { client: Client }) {
  const v = verdict(client);
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-2.5 py-1 text-xs">
      <span aria-hidden className={v.kind === "growing" ? "text-good" : v.kind === "slowing" ? "text-critical" : "text-muted"}>
        {v.kind === "growing" ? "▲" : v.kind === "slowing" ? "▼" : "◆"}
      </span>
      {v.label}
    </span>
  );
}

function Arrow({ up }: { up: boolean }) {
  return (
    <span aria-label={up ? "up" : "down"} className={up ? "text-good" : "text-critical"}>
      {up ? "▲" : "▼"}
    </span>
  );
}

const mon = (iso: string) => new Intl.DateTimeFormat("en-AU", { month: "long" }).format(new Date(iso));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export type { Reason };

/**
 * Short, plain-English reasons a per-month average fell.
 *
 * When the headline is current 90 days vs previous 90 days, reasons come only
 * from those two totals. Naming a calendar month ("October was a paid ad spike")
 * or comparing post counts across the old blocks would describe a window the
 * sentence is no longer using.
 *
 * Without 90-day rows, the original calendar-month reasons stay: Meta's paid vs
 * organic split and posting volume when we have them, otherwise what the monthly
 * totals alone can show.
 */
export function whyDown(
  points: MonthPoint[],
  drivers: MonthDrivers[] | null,
  metric: "views" | "interactions",
  since: number,
  windows?: NinetyDayWindows | null,
): Reason[] {
  if (windows) return windowReasons(metric, windows);
  const out: Reason[] = [];
  const done = points.filter((p) => !p.partial);
  const n = Math.min(3, Math.floor(done.length / 2));
  const before = done.slice(0, n);
  const after = done.slice(-n);
  const current = points.find((p) => p.partial);
  const d = (p: MonthPoint) => drivers?.find((x) => x.month === p.month.slice(0, 7));

  // 1. A one-off spike in the early months inflating the comparison
  if (before.length >= 2) {
    const peak = before.reduce((a, b) => (b[metric] > a[metric] ? b : a));
    const total = before.reduce((t, p) => t + p[metric], 0);
    const others = (total - peak[metric]) / (before.length - 1);
    if (peak[metric] > total * 0.5 && peak[metric] > others * 2) {
      const pd = d(peak);
      const paid = pd && pd.fbAdViews > (pd.fbAdViews + pd.fbOrganicViews) * 0.5;
      const post = paid ? pd.promoted[0] : pd?.topPost;
      out.push({
        text: paid ? `${mon(peak.month)} was a paid ad spike` : `${mon(peak.month)} was a one-off spike`,
        link: post ? { href: post.url, label: "see post" } : undefined,
      });
    }
  }

  if (drivers && after.length) {
    // 2. Paid promotion
    const adsBefore = avg(before.map((p) => d(p)?.fbAdViews ?? 0));
    const adsAfter = avg(after.map((p) => d(p)?.fbAdViews ?? 0));
    if (adsAfter < adsBefore * 0.7) out.push({ text: `Fewer ads since ${mon(after[0].month)}` });

    // 3. Content: posting volume + organic reach, in one line
    const postsUp = avg(after.map((p) => d(p)?.posts ?? 0)) >= avg(before.map((p) => d(p)?.posts ?? 0));
    const org = (p: MonthPoint) => (d(p)?.fbOrganicViews ?? 0) + (d(p)?.igViews ?? 0);
    const organicUp = avg(after.map(org)) >= avg(before.map(org));
    if (postsUp && organicUp) out.push({ text: "Posting and organic views are up" });
    else if (!postsUp) out.push({ text: "Fewer posts going out" });
    else out.push({ text: "Organic views are down" });
  } else if (after.length >= 2 && after.every((p, i) => i === 0 || p[metric] < after[i - 1][metric])) {
    out.push({ text: `Down every month since ${mon(after[0].month)}` });
  }

  // 4. Engagement quality (interactions per view)
  const rate = (p: MonthPoint) => (p.views ? p.interactions / p.views : 0);
  const rb = avg(before.map(rate).filter(Boolean));
  const ra = avg(after.map(rate).filter(Boolean));
  if (metric === "interactions" && rb && ra) out.push({ text: ra >= rb ? "Engagement rate is up" : "Engagement rate is down" });

  // 5. The current month, not yet in the average
  if (current && current[metric] > since) out.push({ text: `${mon(current.month)} already at ${compact(current[metric])}` });
  return out.slice(0, 4);
}

function MonthlyTakeaway({
  since,
  before,
  noun,
  labels,
  reasons = [],
}: {
  since: number;
  before: number;
  noun: string;
  labels: Client["compare"];
  reasons?: Reason[];
}) {
  if (!since && !before) return null;
  const copy = comparisonCopy(since, before, labels?.recentLabel, labels?.earlyLabel);
  return (
    <>
      <p className="text-sm">
        <Arrow up={copy.up} />{" "}
        <span className="font-semibold">
          <CountUp text={copy.sinceText} delay={150} />
        </span>{" "}
        {noun} a month {copy.recent}
        <span className="text-muted">
          {" "}
          · {copy.direction} from {copy.beforeText} {copy.early}
        </span>
      </p>
      {!copy.up && reasons.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {reasons.map((r) => (
            <li key={r.text + (r.link?.href ?? "")} className="flex gap-2">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted" />
              <span>
                {r.text}
                {r.link && (
                  <>
                    {" "}
                    <a href={r.link.href} target="_blank" rel="noreferrer" className="text-fg underline underline-offset-2 hover:no-underline">
                      {r.link.label} ↗
                    </a>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Block({ title, takeaway, children }: { title: string; takeaway: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{title}</p>
      <div className="mt-1.5 min-h-5">{takeaway}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function FollowersBlock({ client: c, height }: { client: Client; height?: number }) {
  return (
    <Block
      title="Followers"
      takeaway={
        <p className="text-sm">
          <span className="glow-text text-2xl font-semibold tracking-tight">
            <CountUp text={fmt(c.totalFollowers)} />
          </span>
          {c.netGrowth !== 0 && (
            <span className="ml-2 text-muted">
              <Arrow up={c.netGrowth > 0} /> {c.netGrowth > 0 ? "+" : ""}
              {fmt(c.netGrowth)} since {c.startLabel}
            </span>
          )}
        </p>
      }
    >
      <MonthlyChart points={c.months} metric="followers" height={height} />
    </Block>
  );
}

export function ViewsBlock({ client: c, height }: { client: ClientWithAds; height?: number }) {
  return (
    <Block title="Views per month" takeaway={<MonthlyTakeaway since={c.viewsSince} before={c.viewsBefore} noun="views" labels={c.compare} reasons={whyDown(c.months, c.drivers, "views", c.viewsSince, c.compare?.windows)} />}>
      <MonthlyChart points={c.months} metric="views" height={height} />
    </Block>
  );
}

export function InteractionsBlock({ client: c, height }: { client: ClientWithAds; height?: number }) {
  return (
    <Block
      title="Interactions per month"
      takeaway={
        <MonthlyTakeaway
          since={c.interactionsSince}
          before={c.interactionsBefore}
          noun="interactions"
          labels={c.compare}
          reasons={whyDown(c.months, c.drivers, "interactions", c.interactionsSince, c.compare?.windows)}
        />
      }
    >
      <MonthlyChart points={c.months} metric="interactions" height={height} />
    </Block>
  );
}

export function ChartKey() {
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-muted/60" /> Before onboarding
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm bg-fg" /> Since onboarding
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-fg bg-fg/20" /> This month so far
      </span>
    </p>
  );
}
