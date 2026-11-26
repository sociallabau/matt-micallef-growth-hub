// One codebase, one dashboard per client group. Pick which one a deployment
// shows with the DASHBOARD_CLIENT env var ("matt-micallef" by default).
// Field IDs (not names) so renaming a column in Airtable doesn't break anything.

import type { AdAccountRules } from "./ad-category";

export type DashFields = {
  name: string;
  adAccountId?: string;
  profileVisits: string;
  startingFollowers: string;
  netGrowth: string;
  totalFollowers: string;
  male: string;
  female: string;
  keyWins?: string;
  best: [string, string, string];
  onboardDate: string;
  fbFollowers: string;
  igFollowers: string;
  views: string;
  interactions: string;
  viewsBefore: string;
  viewsSince: string;
  interactionsBefore: string;
  interactionsSince: string;
  dataNotes: string;
  /** Text field holding one or more sheet links (comma / newline separated) */
  leadSheets?: string;
};

export type TrendFields = {
  /** Primary field. 90-day rows are named "<Client> – Current|Previous 90 days (range)". */
  label: string;
  client: string;
  month: string;
  period: string;
  followers: string;
  views: string;
  interactions: string;
  profileVisits: string;
  newFollows: string;
  notes: string;
};

export type Tenant = {
  key: string;
  /** Shown above "Growth Hub" in the header and on the sign-in page */
  name: string;
  dashTable: string;
  trendTable: string;
  dash: DashFields;
  trend: TrendFields;
  /** Client id (slug of the Airtable name) → their lead sheet */
  leadSheets: Record<string, string>;
  /** Glow / snow accent as "r, g, b" — mixed with white. Defaults to white. */
  accent?: string;
  /** Optional background tint as "r, g, b" */
  tint?: string;
  /** Optional page / panel / border colours (hex) to theme the whole dashboard */
  theme?: { bg: string; surface: string; line: string; soft: string };
  /** Core suburbs for the map strip at the top of the overview */
  offices?: { name: string; lat: number; lng: number }[];
  /** Region line under "Core Suburbs" */
  region?: string;
  /** "soft" (default) = wide glow; "outline" = crisp accent edge with only a faint glow */
  glow?: "soft" | "outline";
  /**
   * Ad-account id (no act_ prefix) → how that account's campaigns are grouped.
   * Accounts omitted here keep the shared name rules.
   */
  adRules?: Record<string, AdAccountRules>;
  /**
   * When set, "Top performing content" is ranked from this Instagram account
   * for the current 90-day window. Other hubs keep the Airtable best-performing links.
   */
  reels?: { igUserId: string; username: string; pageId: string };
};

const TENANTS: Record<string, Tenant> = {
  mcgrath: {
    key: "mcgrath",
    name: "McGrath Redcliffe",
    dashTable: "tbl8PjNLUXx0LHTks",
    trendTable: "tblHdcbHP6jrg149p",
    dash: {
      name: "fldkWW68ifIOCb22k",
      adAccountId: "fldSsMzLaMgaKcO7t",
      profileVisits: "fldhPU3g1SQ6FERFZ",
      startingFollowers: "fldmHx8ntutWqYpUr",
      netGrowth: "flddQMdBfJ0zS4vr9",
      totalFollowers: "fldNky6vQCcBuzalq",
      male: "fldQJxttMxlA1HCV8",
      female: "fldVi1ZIJdJeCfEdB",
      keyWins: "fldYcglmmAA0bsTm6",
      best: ["fldWJTr57LdqHGhfD", "fldiaiDceN1htglXK", "fldadAFUDA8FynAKg"],
      onboardDate: "fldCk6CtikWJwFvQT",
      fbFollowers: "fldcb1q7aBIBagTgf",
      igFollowers: "fldn0wfupXO2ybtV2",
      views: "flds1x83lmdgmHPOP",
      interactions: "fldmotxsJu8ovNPTj",
      viewsBefore: "fldwODlc8hLkQ0dpz",
      viewsSince: "fldfz72jBX7yjtynK",
      interactionsBefore: "fldftiLbqt8yASR6j",
      interactionsSince: "fldaRgcAcTwlYp4Rg",
      dataNotes: "fldOvlrwW12gNEdra",
    },
    trend: {
      label: "fld4dlrnXt6aMhJ5l",
      client: "fldMyuPbYBrBf8oQS",
      month: "fldEjSVSfIFs2ofhk",
      period: "fldcMv7W3SEaH92fB",
      followers: "fldxgOfT3IS1p1xMr",
      views: "fldN4VynJsvJnJGnw",
      interactions: "fldN2Z3jPnJMHms9A",
      profileVisits: "fldhiC6TSLyfXm7Bn",
      newFollows: "fldTTUf1WSutKgtTf",
      notes: "fld1S6EU8itwF4NAd",
    },
    leadSheets: {
      "mcgrath-redcliffe": "https://docs.google.com/spreadsheets/d/1hBk7YpSu41AvBnLWNMHFCpvCn0z4LmlBxXi7tCkP5fk/edit?usp=sharing",
    },
    // McGrath plum #4A212E: the page and panels are built from it; orbs/glows use a
    // brighter step of the same plum so they still show on a dark background.
    // McGrath plum #4A212E for the page and panels; orbs use a brighter step of it so they show.
    accent: "168, 78, 108",
    tint: "74, 33, 46",
    theme: { bg: "#160a0e", surface: "#24111a", line: "#4a212e", soft: "#2e1620" },
    glow: "outline",
    region: "SEQ · Moreton Bay",
    offices: [
      { name: "Redcliffe", lat: -27.229, lng: 153.11 },
      { name: "Woody Point", lat: -27.258, lng: 153.103 },
      { name: "Kippa-Ring", lat: -27.226, lng: 153.085 },
    ],
  },

  "image-property": {
    key: "image-property",
    name: "Image Property",
    dashTable: "tbl7UdRe8KlfyZ0m6",
    trendTable: "tblI7USUvmwTM8HSU",
    dash: {
      name: "fldj1QaBw2w3pt94Y",
      adAccountId: "fldm1ZwH4xXSfTDvG",
      profileVisits: "fldgUO7JfFElsWYHD",
      startingFollowers: "fldlMrcQHhhbdgwW5",
      netGrowth: "fldcVGh4twOOFmCtN",
      totalFollowers: "fldMpsaY4p0QhRhn4",
      male: "fldPOrxW0k9POZJXM",
      female: "fldUnV3bX0xtpxLff",
      best: ["fldVONvyly1FuYohh", "fldhfcHFsAPwgysZo", "fld9iuJnRnWUlFHMU"],
      onboardDate: "fldjPOlenRzLSokQV",
      fbFollowers: "fldcWh7lqub36a8q9",
      igFollowers: "fldUFhs1wvACBp6Mo",
      views: "fldr6rcwz91v9ZWQt",
      interactions: "fldltnBVXhWDi5WVX",
      viewsBefore: "fldpuypfke9LTyJOy",
      viewsSince: "fldHWTDNpRfYJKHcP",
      interactionsBefore: "fldhq3kfmNhXFZFgf",
      interactionsSince: "fldfKQumXoitJrLvv",
      dataNotes: "fld1K0zjBm17had4M",
      leadSheets: "fldrb98d1kt6DEhDd",
    },
    trend: {
      label: "flduO6nfyVnXlEVQL",
      client: "fldFlK9Q44zQLCXUq",
      month: "fld2WOxAHcmxKU4WX",
      period: "fld73oswoz5gP1lAV",
      followers: "fldBoE8Jei09h6Ahk",
      views: "fldAbYUV1zO3bsJJl",
      interactions: "fldwCNCozvOUdAoS8",
      profileVisits: "fld3xS6OWwqLbc5GA",
      newFollows: "fldjSa2r4tJ5iVsuG",
      notes: "fldLcUr5mS5unEyWq",
    },
    leadSheets: {},
    accent: "241, 90, 34", // #F15A22 Image Property orange
    region: "SEQ · Northern NSW",
    offices: [
      { name: "Redcliffe", lat: -27.229, lng: 153.11 },
      { name: "Palm Beach", lat: -28.115, lng: 153.466 },
      { name: "Tweed Heads", lat: -28.176, lng: 153.541 },
      { name: "Banora Point", lat: -28.213, lng: 153.531 },
      { name: "Cabarita", lat: -28.333, lng: 153.567 },
    ],
  },

  sproule: {
    key: "sproule",
    name: "Sproule Property Group",
    dashTable: "tblLFJoG19Ijlmvzr", // Sproule Dashboard
    trendTable: "tblyYZzF7gadGXHs9", // Sproule Monthly Trend
    dash: {
      name: "fld4ySkyqGFEBF6qu",
      adAccountId: "fldYH74rR2sfwJsFx",
      profileVisits: "fldcgjM82jWfybvMB",
      startingFollowers: "fldHRKO6VWSice5jA",
      netGrowth: "fldZMfkibQvILzLQP",
      totalFollowers: "fldK2r0hMf7MLkisn",
      male: "fldwqk9DdmG1fTtKb",
      female: "fld1v3tRchsTWgQff",
      keyWins: "fldexlxz9aUIH6u51",
      best: ["fldpj5aCZRFmWFGqM", "fldF7I4AjKV5hmjFI", "fldm0k8gZbv53R2sH"],
      onboardDate: "fldQ3UGaI5zjgg4Yb",
      fbFollowers: "fldIM9ROqbqlqDLpZ",
      igFollowers: "fld2AsPZElpcwDSKs",
      views: "fldt1x7YKaPrFAt25",
      interactions: "fldcH20jvMusEPmcb",
      viewsBefore: "fldn5cszRIe0NNbpl",
      viewsSince: "fldxWgBvP2g8eYfzI",
      interactionsBefore: "fldcjlnRpLX9sTTZB",
      interactionsSince: "fldw7NuourL6CYOhx",
      dataNotes: "fldABTmAEPHuOVSfD",
      leadSheets: "fldC8o77hSOLWmbny",
    },
    trend: {
      label: "fldQ3oAq8gLyzusrj",
      client: "fldEuS3OsUY6Woq70",
      month: "fldyMltRwq41o0VF7",
      period: "fld5irAP15G1YSvBE",
      followers: "fldWEIEsZwvEP2Ppd",
      views: "fld30X49dkVRiAINc",
      interactions: "fldkyaf21XNXVlcir",
      profileVisits: "fld39qLJQbW7qOeLQ",
      newFollows: "fld3oBN319MhLi93q",
      notes: "flduXHfR09Xmos3f7",
    },
    leadSheets: {},
    // Sproule's CMA group is the $15/day lead campaign plus "Sold - …" / "Just Sold - …".
    // Other hubs are not listed here, so their Sold campaigns stay under VPA.
    adRules: {
      "486353554371926": {
        cmaCampaignIds: ["120226854764190600"],
        soldAsCma: true,
      },
    },
    reels: {
      igUserId: "17841408323984040",
      username: "sproulepropertygroup",
      pageId: "875710882624540",
    },
    // Sproule green #06322D for the page and panels; orbs/glows use a brighter step of it so they show.
    accent: "38, 166, 146",
    tint: "6, 50, 45",
    theme: { bg: "#020e0c", surface: "#041d1a", line: "#06322d", soft: "#062824" },
    glow: "outline",
  },

  "matt-micallef": {
    key: "matt-micallef",
    name: "Matt Micallef Ray White TMG",
    dashTable: "tblsmX0XrkXsRCJJn", // Matt Micallef Dashboard
    trendTable: "tblIR97cbYOOfsKlZ", // Matt Micallef Monthly Trend
    dash: {
      name: "fldLf6WPQRUN7VkAq",
      adAccountId: "fldOCwjLg8KxVXbiK", // "Ad Account" column
      profileVisits: "fldTXxopsubo4rJWx",
      startingFollowers: "fldoyYqnl77rIujtw",
      netGrowth: "fldGttWzB1KRhPZ0L",
      totalFollowers: "fldrJFCycqmVhAwCj",
      male: "fldd7yLUDxVaL9HU7",
      female: "fldIch58CsH2sw4pb",
      keyWins: "fldVez9Qzl9RdmIfX",
      best: ["fld60jMTp2UvsVUAI", "fldmOWGRJVaeNCxPE", "fld3HyKxpmKez7gCD"],
      onboardDate: "fldxK8ir8gOsMwi87",
      fbFollowers: "fldptnt5QmFuWTZzV",
      igFollowers: "fldJhGrg4wEl2T6Uo",
      views: "fldaILJfal4AbQHc1",
      interactions: "fldTogCAVXJBa5Am7",
      viewsBefore: "fld4Mq4QhTt9j3pzh",
      viewsSince: "fldeDudMfdvhKetJE",
      interactionsBefore: "fldT0zZ8PWciY979x",
      interactionsSince: "flddO16FUC0f8e2rt",
      dataNotes: "fldhi7YR40WDkb6pz",
      leadSheets: "fldjPCJoH33UsCpxu",
    },
    trend: {
      label: "fld0Wy8XcYp98Zvk9",
      client: "fldv4gdCWNRQ19HaM", // "Sproule Dashboard copy" = the link to Matt Micallef Dashboard ("Client" links to Sproule Dashboard)
      month: "fldIFv1oA8ICXvYyX",
      period: "fldfbB8m5NkCxnyuu",
      followers: "fld6xScZ3e9foxSi3",
      views: "flddT7CGh2zsR5LG2",
      interactions: "fldurkNz5FryuQfbh",
      profileVisits: "fldd2AjgUTAIZjhEG",
      newFollows: "flddhLlA5RqSkNcWg",
      notes: "fldEQRNo4RBXXX68X",
    },
    leadSheets: {},
    // Matt Micallef grey #585859 for the page and panels; yellow #FFE512 accent for glows/orbs.
    accent: "255, 229, 18",
    tint: "88, 88, 89",
    theme: { bg: "#18181a", surface: "#262627", line: "#585859", soft: "#303031" },
    glow: "outline",
  },
};

export function tenant(): Tenant {
  return TENANTS[process.env.DASHBOARD_CLIENT || "matt-micallef"] ?? TENANTS["matt-micallef"];
}
