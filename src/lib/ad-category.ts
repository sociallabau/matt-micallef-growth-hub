export const CATEGORIES = ["VPA", "CMA", "Boost", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Per ad account. When `cmaCampaignIds` is set, a campaign is CMA only if its
 * id is listed (or, when `soldAsCma` is set, its name is a Sold lead campaign).
 * The shared name patterns are not used for that account, so a valuation or
 * market-report campaign is not treated as the CMA campaign.
 */
export type AdAccountRules = {
  cmaCampaignIds?: readonly string[];
  /** "Sold - …" and "Just Sold - …" lead campaigns belong in CMA, never VPA. */
  soldAsCma?: boolean;
};

const CMA_NAME =
  /\bcma\b|apprais|valuation|home worth|what.?s (my|your) (home|property)|market (update|report)|sell(ing)? (your|my) (home|property)/i;
const SOLD_LEAD = /^(just\s+)?sold\s*[-–—]/i;
const STREET =
  /\b\d+[a-z]?(?:\/\d+)?\s+[a-z' ]+\b(street|st|road|rd|avenue|ave|drive|dr|court|ct|crescent|cres|parade|pde|place|pl|lane|ln|close|cl|terrace|tce|way|circuit|cct|boulevard|blvd|esplanade|highway|hwy|grove|gr)\b/i;

export function categorize(name: string, opts?: { id?: string; rules?: AdAccountRules }): Category {
  const rules = opts?.rules;
  const pinned = rules?.cmaCampaignIds;
  if (opts?.id && pinned?.includes(opts.id)) return "CMA";
  // Before the VPA rule, which also matches "Sold …" and "Just sold …".
  if (rules?.soldAsCma && SOLD_LEAD.test(name.trim())) return "CMA";
  // An explicit id list replaces the fuzzy CMA name patterns for this account.
  if (!pinned?.length && CMA_NAME.test(name)) return "CMA";
  if (/\bboost(ed)?\b|^(instagram |facebook )?(post|reel|video)\s*:/i.test(name)) return "Boost";
  if (/\bvpa\b|property|listing|just listed|just sold|^sold\b|for sale|open home|auction|under contract/i.test(name) || STREET.test(name)) return "VPA";
  if (/\breels?\b|sold post/i.test(name)) return "Boost";
  return "Other";
}
