import "server-only";
import { CATEGORIES, categorize, type AdAccountRules, type Category } from "./ad-category";
import { secret } from "./env";

const GRAPH = "https://graph.facebook.com";

type Action = { action_type: string; value: string };

type RawInsights = {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  inline_link_clicks?: string;
  ctr?: string;
  cpm?: string;
  frequency?: string;
  actions?: Action[];
};

type RawCampaign = {
  id: string;
  name: string;
  objective?: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  insights?: { data: RawInsights[] };
};

export { CATEGORIES, categorize, type AdAccountRules, type Category };

export type Campaign = {
  id: string;
  name: string;
  objective: string;
  category: Category;
  status: string;
  /** Switched on, not past its end date, and delivered in the last 3 days (or just launched). */
  active: boolean;
  /** Budget in account currency (daily or lifetime), null if set at ad set level */
  budget: { amount: number; type: "daily" | "lifetime" } | null;
  startTime: string | null;
  stopTime: string | null;
  spend: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  ctr: number;
  results: number;
  resultLabel: string;
  costPerResult: number | null;
};

export type AdAccountData = {
  accountName: string;
  currency: string;
  spend: number;
  impressions: number;
  reach: number;
  linkClicks: number;
  ctr: number;
  cpm: number;
  leads: number;
  campaigns: Campaign[];
  activeCampaigns: number;
  byCategory: Record<Category, { active: number; total: number; spend: number }>;
};

export type AdsResult =
  | { status: "ok"; data: AdAccountData }
  | { status: "none" }
  | { status: "error"; message: string };

const INSIGHT_FIELDS = "spend,impressions,reach,clicks,inline_link_clicks,ctr,cpm,frequency,actions";

const n = (v: string | undefined) => (v ? Number(v) || 0 : 0);

/** Drop Meta's auto prefix on boosted posts: 'Instagram post: "Like no other…"' → 'Like no other…'. */
export function displayName(name: string): string {
  const stripped = name.replace(/^(instagram |facebook )?(post|reel|video)\s*:\s*/i, "").trim();
  return stripped.replace(/^["“'‘]([\s\S]*)["”'’]$/, "$1").trim() || name;
}

function action(actions: Action[] | undefined, ...types: string[]) {
  if (!actions) return 0;
  for (const t of types) {
    const a = actions.find((x) => x.action_type === t);
    if (a) return Number(a.value) || 0;
  }
  return 0;
}

const LEAD_TYPES = ["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"];

// Meta reports "results" based on each ad set's optimisation goal. We infer it
// from the campaign objective, which matches how these campaigns are set up.
function resultFor(objective: string, i: RawInsights): { value: number; label: string } {
  switch (objective) {
    case "OUTCOME_LEADS":
    case "LEAD_GENERATION":
      return { value: action(i.actions, ...LEAD_TYPES), label: "Leads" };
    case "OUTCOME_SALES":
    case "CONVERSIONS":
      return { value: action(i.actions, ...LEAD_TYPES, "offsite_conversion.fb_pixel_purchase", "purchase"), label: "Conversions" };
    case "OUTCOME_TRAFFIC":
    case "LINK_CLICKS": {
      const lpv = action(i.actions, "landing_page_view");
      return lpv
        ? { value: lpv, label: "Landing page views" }
        : { value: n(i.inline_link_clicks), label: "Link clicks" };
    }
    case "OUTCOME_AWARENESS":
    case "REACH":
    case "BRAND_AWARENESS":
      return { value: n(i.reach), label: "Reach" };
    case "VIDEO_VIEWS":
      return { value: action(i.actions, "video_view"), label: "Video views" };
    case "OUTCOME_ENGAGEMENT":
    case "POST_ENGAGEMENT":
    case "PAGE_LIKES":
      return { value: action(i.actions, "post_engagement", "page_engagement"), label: "Engagements" };
    default:
      return { value: n(i.inline_link_clicks), label: "Link clicks" };
  }
}

async function graph<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = secret("META_ACCESS_TOKEN")!;
  const version = process.env.META_API_VERSION || "v23.0";
  const url = new URL(`${GRAPH}/${version}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300, tags: ["dashboard"] },
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json?.error?.message ?? `Meta API error ${res.status}`);
  }
  return json as T;
}

const CAMPAIGN_FIELDS = `id,name,objective,effective_status,daily_budget,lifetime_budget,start_time,stop_time,insights.date_preset(maximum){${INSIGHT_FIELDS}}`;

async function pagedCampaigns(act: string): Promise<RawCampaign[]> {
  const out: RawCampaign[] = [];
  let after: string | undefined;
  for (let page = 0; page < 25; page++) {
    const res = await graph<{ data: RawCampaign[]; paging?: { next?: string; cursors?: { after?: string } } }>(
      `${act}/campaigns`,
      { fields: CAMPAIGN_FIELDS, limit: "100", ...(after ? { after } : {}) },
    );
    out.push(...(res.data ?? []));
    const next = res.paging?.cursors?.after;
    if (!res.paging?.next || !next) break;
    after = next;
  }
  return out;
}

/** Ids are kept as strings. Meta campaign ids are larger than Number.MAX_SAFE_INTEGER. */
async function fetchCampaign(id: string): Promise<RawCampaign | null> {
  try {
    const campaign = await graph<RawCampaign>(id, { fields: CAMPAIGN_FIELDS });
    return campaign?.id ? campaign : null;
  } catch {
    return null;
  }
}

export async function getAdAccount(adAccountId: string | null, rules?: AdAccountRules): Promise<AdsResult> {
  if (!adAccountId) return { status: "none" };
  if (!secret("META_ACCESS_TOKEN")) return { status: "error", message: "META_ACCESS_TOKEN is not set" };
  const act = `act_${adAccountId}`;

  try {
    const [account, insights, campaignsRes, recent] = await Promise.all([
      graph<{ name: string; currency: string }>(act, { fields: "name,currency" }),
      graph<{ data: RawInsights[] }>(`${act}/insights`, { date_preset: "maximum", fields: INSIGHT_FIELDS }),
      pagedCampaigns(act),
      graph<{ data: { campaign_id: string; impressions?: string }[] }>(`${act}/insights`, {
        level: "campaign",
        date_preset: "last_3d",
        fields: "campaign_id,impressions",
        limit: "500",
      }),
    ]);
    const deliveredRecently = new Set(recent.data.filter((r) => n(r.impressions) > 0).map((r) => r.campaign_id));
    const now = Date.now();
    const listed = [...campaignsRes];
    const seen = new Set(listed.map((c) => c.id));
    for (const id of rules?.cmaCampaignIds ?? []) {
      if (seen.has(id)) continue;
      const extra = await fetchCampaign(id);
      if (!extra || seen.has(extra.id)) continue;
      seen.add(extra.id);
      listed.push(extra);
    }

    const totals = insights.data[0] ?? {};
    const campaigns: Campaign[] = listed
      .map((c) => {
        const i = c.insights?.data[0] ?? {};
        const objective = c.objective ?? "UNKNOWN";
        const result = resultFor(objective, i);
        const spend = n(i.spend);
        const daily = n(c.daily_budget);
        const lifetime = n(c.lifetime_budget);
        const ended = !!c.stop_time && new Date(c.stop_time).getTime() < now;
        const justLaunched = !!c.start_time && now - new Date(c.start_time).getTime() < 2 * 864e5;
        const on = c.effective_status === "ACTIVE" && !ended;
        const active = on && (deliveredRecently.has(c.id) || justLaunched);
        const status = ended ? "COMPLETED" : on && !active ? "NOT_DELIVERING" : (c.effective_status ?? "UNKNOWN");
        return {
          id: c.id,
          name: c.name,
          objective,
          category: categorize(c.name, { id: c.id, rules }),
          status,
          active,
          // Budgets come back in the currency's minor unit (cents).
          budget: daily
            ? { amount: daily / 100, type: "daily" as const }
            : lifetime
              ? { amount: lifetime / 100, type: "lifetime" as const }
              : null,
          startTime: c.start_time ?? null,
          stopTime: c.stop_time ?? null,
          spend,
          impressions: n(i.impressions),
          reach: n(i.reach),
          linkClicks: n(i.inline_link_clicks),
          ctr: n(i.ctr),
          results: result.value,
          resultLabel: result.label,
          costPerResult: result.value ? spend / result.value : null,
        };
      })
      .sort((a, b) => Number(b.active) - Number(a.active) || b.spend - a.spend);

    const byCategory = Object.fromEntries(
      CATEGORIES.map((cat) => {
        const list = campaigns.filter((c) => c.category === cat);
        return [cat, { active: list.filter((c) => c.active).length, total: list.length, spend: list.reduce((t, c) => t + c.spend, 0) }];
      }),
    ) as AdAccountData["byCategory"];

    return {
      status: "ok",
      data: {
        byCategory,
        accountName: account.name,
        currency: account.currency,
        spend: n(totals.spend),
        impressions: n(totals.impressions),
        reach: n(totals.reach),
        linkClicks: n(totals.inline_link_clicks),
        ctr: n(totals.ctr),
        cpm: n(totals.cpm),
        leads: action(totals.actions, ...LEAD_TYPES),
        campaigns,
        activeCampaigns: campaigns.filter((c) => c.active).length,
      },
    };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Could not load ad account" };
  }
}
