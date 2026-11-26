const LOCALE = "en-AU";

export const fmt = (v: number) => new Intl.NumberFormat(LOCALE).format(Math.round(v));

export const compact = (v: number) =>
  Math.abs(v) < 1000 ? fmt(v) : new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 }).format(v);

/** Same compact form, always showing one decimal: 236.0K rather than 236K. Used on comparison sentences. */
export const compact1 = (v: number) =>
  Math.abs(v) < 1000
    ? fmt(v)
    : new Intl.NumberFormat(LOCALE, { notation: "compact", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);

export const money = (v: number, currency = "AUD", digits = 0) =>
  new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);

/** fraction → "12.9%" */
export const pct = (fraction: number, digits = 1) => `${(fraction * 100).toFixed(digits)}%`;

export const date = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso)) : "—";

export const titleCase = (s: string) =>
  s
    .replace(/^OUTCOME_/, "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function instagramEmbed(url: string): string | null {
  const m = url.match(/instagram\.com\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
  if (!m) return null;
  const kind = m[1] === "reels" ? "reel" : m[1];
  return `https://www.instagram.com/${kind}/${m[2]}/embed`;
}
