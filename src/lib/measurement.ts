/**
 * Plain-language "How these numbers are measured" copy for the client page.
 * Date ranges come from the 90-day rows. Nothing here is a fixed calendar block.
 */

export type MeasurementPoint = { term: string; text: string };

export type MeasurementCopy = {
  intro: string;
  monthLine: string;
  points: MeasurementPoint[];
  extras: string[];
};

export type MeasurementSource = {
  compare: { recentLabel: string; earlyLabel: string; windows: unknown } | null;
  months: { partial: boolean; before: boolean }[];
  startLabel: string;
  netGrowth: number;
  malePct: number;
  femalePct: number;
};

const GENERIC_RECENT = "the latest 90 days";
const GENERIC_EARLY = "the previous 90 days";

const POINTS: MeasurementPoint[] = [
  {
    term: "Views",
    text: "How many times people saw your posts on Facebook and Instagram, including boosted posts.",
  },
  {
    term: "Interactions",
    text: "Likes, comments, shares, saves and other responses to those posts.",
  },
  {
    term: "Profile visits",
    text: "How many times people opened your Facebook or Instagram profile.",
  },
  {
    term: "Follows",
    text: "New follows in that time. People who unfollowed are not taken off this number.",
  },
  {
    term: "Followers",
    text: "People following your Facebook and Instagram pages. The number on the card is your total today.",
  },
];

export function measurementCopy(source: MeasurementSource): MeasurementCopy {
  const windows = source.compare?.windows;
  const recent = source.compare?.recentLabel ?? null;
  const early = source.compare?.earlyLabel ?? null;
  const extras: string[] = [];

  let intro: string;
  let monthLine: string;
  if (windows && recent && early) {
    const dated = recent !== GENERIC_RECENT || early !== GENERIC_EARLY;
    intro = dated
      ? `The summary compares the most recent 90 days (${recent}) with the 90 days before that (${early}).`
      : "The summary compares the most recent 90 days with the 90 days before that.";
    monthLine = "Where a card says “a month”, that is the 90-day total divided by 3.";
  } else if (recent && early) {
    intro = `The summary compares ${recent} with ${early}.`;
    monthLine = "Where a card says “a month”, that is the average of those months.";
  } else {
    intro = "The summary uses the monthly averages we have for this account.";
    monthLine = "Where a card says “a month”, that is that average.";
  }

  const latest = source.months[source.months.length - 1];
  extras.push(
    latest?.partial
      ? "The bars are calendar months. The latest bar is this month so far, so it is not a full month."
      : "The bars are calendar months.",
  );
  if (source.months.some((month) => month.before)) {
    extras.push("Grey bars are from before we started working together.");
  }
  if (source.netGrowth !== 0 && source.startLabel && source.startLabel !== "onboarding") {
    extras.push(`The change next to your follower total is since ${source.startLabel}.`);
  }
  if (source.malePct + source.femalePct > 0) {
    extras.push("The male and female split is from your Instagram followers.");
  }
  extras.push("These numbers come from your Facebook and Instagram accounts.");

  return { intro, monthLine, points: POINTS, extras };
}
