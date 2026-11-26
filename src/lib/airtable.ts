import "server-only";
import { sampleRecords } from "./sample";
import { secret } from "./env";
import { tenant } from "./tenants";
import {
  calendarWindows,
  collectWindows,
  perMonth,
  readyWindows,
  routeTrendRow,
  type NinetyDayWindows,
  type WindowDraft,
} from "./windows";

// Tables and field IDs come from the selected tenant (see tenants.ts).

export type MonthPoint = {
  /** First day of the month, YYYY-MM-DD */
  month: string;
  /** Month before the client was onboarded */
  before: boolean;
  /** Current month, still in progress */
  partial: boolean;
  followers: number;
  views: number;
  interactions: number;
  profileVisits: number;
  newFollows: number;
  /** Optional columns (added later in Airtable, read by name). null = not recorded. */
  posts: number | null;
  topPostUrl: string | null;
  topPostViews: number | null;
  paidSpend: number | null;
};

// Optional "McGrath Monthly Trend" columns, matched by name (case/spacing-insensitive).
const OPTIONAL = {
  posts: ["posts published", "posts", "content published"],
  topPostUrl: ["top post url", "top post", "top video url"],
  topPostViews: ["top post views", "top video views"],
  paidSpend: ["paid spend", "ad spend", "boost spend", "paid & boost spend"],
} as const;

function pick(named: Record<string, unknown> | undefined, aliases: readonly string[]): unknown {
  if (!named) return undefined;
  for (const [k, v] of Object.entries(named)) {
    if (aliases.includes(k.toLowerCase().replace(/\s+/g, " ").trim())) return v;
  }
  return undefined;
}
const optNum = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : null);

export type Client = {
  /** URL-safe id from the client's name */
  id: string;
  name: string;
  subtitle: string | null;
  adAccountId: string | null;
  onboardDate: string | null;
  totalFollowers: number;
  startingFollowers: number;
  netGrowth: number;
  fbFollowers: number;
  igFollowers: number;
  profileVisits: number;
  views: number;
  interactions: number;
  /**
   * Average per month. Prefers the current 90-day total / 3 against the previous
   * 90-day total / 3. Without both of those rows, uses the first vs latest finished
   * calendar months, then Airtable's before/since-onboarding averages.
   */
  viewsBefore: number;
  viewsSince: number;
  interactionsBefore: number;
  interactionsSince: number;
  malePct: number;
  femalePct: number;
  keyWins: string | null;
  dataNotes: string | null;
  topContent: string[];
  /** Lead / ad sheet links for the "Lead Sheet" button */
  leadSheets: string[];
  /** Oldest → newest */
  months: MonthPoint[];
  /**
   * Labels for the headline comparison. `windows` is set when both 90-day rows
   * were present; otherwise the labels are calendar months (or null when there
   * isn't enough history and the dashboard averages are used with no dates).
   */
  compare: { earlyLabel: string; recentLabel: string; windows: NinetyDayWindows | null } | null;
  /** e.g. "Jul 2025" — where follower growth is counted from */
  startLabel: string;
};

const monthLabel = (iso: string, year = true) =>
  new Intl.DateTimeFormat("en-AU", { month: "short", ...(year ? { year: "numeric" } : {}) }).format(new Date(iso));

export type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, unknown>;
  /** Same row keyed by field name, for optional columns whose IDs we don't know. */
  named?: Record<string, unknown>;
};

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function clientIds(value: unknown): string[] {
  const links = (value as { id: string }[] | string[] | undefined) ?? [];
  return links.map((link) => (typeof link === "string" ? link : link.id)).filter((id): id is string => !!id);
}

export function toClients(dash: AirtableRecord[], trend: AirtableRecord[], today = new Date()): Client[] {
  const { dash: F, trend: T } = tenant();
  const thisMonth = today.toISOString().slice(0, 7);
  const monthsByClient = new Map<string, MonthPoint[]>();
  const windowDrafts: WindowDraft[] = [];
  for (const r of trend) {
    const f = r.fields;
    const label = str(f[T.label]) ?? str(r.named?.Label);
    const notes = str(f[T.notes]);
    const month = str(f[T.month]);
    const ids = clientIds(f[T.client]);
    const route = routeTrendRow(label, notes, month);
    // 90-day rows stay out of the bars even when Month is accidentally filled.
    if (route === "current" || route === "previous") {
      windowDrafts.push({
        clientIds: ids,
        label,
        notes,
        views: num(f[T.views]),
        interactions: num(f[T.interactions]),
        profileVisits: num(f[T.profileVisits]),
        newFollows: num(f[T.newFollows]),
        followers: num(f[T.followers]),
      });
      continue;
    }
    if (route !== "chart" || !month) continue;
    for (const id of ids) {
      const period = f[T.period] as { name?: string } | string | undefined;
      const periodName = typeof period === "string" ? period : period?.name ?? "";
      monthsByClient.set(id, [
        ...(monthsByClient.get(id) ?? []),
        {
          month: month.slice(0, 10),
          before: /before/i.test(periodName),
          partial: month.slice(0, 7) === thisMonth || /to date/i.test(notes ?? ""),
          followers: num(f[T.followers]),
          views: num(f[T.views]),
          interactions: num(f[T.interactions]),
          profileVisits: num(f[T.profileVisits]),
          newFollows: num(f[T.newFollows]),
          posts: optNum(pick(r.named, OPTIONAL.posts)),
          topPostUrl: str(pick(r.named, OPTIONAL.topPostUrl)),
          topPostViews: optNum(pick(r.named, OPTIONAL.topPostViews)),
          paidSpend: optNum(pick(r.named, OPTIONAL.paidSpend)),
        },
      ]);
    }
  }
  const windowsByClient = collectWindows(windowDrafts);

  return dash.flatMap((r) => {
    const f = r.fields;
    const fullName = str(f[F.name]);
    if (!fullName) return [];
    const [name, ...rest] = fullName.split(" - ");
    const starting = num(f[F.startingFollowers]);
    const net = num(f[F.netGrowth]);
    // A page starts in the first month it had followers; anything earlier is from before it existed.
    const sortedMonths = (monthsByClient.get(r.id) ?? []).sort((a, b) => a.month.localeCompare(b.month));
    const firstReal = sortedMonths.findIndex((m) => m.followers > 0);
    const months = firstReal > 0 ? sortedMonths.slice(firstReal) : sortedMonths;
    const windows = readyWindows(windowsByClient.get(r.id));
    // Calendar blocks are only the fallback. They are what used to put Oct–Dec 2025
    // next to the latest three finished months.
    const calendar = windows ? null : calendarWindows(months);
    const compare = windows
      ? { earlyLabel: windows.previous.label, recentLabel: windows.current.label, windows }
      : calendar
        ? { earlyLabel: calendar.earlyLabel, recentLabel: calendar.recentLabel, windows: null }
        : null;
    // A follower count of 0 means "not recorded" — count growth from the first real number.
    const first = months.find((m) => m.followers > 0);
    const last = [...months].reverse().find((m) => m.followers > 0);
    return [
      {
        id: slugify(fullName),
        name: name.trim(),
        // "Fiona … - McGrath Redcliffe" → "McGrath Redcliffe"; the office itself → null ("Agency account");
        // an agent without a suffix → the group's name (e.g. "Image Property").
        subtitle: rest.length
          ? rest.join(" - ").trim()
          : slugify(name).includes(slugify(tenant().name))
            ? null
            : tenant().name,
        adAccountId: F.adAccountId ? (str(f[F.adAccountId])?.replace(/^act_/, "") ?? null) : null,
        onboardDate: str(f[F.onboardDate]),
        totalFollowers: num(f[F.totalFollowers]) || starting + net,
        startingFollowers: starting,
        netGrowth: first && last ? last.followers - first.followers : net,
        startLabel: first ? monthLabel(first.month) : "onboarding",
        compare,
        fbFollowers: num(f[F.fbFollowers]),
        igFollowers: num(f[F.igFollowers]),
        profileVisits: num(f[F.profileVisits]),
        views: num(f[F.views]),
        interactions: num(f[F.interactions]),
        viewsBefore: windows ? perMonth(windows.previous.views) : calendar ? calendar.viewsBefore : num(f[F.viewsBefore]),
        viewsSince: windows ? perMonth(windows.current.views) : calendar ? calendar.viewsSince : num(f[F.viewsSince]),
        interactionsBefore: windows ? perMonth(windows.previous.interactions) : calendar ? calendar.interactionsBefore : num(f[F.interactionsBefore]),
        interactionsSince: windows ? perMonth(windows.current.interactions) : calendar ? calendar.interactionsSince : num(f[F.interactionsSince]),
        malePct: num(f[F.male]),
        femalePct: num(f[F.female]),
        keyWins: F.keyWins ? str(f[F.keyWins]) : null,
        dataNotes: str(f[F.dataNotes]),
        topContent: F.best.map((id) => str(f[id])).filter((u): u is string => !!u),
        leadSheets: [
          ...(F.leadSheets ? (str(f[F.leadSheets]) ?? "").match(/https?:\/\/[^\s,]+/g) ?? [] : []),
          ...(tenant().leadSheets[slugify(fullName)] ? [tenant().leadSheets[slugify(fullName)]] : []),
        ],
        months,
      },
    ];
  });
}

async function fetchTable(token: string, table: string, byName = false): Promise<AirtableRecord[]> {
  const base = process.env.AIRTABLE_BASE_ID || "appRabuCzjpb6urjA";
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${table}`);
    if (!byName) url.searchParams.set("returnFieldsByFieldId", "true");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60, tags: ["dashboard"] },
    });
    if (res.status === 401) {
      // Describe the token's shape (never its value) to help spot a bad paste.
      const shape = token.startsWith("pat") && token.includes(".")
        ? "it looks like a personal access token, so it may have been revoked or regenerated"
        : `it doesn't look like a personal access token (those start with "pat" and contain a "."; this one is ${token.length} characters)`;
      throw new Error(`Airtable rejected AIRTABLE_TOKEN: ${shape}.`);
    }
    if (res.status === 403 || res.status === 404) {
      throw new Error("AIRTABLE_TOKEN works but can't read the Reports base. Give the token data.records:read access to the Reports base.");
    }
    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);
    const json = (await res.json()) as { records: AirtableRecord[]; offset?: string };
    records.push(...json.records);
    offset = json.offset;
  } while (offset);
  return records;
}

export async function getClients(): Promise<{ clients: Client[]; sample: boolean }> {
  const token = secret("AIRTABLE_TOKEN");
  if (!token) {
    if (process.env.NODE_ENV !== "production" && tenant().key === "mcgrath") {
      const { dash, trend } = sampleRecords();
      return { clients: toClients(dash, trend), sample: true };
    }
    throw new Error("AIRTABLE_TOKEN is not set");
  }
  const [dash, trend, trendNamed] = await Promise.all([
    fetchTable(token, tenant().dashTable),
    fetchTable(token, tenant().trendTable).catch(() => [] as AirtableRecord[]),
    fetchTable(token, tenant().trendTable, true).catch(() => [] as AirtableRecord[]),
  ]);
  const named = new Map(trendNamed.map((r) => [r.id, r.fields]));
  for (const r of trend) r.named = named.get(r.id);
  const clients = toClients(dash, trend).sort((a, b) => b.totalFollowers - a.totalFollowers);
  return { clients, sample: false };
}
