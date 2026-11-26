import type { VpaCampaign } from "@/lib/vpa";
import { compact, fmt, money } from "@/lib/format";
import { Stat, StatusDot } from "./ui";

export function VpaSection({ campaigns }: { campaigns: VpaCampaign[] }) {
  const results = campaigns.reduce((t, c) => t + c.results, 0);
  const reach = campaigns.reduce((t, c) => t + c.reach, 0);
  const running = campaigns.filter((c) => c.running).length;

  return (
    <>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat large label="Properties" value={`${campaigns.length}`} />
        <Stat large label="Results" value={fmt(results)} />
        <Stat large label="Reach" value={compact(reach)} />
        <Stat large label="Running now" value={`${running}`} />
      </div>
      <div className="-mx-5 mt-6 overflow-x-auto border-t border-line">
        <table className="tabular w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-5 py-2 font-normal">Property</th>
              <th className="px-3 py-2 font-normal">Status</th>
              <th className="px-3 py-2 text-right font-normal">Results</th>
              <th className="px-3 py-2 text-right font-normal">Cost / result</th>
              <th className="px-3 py-2 text-right font-normal">Reach</th>
              <th className="px-3 py-2 text-right font-normal">Dates</th>
              <th className="px-5 py-2 text-right font-normal">Report</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id} className="border-b border-line align-top last:border-0">
                <td className="max-w-[300px] px-5 py-3">
                  <p className="font-medium">{c.address}</p>
                  {c.landingPageViews > 0 && <p className="text-xs text-muted">{fmt(c.landingPageViews)} landing page views</p>}
                  {c.analysis && (
                    <details className="mt-1 text-xs text-muted">
                      <summary className="cursor-pointer hover:text-fg">Campaign analysis</summary>
                      <p className="mt-1 whitespace-pre-line">{c.analysis}</p>
                    </details>
                  )}
                </td>
                <td className="px-3 py-3">
                  <StatusDot active={c.running} status={c.running ? "Running" : "Completed"} />
                </td>
                <td className="px-3 py-3 text-right">{c.results ? fmt(c.results) : "—"}</td>
                <td className="px-3 py-3 text-right">{c.costPerResult ? money(c.costPerResult, "AUD", 2) : "—"}</td>
                <td className="px-3 py-3 text-right">{compact(c.reach)}</td>
                <td className="whitespace-nowrap px-3 py-3 text-right text-xs text-muted">
                  {c.start ?? "—"}
                  <br />→ {c.end ?? "—"}
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  {c.reportUrl ? (
                    <a
                      href={c.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-md border border-white/15 px-2.5 py-1 text-xs transition-shadow hover:shadow-[0_0_16px_rgba(var(--accent-rgb),0.45)]"
                    >
                      View report ↗
                    </a>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
