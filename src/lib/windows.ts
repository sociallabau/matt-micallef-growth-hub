import { compact1 } from "./format";

/**
 * Headline comparisons on the chart cards.
 *
 * Monthly Trend tables carry two extra rows per client, refreshed in place
 * every Monday: "Current 90 days (…)" and "Previous 90 days (…)". Month and
 * Period are blank so they are not calendar months. Their views, interactions,
 * profile visits, follows and followers are exact 90-day Meta totals.
 *
 * The card still speaks in "a month" units, so a window total is divided by 3.
 * Date labels are taken from the row (the parenthetical range), never hardcoded.
 * A client missing either row keeps the older calendar-month comparison.
 */

export const NINETY_DAY_MONTHS = 3;

const WINDOW_KIND = /\b(current|previous)\s+90[\s-]*days?\b/i;
const WINDOW_RANGE = /\b(?:current|previous)\s+90[\s-]*days?\s*\(([^)]+)\)/i;

export type WindowKind = "current" | "previous";

export type WindowMetrics = {
  /** Date range copied from the row, e.g. "19 Aug–16 Nov 2026". */
  label: string;
  /** Inclusive YYYY-MM-DD bounds when the row states them. */
  since: string | null;
  until: string | null;
  views: number;
  interactions: number;
  profileVisits: number;
  newFollows: number;
  followers: number;
};

export type NinetyDayWindows = {
  current: WindowMetrics;
  previous: WindowMetrics;
};

export type WindowDraft = {
  clientIds: string[];
  label: string | null;
  notes: string | null;
  views: number;
  interactions: number;
  profileVisits: number;
  newFollows: number;
  followers: number;
};

export type Reason = { text: string; link?: { href: string; label: string } };

export function windowKind(text: string | null): WindowKind | null {
  const match = text?.match(WINDOW_KIND);
  if (!match) return null;
  return match[1].toLowerCase() === "current" ? "current" : "previous";
}

/**
 * Where a Monthly Trend row belongs.
 * A 90-day label is never a chart month, even if Month was filled in by mistake.
 * A real calendar month whose notes merely mention "90 days" stays on the chart.
 * A blank-month row is a window only when its label (or, failing that, its notes)
 * names the current or previous 90 days.
 */
export function routeTrendRow(
  label: string | null,
  notes: string | null,
  month: string | null,
): WindowKind | "chart" | "skip" {
  const kind = windowKind(label) ?? (month ? null : windowKind(notes));
  if (kind) return kind;
  return month ? "chart" : "skip";
}

/** Parenthetical range from the label, then the notes. Null when the row doesn't carry one. */
export function windowDateLabel(label: string | null, notes: string | null): string | null {
  for (const text of [label, notes]) {
    const match = text?.match(WINDOW_RANGE);
    const range = match?.[1]?.replace(/\s+/g, " ").trim();
    if (range) return range;
  }
  return null;
}

const fallbackLabel: Record<WindowKind, string> = {
  current: "the latest 90 days",
  previous: "the previous 90 days",
};

const ISO_RANGE = /(\d{4}-\d{2}-\d{2})\s*[–—-]\s*(\d{4}-\d{2}-\d{2})/;
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Inclusive dates for a 90-day row. Prefers the ISO window in the notes, then the label. */
export function windowBounds(label: string | null, notes: string | null): { since: string; until: string } | null {
  for (const text of [notes, label]) {
    const iso = text?.match(ISO_RANGE);
    if (iso) return { since: iso[1], until: iso[2] };
  }
  const human = windowDateLabel(label, notes);
  const match = human?.match(/(\d{1,2})\s+([A-Za-z]{3,})\s*(\d{4})?\s*[–—-]\s*(\d{1,2})\s+([A-Za-z]{3,})\s*(\d{4})/);
  if (!match) return null;
  const startMonth = MONTHS[match[2].slice(0, 3).toLowerCase()];
  const endMonth = MONTHS[match[5].slice(0, 3).toLowerCase()];
  const endYear = Number(match[6]);
  if (!startMonth || !endMonth || !endYear) return null;
  let startYear = match[3] ? Number(match[3]) : endYear;
  if (!match[3] && startMonth > endMonth) startYear -= 1;
  return { since: isoDate(startYear, startMonth, Number(match[1])), until: isoDate(endYear, endMonth, Number(match[4])) };
}

export function collectWindows(rows: WindowDraft[]): Map<string, { current?: WindowMetrics; previous?: WindowMetrics }> {
  const map = new Map<string, { current?: WindowMetrics; previous?: WindowMetrics }>();
  for (const row of rows) {
    const kind = windowKind(row.label) ?? windowKind(row.notes);
    if (!kind) continue;
    const bounds = windowBounds(row.label, row.notes);
    const metrics: WindowMetrics = {
      label: windowDateLabel(row.label, row.notes) ?? fallbackLabel[kind],
      since: bounds?.since ?? null,
      until: bounds?.until ?? null,
      views: row.views,
      interactions: row.interactions,
      profileVisits: row.profileVisits,
      newFollows: row.newFollows,
      followers: row.followers,
    };
    for (const id of row.clientIds) {
      const bucket = map.get(id) ?? {};
      bucket[kind] = metrics;
      map.set(id, bucket);
    }
  }
  return map;
}

/** Both rows are required. One row is not mixed with a calendar-month average. */
export function readyWindows(
  bucket: { current?: WindowMetrics; previous?: WindowMetrics } | undefined,
): NinetyDayWindows | null {
  if (!bucket?.current || !bucket.previous) return null;
  return { current: bucket.current, previous: bucket.previous };
}

/** 90-day total → the card's existing "a month" unit. */
export function perMonth(total: number): number {
  return total / NINETY_DAY_MONTHS;
}

export type CalendarMonth = {
  month: string;
  partial: boolean;
  views: number;
  interactions: number;
};

export type CalendarComparison = {
  earlyLabel: string;
  recentLabel: string;
  viewsBefore: number;
  viewsSince: number;
  interactionsBefore: number;
  interactionsSince: number;
};

const monthLabel = (iso: string, year = true) =>
  new Intl.DateTimeFormat("en-AU", { month: "short", ...(year ? { year: "numeric" } : {}) }).format(new Date(iso));

const rangeLabel = (months: string[]) => {
  const a = months[0];
  const b = months[months.length - 1];
  if (a === b) return monthLabel(a);
  return a.slice(0, 4) === b.slice(0, 4) ? `${monthLabel(a, false)}–${monthLabel(b)}` : `${monthLabel(a)} – ${monthLabel(b)}`;
};

const avgOf = (months: CalendarMonth[], key: "views" | "interactions") =>
  months.reduce((total, month) => total + month[key], 0) / (months.length || 1);

/**
 * Previous behaviour, kept for clients who don't have both 90-day rows yet:
 * the first finished months against the latest finished months (up to three each).
 */
export function calendarWindows(months: CalendarMonth[]): CalendarComparison | null {
  const done = months.filter((month) => !month.partial);
  const n = Math.min(3, Math.floor(done.length / 2));
  if (n < 1) return null;
  const early = done.slice(0, n);
  const recent = done.slice(-n);
  return {
    earlyLabel: rangeLabel(early.map((month) => month.month)),
    recentLabel: rangeLabel(recent.map((month) => month.month)),
    viewsBefore: avgOf(early, "views"),
    viewsSince: avgOf(recent, "views"),
    interactionsBefore: avgOf(early, "interactions"),
    interactionsSince: avgOf(recent, "interactions"),
  };
}

export function comparisonCopy(
  since: number,
  before: number,
  recentLabel?: string | null,
  earlyLabel?: string | null,
) {
  const up = since >= before;
  return {
    up,
    sinceText: compact1(since),
    beforeText: compact1(before),
    direction: up ? ("up" as const) : ("down" as const),
    recent: recentLabel ? `in ${recentLabel}` : "since onboarding",
    early: earlyLabel ? `in ${earlyLabel}` : "before",
  };
}

export function comparisonSentence(
  since: number,
  before: number,
  noun: string,
  recentLabel?: string | null,
  earlyLabel?: string | null,
): string {
  const copy = comparisonCopy(since, before, recentLabel, earlyLabel);
  const arrow = copy.up ? "▲" : "▼";
  return `${arrow} ${copy.sinceText} ${noun} a month ${copy.recent} · ${copy.direction} from ${copy.beforeText} ${copy.early}`;
}

/**
 * Reasons under a 90-day headline. Only facts that can be read off the two
 * window totals. Calendar-month reasons ("October was a paid ad spike",
 * "Fewer posts going out", "Down every month since …") described a different
 * pair of blocks, and these rows don't carry post counts or a paid/organic
 * split, so those lines are left off rather than repeated against the wrong window.
 */
export function windowReasons(metric: "views" | "interactions", windows: NinetyDayWindows): Reason[] {
  if (metric !== "interactions") return [];
  const before = windows.previous.views ? windows.previous.interactions / windows.previous.views : 0;
  const since = windows.current.views ? windows.current.interactions / windows.current.views : 0;
  if (!before || !since) return [];
  return [{ text: since >= before ? "Engagement rate is up" : "Engagement rate is down" }];
}

/** A date range shared by every account in an aggregate. Mixed or missing ranges return null. */
export function sharedLabel(labels: (string | null | undefined)[]): string | null {
  if (!labels.length) return null;
  const first = labels[0];
  if (!first || !labels.every((label) => label === first)) return null;
  return first;
}
