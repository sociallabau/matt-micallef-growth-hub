import assert from "node:assert/strict";
import { test } from "node:test";
import { measurementCopy, type MeasurementSource } from "./measurement";

const sproule = (): MeasurementSource => ({
  compare: {
    recentLabel: "19 Aug–16 Nov 2026",
    earlyLabel: "21 May–18 Aug 2026",
    windows: { current: {}, previous: {} },
  },
  months: [
    { partial: false, before: false },
    { partial: true, before: false },
  ],
  startLabel: "Oct 2025",
  netGrowth: 302,
  malePct: 40,
  femalePct: 60,
});

const plain = (source: MeasurementSource) => {
  const copy = measurementCopy(source);
  return [copy.intro, copy.monthLine, ...copy.points.map((point) => `${point.term}. ${point.text}`), ...copy.extras].join("\n");
};

test("the note uses the 90-day ranges from the data and explains a month", () => {
  const text = plain(sproule());
  assert.match(text, /most recent 90 days \(19 Aug–16 Nov 2026\)/);
  assert.match(text, /90 days before that \(21 May–18 Aug 2026\)/);
  assert.match(text, /90-day total divided by 3/);
  assert.match(text, /Views\. How many times people saw your posts/);
  assert.match(text, /Interactions\. Likes, comments, shares, saves/);
  assert.match(text, /Profile visits\. How many times people opened/);
  assert.match(text, /Follows\. New follows/);
  assert.match(text, /Followers\. People following your Facebook and Instagram pages/);
  assert.match(text, /bars are calendar months/);
  assert.match(text, /this month so far/);
  assert.match(text, /since Oct 2025/);
  assert.match(text, /Instagram followers/);
  assert.match(text, /Facebook and Instagram accounts/);
  assert.doesNotMatch(text, /Before avg|Oct–Dec|Graph|API|total_views|retention|organic vs paid|formula/i);
});

test("a full latest month is not described as partial, and grey bars are mentioned only when they exist", () => {
  const source = sproule();
  source.months = [{ partial: false, before: true }];
  const text = plain(source);
  assert.equal(measurementCopy(source).extras[0], "The bars are calendar months.");
  assert.doesNotMatch(text, /this month so far/);
  assert.match(text, /Grey bars are from before we started working together/);
});

test("without 90-day rows the note does not invent a 90-day total", () => {
  const text = plain({
    ...sproule(),
    compare: { recentLabel: "Aug–Oct 2026", earlyLabel: "Oct–Dec 2025", windows: null },
    netGrowth: 0,
    malePct: 0,
    femalePct: 0,
  });
  assert.match(text, /compares Aug–Oct 2026 with Oct–Dec 2025/);
  assert.match(text, /average of those months/);
  assert.doesNotMatch(text, /divided by 3/);
  assert.doesNotMatch(text, /since Oct 2025/);
  assert.doesNotMatch(text, /male and female/);
});

test("generic window labels are not repeated inside brackets", () => {
  const text = plain({
    ...sproule(),
    compare: { recentLabel: "the latest 90 days", earlyLabel: "the previous 90 days", windows: {} },
  });
  assert.equal(
    measurementCopy({
      ...sproule(),
      compare: { recentLabel: "the latest 90 days", earlyLabel: "the previous 90 days", windows: {} },
    }).intro,
    "The summary compares the most recent 90 days with the 90 days before that.",
  );
  assert.match(text, /divided by 3/);
});
