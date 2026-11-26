/** Inclusive calendar date in Australia/Brisbane. */
export function brisbaneDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Brisbane",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function addIsoDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export type ReelCandidate = {
  permalink: string;
  /** YYYY-MM-DD in Australia/Brisbane. */
  postedOn: string;
  /** Instagram total views (organic + paid), the number shown on the reel. */
  views: number;
};

/**
 * Top reels inside an inclusive date window.
 * A reel has to be at least `minAgeDays` old on the window's last day, unless its
 * views already beat the weakest of the established top reels.
 */
export function rankReels(reels: ReelCandidate[], opts: { since: string; until: string; minAgeDays?: number }): ReelCandidate[] {
  const minAgeDays = opts.minAgeDays ?? 14;
  const inWindow = reels.filter((reel) => reel.permalink && reel.postedOn >= opts.since && reel.postedOn <= opts.until && reel.views > 0);
  const cutoff = addIsoDays(opts.until, -minAgeDays);
  const byViews = (a: ReelCandidate, b: ReelCandidate) => b.views - a.views || b.postedOn.localeCompare(a.postedOn);
  const mature = inWindow.filter((reel) => reel.postedOn <= cutoff).sort(byViews);
  const leaders = mature.slice(0, 3);
  const bar = leaders.length ? Math.min(...leaders.map((reel) => reel.views)) : null;
  const young = bar == null ? [] : inWindow.filter((reel) => reel.postedOn > cutoff && reel.views > bar);
  return [...mature, ...young].sort(byViews).slice(0, 3);
}
