import { CATEGORIES, displayName, type AdsResult, type Campaign, type Category } from "@/lib/meta";
import { compact, date, fmt, money, pct, titleCase } from "@/lib/format";
import { Stat, StatusDot } from "./ui";

export function AdsUnavailable({ ads }: { ads: Exclude<AdsResult, { status: "ok" }> }) {
  if (ads.status === "none") {
    return <p className="text-sm text-muted">Ad account not connected yet.</p>;
  }
  return (
    <div className="rounded-md border border-dashed border-line p-3 text-sm">
      <p className="font-medium">Couldn&apos;t load ads</p>
      <p className="mt-1 break-words text-xs text-muted">{ads.message}</p>
    </div>
  );
}

const LABELS: Record<Category, string> = {
  VPA: "VPA · Property",
  CMA: "CMA's",
  Boost: "Boosts",
  Other: "Other",
};

function Chevron() {
  return (
    <svg viewBox="0 0 12 12" className="size-3 shrink-0 text-muted transition-transform group-open:rotate-90" aria-hidden>
      <path d="M4 2l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Active campaigns, then VPA / CMA / Boosts — each a dropdown listing its live campaigns. */
export function AdsSnapshot({ ads }: { ads: AdsResult }) {
  const d = ads.status === "ok" ? ads.data : null;
  const cats = CATEGORIES.filter((c) => c !== "Other" || (d?.byCategory.Other.active ?? 0) > 0);
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <Stat large label="Active campaigns" value={d ? `${d.activeCampaigns}` : "—"} />
        {d && <span className="tabular pb-1 text-xs text-muted">of {d.campaigns.length} total</span>}
      </div>
      <div className="mt-4 divide-y divide-line border-y border-line">
        {cats.map((cat) => {
          const c = d?.byCategory[cat];
          const live = d?.campaigns.filter((x) => x.category === cat && x.active) ?? [];
          const row = (
            <>
              <span className="flex items-center gap-2">
                {live.length > 0 ? <Chevron /> : <span className="size-3" />}
                <span className={c?.active ? "" : "text-muted"}>{LABELS[cat]}</span>
              </span>
              <span className={`w-8 text-right text-base font-semibold ${c?.active ? "" : "text-muted"}`}>{c ? c.active : "—"}</span>
            </>
          );
          if (!live.length) {
            return (
              <div key={cat} className="tabular flex items-baseline justify-between gap-3 py-2.5 text-sm">
                {row}
              </div>
            );
          }
          return (
            <details key={cat} className="group">
              <summary className="tabular flex cursor-pointer list-none items-baseline justify-between gap-3 py-2.5 text-sm hover:text-fg [&::-webkit-details-marker]:hidden">
                {row}
              </summary>
              <ul className="mb-3 ml-5 space-y-2 border-l border-[rgba(var(--accent-rgb),0.35)] pl-3">
                {live.map((x) => (
                  <li key={x.id} className="text-xs">
                    <p className="line-clamp-2 text-fg" title={x.name}>
                      {displayName(x.name)}
                    </p>
                    <p className="tabular text-muted">
                      {fmt(x.results)} {x.resultLabel.toLowerCase()}
                      {x.stopTime ? ` · ends ${date(x.stopTime)}` : " · ongoing"}
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
      {ads.status !== "ok" && (
        <div className="mt-3">
          <AdsUnavailable ads={ads} />
        </div>
      )}
    </div>
  );
}

export function AdsTotals({ ads }: { ads: AdsResult & { status: "ok" } }) {
  const d = ads.data;
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      <Stat large label="Leads" value={fmt(d.leads)} />
      <Stat large label="Reach" value={compact(d.reach)} />
      <Stat large label="Impressions" value={compact(d.impressions)} />
      <Stat large label="Link clicks" value={fmt(d.linkClicks)} sub={`${d.ctr.toFixed(2)}% CTR`} />
    </div>
  );
}

/** Campaigns grouped into VPA / CMA / Boosts (/ Other) dropdowns. */
export function CampaignGroups({ campaigns, currency }: { campaigns: Campaign[]; currency: string }) {
  if (!campaigns.length) return <p className="text-sm text-muted">No campaigns in this ad account yet.</p>;
  return (
    <div className="divide-y divide-line">
      {CATEGORIES.map((cat, i) => {
        const list = campaigns.filter((c) => c.category === cat);
        if (!list.length) return null;
        const active = list.filter((c) => c.active).length;
        return (
          <details key={cat} className="group" open={i === 0 && active > 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2.5">
                <Chevron />
                <span className="font-medium">{LABELS[cat]}</span>
              </span>
              <span className="tabular text-xs text-muted">
                <span className="text-sm font-semibold text-fg">{active}</span> active · {list.length} total
              </span>
            </summary>
            <div className="pb-4">
              <CampaignTable campaigns={list} currency={currency} />
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function CampaignTable({ campaigns, currency }: { campaigns: Campaign[]; currency: string }) {
  if (!campaigns.length) return <p className="text-sm text-muted">No campaigns yet.</p>;
  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="tabular w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs text-muted">
            <th className="px-5 py-2 font-normal">Campaign</th>
            <th className="px-3 py-2 font-normal">Status</th>
            <th className="px-3 py-2 text-right font-normal">Results</th>
            <th className="px-3 py-2 text-right font-normal">Cost / result</th>
            <th className="px-3 py-2 text-right font-normal">Reach</th>
            <th className="px-3 py-2 text-right font-normal">CTR</th>
            <th className="px-5 py-2 text-right font-normal">Dates</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} className={`border-b border-line last:border-0 ${c.active ? "" : "text-muted"}`}>
              <td className="max-w-[320px] px-5 py-3">
                <p className={`truncate font-medium ${c.active ? "text-fg" : ""}`} title={c.name}>
                  {displayName(c.name)}
                </p>
                <p className="text-xs text-muted">{titleCase(c.objective)}</p>
              </td>
              <td className="px-3 py-3">
                <StatusDot active={c.active} status={c.status} />
              </td>
              <td className="px-3 py-3 text-right">
                <p>{fmt(c.results)}</p>
                <p className="text-xs text-muted">{c.resultLabel}</p>
              </td>
              <td className="px-3 py-3 text-right">{c.costPerResult != null ? money(c.costPerResult, currency, 2) : "—"}</td>
              <td className="px-3 py-3 text-right">{compact(c.reach)}</td>
              <td className="px-3 py-3 text-right">{c.ctr ? pct(c.ctr / 100, 2) : "—"}</td>
              <td className="whitespace-nowrap px-5 py-3 text-right text-xs text-muted">
                {date(c.startTime)}
                <br />
                {c.stopTime ? `→ ${date(c.stopTime)}` : "Ongoing"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
