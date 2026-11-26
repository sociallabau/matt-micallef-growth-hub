import assert from "node:assert/strict";
import { test } from "node:test";
import type { AirtableRecord, MonthPoint } from "./airtable";
import type { MonthDrivers } from "./organic";
import {
  calendarWindows,
  comparisonSentence,
  perMonth,
  routeTrendRow,
  sharedLabel,
  windowBounds,
  windowDateLabel,
  windowReasons,
  type NinetyDayWindows,
} from "./windows";

process.env.TZ = "UTC";

const CURRENT = "19 Aug–16 Nov 2026";
const PREVIOUS = "21 May–18 Aug 2026";

const sprouleWindows: NinetyDayWindows = {
  current: {
    label: CURRENT,
    since: "2026-08-19",
    until: "2026-11-16",
    views: 898_741,
    interactions: 44_741,
    profileVisits: 9_260,
    newFollows: 338,
    followers: 3_283,
  },
  previous: {
    label: PREVIOUS,
    since: "2026-05-21",
    until: "2026-08-18",
    views: 708_047,
    interactions: 24_362,
    profileVisits: 5_972,
    newFollows: 226,
    followers: 3_048,
  },
};

test("Sproule headlines compare the latest 90 days with the 90 days before, per month", () => {
  assert.equal(perMonth(898_741), 898_741 / 3);
  assert.equal(
    comparisonSentence(perMonth(898_741), perMonth(708_047), "views", CURRENT, PREVIOUS),
    "▲ 299.6K views a month in 19 Aug–16 Nov 2026 · up from 236.0K in 21 May–18 Aug 2026",
  );
  assert.equal(
    comparisonSentence(perMonth(44_741), perMonth(24_362), "interactions", CURRENT, PREVIOUS),
    "▲ 14.9K interactions a month in 19 Aug–16 Nov 2026 · up from 8.1K in 21 May–18 Aug 2026",
  );
});

test("a lower latest window points down", () => {
  assert.equal(
    comparisonSentence(perMonth(83_141), perMonth(134_031), "views", CURRENT, PREVIOUS),
    "▼ 27.7K views a month in 19 Aug–16 Nov 2026 · down from 44.7K in 21 May–18 Aug 2026",
  );
});

test("90-day bounds prefer the ISO window written on the row", () => {
  const notes = "Current 90 days (19 Aug–16 Nov 2026). Exact Meta organic window 2026-08-19–2026-11-16 (Brisbane, inclusive).";
  assert.deepEqual(windowBounds("Sproule Property Group – Current 90 days (19 Aug–16 Nov 2026)", notes), {
    since: "2026-08-19",
    until: "2026-11-16",
  });
  assert.deepEqual(windowBounds("Client – Previous 90 days (21 May–18 Aug 2026)", null), {
    since: "2026-05-21",
    until: "2026-08-18",
  });
});

test("date labels are copied out of the row, including an en dash or a hyphen", () => {
  const en = "Sproule Property Group – Current 90 days (19 Aug–16 Nov 2026)";
  const hyphen = "Fiona - Previous 90 days (21 May-18 Aug 2026)";
  const crossed = "Client – Current 90 days (19 Nov 2025–16 Feb 2026)";
  assert.equal(windowDateLabel(en, null), CURRENT);
  assert.equal(windowDateLabel(hyphen, null), "21 May-18 Aug 2026");
  assert.equal(windowDateLabel(crossed, null), "19 Nov 2025–16 Feb 2026");
  assert.equal(windowDateLabel("Sproule Property Group – 2025-10", null), null);
  assert.equal(
    windowDateLabel(null, "Current 90 days (19 Aug–16 Nov 2026). Exact Meta organic window 2026-08-19–2026-11-16."),
    CURRENT,
  );
});

test("90-day rows never become chart months, and a real month is not swallowed by a note", () => {
  assert.equal(routeTrendRow("Client – Current 90 days (19 Aug–16 Nov 2026)", null, null), "current");
  assert.equal(routeTrendRow("Client – Previous 90 days (21 May–18 Aug 2026)", null, "2026-08-19"), "previous");
  assert.equal(routeTrendRow("Client – 2026-08", null, "2026-08-01"), "chart");
  assert.equal(routeTrendRow("Client – 2026-08", "Current 90 days (19 Aug–16 Nov 2026)", "2026-08-01"), "chart");
  assert.equal(routeTrendRow(null, "Previous 90 days (21 May–18 Aug 2026). Refreshed Monday.", null), "previous");
  assert.equal(routeTrendRow(null, null, null), "skip");
});

test("the old calendar comparison is unchanged, and is what Sproule used to show", () => {
  const months = [
    ["2025-10-01", 389_553, 27_217],
    ["2025-11-01", 203_112, 6_275],
    ["2025-12-01", 300_303, 15_972],
    ["2026-08-01", 221_708, 5_606],
    ["2026-09-01", 303_945, 14_855],
    ["2026-10-01", 355_985, 20_598],
    ["2026-11-01", 155_494, 7_306],
  ].map(([month, views, interactions], index, all) => ({
    month: String(month),
    partial: index === all.length - 1,
    views: Number(views),
    interactions: Number(interactions),
  }));
  const calendar = calendarWindows(months);
  assert.ok(calendar);
  assert.equal(calendar.earlyLabel, "Oct–Dec 2025");
  assert.equal(calendar.recentLabel, "Aug–Oct 2026");
  assert.equal(
    comparisonSentence(calendar.viewsSince, calendar.viewsBefore, "views", calendar.recentLabel, calendar.earlyLabel),
    "▼ 293.9K views a month in Aug–Oct 2026 · down from 297.7K in Oct–Dec 2025",
  );
  assert.equal(
    comparisonSentence(
      calendar.interactionsSince,
      calendar.interactionsBefore,
      "interactions",
      calendar.recentLabel,
      calendar.earlyLabel,
    ),
    "▼ 13.7K interactions a month in Aug–Oct 2026 · down from 16.5K in Oct–Dec 2025",
  );
});

test("90-day reasons use the two windows and drop calendar-month explanations", () => {
  assert.deepEqual(windowReasons("views", sprouleWindows), []);
  assert.deepEqual(windowReasons("interactions", sprouleWindows), [{ text: "Engagement rate is up" }]);

  const down: NinetyDayWindows = {
    current: { ...sprouleWindows.current, views: 83_141, interactions: 2_226 },
    previous: { ...sprouleWindows.previous, views: 134_031, interactions: 2_757 },
  };
  // Volume fell, but interactions per view rose (2,226/83,141 vs 2,757/134,031).
  assert.deepEqual(windowReasons("interactions", down), [{ text: "Engagement rate is up" }]);
  assert.deepEqual(
    windowReasons("interactions", {
      current: { ...down.current, interactions: 1_000 },
      previous: down.previous,
    }),
    [{ text: "Engagement rate is down" }],
  );
});

test("an aggregate label is used only when every account shares it", () => {
  assert.equal(sharedLabel(["19 Aug–16 Nov 2026", "19 Aug–16 Nov 2026"]), "19 Aug–16 Nov 2026");
  assert.equal(sharedLabel(["19 Aug–16 Nov 2026", "Aug–Oct 2026"]), null);
  assert.equal(sharedLabel(["19 Aug–16 Nov 2026", null]), null);
  assert.equal(sharedLabel([]), null);
});

const point = (month: string, views: number, interactions: number, partial = false): MonthPoint => ({
  month,
  before: false,
  partial,
  followers: 100,
  views,
  interactions,
  profileVisits: 0,
  newFollows: 0,
  posts: null,
  topPostUrl: null,
  topPostViews: null,
  paidSpend: null,
});

test("calendar fallback can still explain a paid spike; a 90-day headline cannot", async () => {
  const { whyDown } = await import("../components/trends.tsx");
  const points = [
    point("2025-10-01", 389_553, 27_217),
    point("2025-11-01", 203_112, 6_275),
    point("2025-12-01", 300_303, 15_972),
    point("2026-08-01", 221_708, 5_606),
    point("2026-09-01", 303_945, 14_855),
    point("2026-10-01", 355_985, 20_598),
  ];
  const drivers: MonthDrivers[] = [
    {
      month: "2025-10",
      fbAdViews: 80,
      fbOrganicViews: 20,
      igViews: 0,
      posts: 4,
      promoted: [{ title: "Boost", url: "https://example.com/october" }],
      topPost: null,
    },
  ];
  const calendar = whyDown(points, drivers, "interactions", 13_686);
  assert.equal(calendar[0]?.text, "October was a paid ad spike");
  assert.equal(calendar[0]?.link?.href, "https://example.com/october");
  assert.ok(calendar.some((reason) => reason.text === "Fewer posts going out"));

  const rolled = whyDown(points, drivers, "interactions", perMonth(44_741), sprouleWindows);
  assert.deepEqual(rolled, [{ text: "Engagement rate is up" }]);
  assert.equal(whyDown(points, drivers, "views", perMonth(898_741), sprouleWindows).length, 0);
});

test("toClients uses 90-day rows for the headline and keeps them out of the bars", async () => {
  process.env.DASHBOARD_CLIENT = "sproule";
  const { toClients } = await import("./airtable");
  const { tenant } = await import("./tenants");
  const { dash: F, trend: T } = tenant();
  const today = new Date("2026-11-17T12:00:00Z");

  const month = (
    clientId: string,
    iso: string,
    views: number,
    interactions: number,
    followers: number,
  ): AirtableRecord => ({
    id: `${clientId}-${iso}`,
    fields: {
      [T.label]: `Profile – ${iso.slice(0, 7)}`,
      [T.client]: [{ id: clientId }],
      [T.month]: iso,
      [T.period]: { name: iso < "2026-07-01" ? "Before onboarding" : "Since onboarding" },
      [T.followers]: followers,
      [T.views]: views,
      [T.interactions]: interactions,
    },
  });
  const window = (
    clientId: string,
    kind: "Current" | "Previous",
    range: string,
    views: number,
    interactions: number,
    filledMonth?: string,
  ): AirtableRecord => ({
    id: `${clientId}-${kind}`,
    fields: {
      [T.label]: `Sproule Property Group – ${kind} 90 days (${range})`,
      [T.client]: [clientId],
      [T.notes]: `${kind} 90 days (${range}). Exact Meta organic window.`,
      [T.views]: views,
      [T.interactions]: interactions,
      [T.followers]: 3_000,
      ...(filledMonth ? { [T.month]: filledMonth } : {}),
    },
  });
  const dash = (id: string, name: string): AirtableRecord => ({
    id,
    fields: {
      [F.name]: name,
      [F.viewsBefore]: 1,
      [F.viewsSince]: 2,
      [F.interactionsBefore]: 3,
      [F.interactionsSince]: 4,
    },
  });

  const history = [
    ["2025-10-01", 389_553, 27_217, 2_442],
    ["2025-11-01", 203_112, 6_275, 2_453],
    ["2025-12-01", 300_303, 15_972, 2_486],
    ["2026-08-01", 221_708, 5_606, 3_046],
    ["2026-09-01", 303_945, 14_855, 3_124],
    ["2026-10-01", 355_985, 20_598, 3_255],
    ["2026-11-01", 155_494, 7_306, 3_283],
  ] as const;

  const sproule = "recSproule";
  const fallback = "recFallback";
  const half = "recHalf";
  const empty = "recEmpty";

  const clients = toClients(
    [dash(sproule, "Sproule Property Group"), dash(fallback, "No Windows - Office"), dash(half, "Only Current"), dash(empty, "Empty Profile")],
    [
      ...history.map(([iso, views, interactions, followers]) => month(sproule, iso, views, interactions, followers)),
      ...history.map(([iso, views, interactions, followers]) => month(fallback, iso, views, interactions, followers)),
      ...history.map(([iso, views, interactions, followers]) => month(half, iso, views, interactions, followers)),
      window(sproule, "Previous", PREVIOUS, 708_047, 24_362),
      // Month filled in by mistake — still a comparison row, not an August bar.
      window(sproule, "Current", CURRENT, 898_741, 44_741, "2026-08-19"),
      window(half, "Current", CURRENT, 898_741, 44_741),
    ],
    today,
  );

  const live = clients.find((client) => client.id === "sproule-property-group");
  assert.ok(live);
  assert.equal(live.viewsSince, 898_741 / 3);
  assert.equal(live.viewsBefore, 708_047 / 3);
  assert.equal(live.interactionsSince, 44_741 / 3);
  assert.equal(live.interactionsBefore, 24_362 / 3);
  assert.equal(live.compare?.recentLabel, CURRENT);
  assert.equal(live.compare?.earlyLabel, PREVIOUS);
  assert.equal(
    comparisonSentence(live.viewsSince, live.viewsBefore, "views", live.compare?.recentLabel, live.compare?.earlyLabel),
    "▲ 299.6K views a month in 19 Aug–16 Nov 2026 · up from 236.0K in 21 May–18 Aug 2026",
  );
  assert.ok(live.months.some((item) => item.month === "2026-08-01" && item.views === 221_708));
  assert.ok(live.months.some((item) => item.month === "2026-11-01" && item.partial));
  assert.equal(live.months.some((item) => item.month === "2026-08-19" || item.views === 898_741 || item.views === 708_047), false);

  const old = clients.find((client) => client.name === "No Windows");
  assert.ok(old);
  assert.equal(old.compare?.windows, null);
  assert.equal(old.compare?.earlyLabel, "Oct–Dec 2025");
  assert.equal(old.compare?.recentLabel, "Aug–Oct 2026");
  assert.equal(
    comparisonSentence(old.viewsSince, old.viewsBefore, "views", old.compare?.recentLabel, old.compare?.earlyLabel),
    "▼ 293.9K views a month in Aug–Oct 2026 · down from 297.7K in Oct–Dec 2025",
  );

  const partial = clients.find((client) => client.name === "Only Current");
  assert.ok(partial);
  assert.equal(partial.compare?.windows, null);
  assert.equal(partial.compare?.recentLabel, "Aug–Oct 2026");
  assert.notEqual(partial.viewsSince, 898_741 / 3);

  const none = clients.find((client) => client.name === "Empty Profile");
  assert.ok(none);
  assert.equal(none.compare, null);
  assert.equal(none.viewsSince, 2);
  assert.equal(none.viewsBefore, 1);
  assert.equal(none.months.length, 0);
});
