import "server-only";
import { secret } from "./env";

// Per-property VPA (vendor paid advertising) campaigns from Airtable "Table 1".
const TABLE = "tblj8P67B7x6ROWj2";
const F = {
  address: "fldJILMF6qqU2lwnh",
  client: "fldnQp5OnyRYPeXG7",
  start: "fldudVPYzvSYK5MyO",
  end: "fldjutPYJQQmcHts2",
  spend: "fldv8psZWTbYg9Khv",
  results: "fldGqAxphFCCgvdDi",
  costPerResult: "fld87iVoIXK0IJC3f",
  impressions: "fldpZQJCr6P4O0QFY",
  reach: "fldBURllD09FK3Zut",
  analysis: "flduDper5ivp3d4o4",
  landingPageViews: "fldbcw4H0X1BNaYOo",
  boostedLink: "fldaZV4cCRZWQa6xN",
  boostedViews: "fldnBU6oRBrMhpOao",
  slug: "fldz5WTpQF8gkviqh",
} as const;

// Each campaign's report card lives at REPORT_URL + the row's Slug (same links Account Central uses).
const REPORT_URL = "https://property-report-cards.lovable.app/properties/";

export type VpaCampaign = {
  id: string;
  address: string;
  start: string | null;
  end: string | null;
  running: boolean;
  spend: number;
  results: number;
  costPerResult: number | null;
  impressions: number;
  reach: number;
  landingPageViews: number;
  boostedLink: string | null;
  boostedViews: number;
  analysis: string | null;
  /** Link to the campaign's report card, from the row's Slug */
  reportUrl: string | null;
  createdTime: string;
};

type Rec = { id: string; createdTime: string; fields: Record<string, unknown> };

const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : 0);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

async function allRows(): Promise<Rec[]> {
  const token = secret("AIRTABLE_TOKEN");
  if (!token) return [];
  const base = process.env.AIRTABLE_BASE_ID || "appRabuCzjpb6urjA";
  const rows: Rec[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${TABLE}`);
    url.searchParams.set("returnFieldsByFieldId", "true");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300, tags: ["dashboard"] } });
    if (!res.ok) throw new Error(`Airtable error ${res.status}`);
    const json = (await res.json()) as { records: Rec[]; offset?: string };
    rows.push(...json.records);
    offset = json.offset;
  } while (offset);
  return rows;
}

/** VPA rows whose Client exactly matches one of the given names (case/space-insensitive). */
export async function getVpaCampaigns(names: string[]): Promise<VpaCampaign[]> {
  const match = new Set(names.map(norm));
  const rows = await allRows().catch(() => []);
  return rows
    .filter((r) => {
      const client = str(r.fields[F.client]);
      return client && match.has(norm(client)) && str(r.fields[F.address]);
    })
    .map((r) => {
      const f = r.fields;
      const end = str(f[F.end]);
      return {
        id: r.id,
        address: str(f[F.address])!,
        start: str(f[F.start]),
        end,
        running: !!end && /still running|ongoing|live/i.test(end),
        spend: num(f[F.spend]),
        results: num(f[F.results]),
        costPerResult: num(f[F.costPerResult]) || null,
        impressions: num(f[F.impressions]),
        reach: num(f[F.reach]),
        landingPageViews: num(f[F.landingPageViews]),
        boostedLink: str(f[F.boostedLink]),
        boostedViews: num(f[F.boostedViews]),
        analysis: str(f[F.analysis]),
        reportUrl: str(f[F.slug]) ? REPORT_URL + encodeURIComponent(str(f[F.slug])!) : null,
        createdTime: r.createdTime,
      };
    })
    .sort((a, b) => Number(b.running) - Number(a.running) || b.createdTime.localeCompare(a.createdTime));
}
