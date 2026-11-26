import "server-only";
import { secret } from "./env";

// Per-month drivers behind a client's views, straight from Meta via the
// system-user token: Facebook views split into paid (ads) vs organic, how many
// posts went out, which posts were promoted, and the top Instagram post.

const GRAPH = "https://graph.facebook.com";
const CACHE = { next: { revalidate: 21600, tags: ["dashboard"] } }; // 6h

export type MonthDrivers = {
  /** YYYY-MM */
  month: string;
  fbAdViews: number;
  fbOrganicViews: number;
  igViews: number;
  posts: number;
  promoted: { title: string; url: string }[];
  topPost: { title: string; url: string; views: number } | null;
};

type Page = { id: string; name: string; instagram_business_account?: { id: string; username: string } };

async function graph<T>(path: string, params: Record<string, string>, token?: string): Promise<T> {
  const url = new URL(`${GRAPH}/${process.env.META_API_VERSION || "v23.0"}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const auth = token ?? secret("META_ACCESS_TOKEN");
  const res = await fetch(url, { headers: { Authorization: `Bearer ${auth}` }, ...CACHE });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json?.error?.message ?? `Meta API error ${res.status}`);
  return json as T;
}

async function paged<T>(path: string, params: Record<string, string>, token?: string, max = 6): Promise<T[]> {
  const out: T[] = [];
  let after: string | undefined;
  for (let i = 0; i < max; i++) {
    const r = await graph<{ data: T[]; paging?: { next?: string; cursors?: { after?: string } } }>(
      path,
      after ? { ...params, after } : params,
      token,
    );
    out.push(...r.data);
    after = r.paging?.cursors?.after;
    if (!r.paging?.next || !after) break;
  }
  return out;
}

const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);

/**
 * The Facebook Page (and linked Instagram) for a client: every word of the
 * client's name must appear as a word in the Page name (or, for longer words,
 * inside the Instagram username). The tightest match wins, so "Image Property
 * Gold Coast" picks that Page over "Cameron Cullen - Image Property Gold Coast".
 */
async function findPage(clientName: string): Promise<Page | null> {
  const pages = await paged<Page>("me/accounts", { fields: "id,name,instagram_business_account{id,username}", limit: "100" }, undefined, 10);
  const want = words(clientName).filter((w) => w !== "and");
  const matches = pages.filter((p) => {
    const pageWords = new Set(words(p.name));
    const user = p.instagram_business_account?.username?.toLowerCase() ?? "";
    return want.every((w) => pageWords.has(w) || (w.length > 3 && user.includes(w)));
  });
  matches.sort((a, b) => words(a.name).length - words(b.name).length);
  return matches[0] ?? null;
}

const title = (s: string | undefined) =>
  (s ?? "")
    .split("\n")[0]
    .replace(/[\u2600-\u27BF\uFE0F]|[\uD83C-\uDBFF][\uDC00-\uDFFF]/g, "") // emoji
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70) || "Untitled post";

export async function getDrivers(clientName: string, months: string[]): Promise<MonthDrivers[] | null> {
  if (!secret("META_ACCESS_TOKEN") || !months.length) return null;
  try {
    const page = await findPage(clientName);
    if (!page) return null;
    const { access_token: pageToken } = await graph<{ access_token: string }>(page.id, { fields: "access_token" });
    const first = `${months[0]}-01`;
    const today = new Date().toISOString().slice(0, 10);

    const [splits, fbPosts, promoted, igMedia] = await Promise.all([
      Promise.all(
        months.map(async (m) => {
          const [y, mo] = m.split("-").map(Number);
          const next = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 10);
          const r = await graph<{ data: { values: { value: number; is_from_ads?: string }[] }[] }>(
            `${page.id}/insights`,
            { metric: "page_media_view", period: "day", since: `${m}-01`, until: next < today ? next : today, breakdown: "is_from_ads" },
            pageToken,
          ).catch(() => ({ data: [] }));
          let ads = 0;
          let organic = 0;
          for (const v of r.data[0]?.values ?? []) {
            if (v.is_from_ads === "1") ads += v.value;
            else organic += v.value;
          }
          return { ads, organic };
        }),
      ),
      paged<{ created_time: string }>(`${page.id}/posts`, { fields: "created_time", since: first, limit: "100" }, pageToken).catch(() => []),
      paged<{ created_time: string; message?: string; permalink_url: string }>(
        `${page.id}/ads_posts`,
        { fields: "created_time,message,permalink_url", since: first, limit: "100", include_inline_create: "true" },
        pageToken,
      ).catch(() => []),
      page.instagram_business_account
        ? paged<{ timestamp: string; permalink: string; caption?: string; insights?: { data: { name: string; values: { value: number }[] }[] } }>(
            `${page.instagram_business_account.id}/media`,
            { fields: "timestamp,permalink,caption,insights.metric(views)", since: first, limit: "100" },
          ).catch(() => [])
        : Promise.resolve([]),
    ]);

    return months.map((m, i) => {
      const ig = igMedia
        .filter((x) => x.timestamp.startsWith(m))
        .map((x) => ({ url: x.permalink, title: title(x.caption), views: x.insights?.data[0]?.values[0]?.value ?? 0 }));
      const top = ig.reduce<(typeof ig)[number] | null>((a, b) => (!a || b.views > a.views ? b : a), null);
      const promotedHere = promoted.filter((p) => p.created_time.startsWith(m));
      const seen = new Set<string>();
      return {
        month: m,
        fbAdViews: splits[i].ads,
        fbOrganicViews: splits[i].organic,
        igViews: ig.reduce((t, x) => t + x.views, 0),
        posts: fbPosts.filter((p) => p.created_time.startsWith(m)).length + ig.length,
        promoted: promotedHere
          .map((p) => ({ title: title(p.message), url: p.permalink_url }))
          .filter((p) => (seen.has(p.title) ? false : (seen.add(p.title), true))),
        topPost: top && top.views > 0 ? top : null,
      };
    });
  } catch {
    return null;
  }
}
