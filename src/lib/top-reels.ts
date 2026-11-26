import "server-only";
import { secret } from "./env";
import { brisbaneDate, rankReels, type ReelCandidate } from "./rank-reels";

const GRAPH = "https://graph.facebook.com";

export type ReelAccount = { igUserId: string; username: string; pageId: string };

export type RankedReel = ReelCandidate & { viewsSource: "instagram insights views" };

export type TopReelsResult =
  | { ok: true; reels: RankedReel[] }
  | { ok: false; reason: "unavailable" | "wrong-account" };

type Media = {
  timestamp?: string;
  permalink?: string;
  media_type?: string;
  media_product_type?: string;
  insights?: { data?: { name?: string; value?: number; values?: { value?: number }[] }[] };
};

function viewsOf(media: Media): number | null {
  const rows = media.insights?.data ?? [];
  const row = rows.find((item) => item.name === "views") ?? (rows.length === 1 ? rows[0] : undefined);
  const value = row?.values?.[0]?.value ?? row?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isReel(media: Media): boolean {
  if (media.media_product_type === "REELS") return true;
  return /instagram\.com\/reels?\//i.test(media.permalink ?? "");
}

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = secret("META_ACCESS_TOKEN");
  if (!token) throw new Error("META_ACCESS_TOKEN is not set");
  const url = new URL(`${GRAPH}/${process.env.META_API_VERSION || "v23.0"}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300, tags: ["dashboard"] },
  });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json?.error?.message ?? `Meta API error ${res.status}`);
  return json as T;
}

async function paged<T>(path: string, params: Record<string, string>, max = 10): Promise<T[]> {
  const out: T[] = [];
  let after: string | undefined;
  for (let page = 0; page < max; page++) {
    const res = await graph<{ data: T[]; paging?: { next?: string; cursors?: { after?: string } } }>(
      path,
      after ? { ...params, after } : params,
    );
    out.push(...(res.data ?? []));
    const next = res.paging?.cursors?.after;
    if (!res.paging?.next || !next) break;
    after = next;
  }
  return out;
}

/**
 * Rank this account's own Instagram reels. Refuses to continue if the id is not
 * the configured username, so another client's account cannot fill the section.
 */
export async function getTopReels(account: ReelAccount, window: { since: string; until: string }): Promise<TopReelsResult> {
  try {
    const profile = await graph<{ id: string; username?: string }>(account.igUserId, { fields: "id,username" });
    const username = profile.username?.replace(/^@/, "").toLowerCase();
    if (profile.id !== account.igUserId || username !== account.username.toLowerCase()) {
      return { ok: false, reason: "wrong-account" };
    }
    const sinceUnix = String(Math.floor(new Date(`${window.since}T00:00:00+10:00`).getTime() / 1000));
    const media = await paged<Media>(`${account.igUserId}/media`, {
      fields: "timestamp,permalink,media_type,media_product_type,insights.metric(views)",
      since: sinceUnix,
      limit: "50",
    });
    const reels: ReelCandidate[] = [];
    for (const item of media) {
      if (!isReel(item) || !item.permalink || !item.timestamp) continue;
      const views = viewsOf(item);
      if (views == null) continue;
      reels.push({ permalink: item.permalink, postedOn: brisbaneDate(item.timestamp), views });
    }
    return {
      ok: true,
      reels: rankReels(reels, window).map((reel) => ({ ...reel, viewsSource: "instagram insights views" as const })),
    };
  } catch (error) {
    console.error("Top reels lookup failed", error instanceof Error ? error.message : error);
    return { ok: false, reason: "unavailable" };
  }
}
