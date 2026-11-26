import { notFound } from "next/navigation";
import { getDashboard } from "@/lib/data";
import { date } from "@/lib/format";
import { getTopReels } from "@/lib/top-reels";
import { tenant } from "@/lib/tenants";
import { Header } from "@/components/header";
import { SetupError } from "@/components/setup-error";
import { AdsSnapshot, AdsTotals, CampaignGroups } from "@/components/ads";
import { Reels } from "@/components/reels";
import { VpaSection } from "@/components/vpa";
import { LeadSheets } from "@/components/lead-sheets";
import { getVpaCampaigns } from "@/lib/vpa";
import { AudienceBar, Card, SectionTitle, SplitBar } from "@/components/ui";
import { HowMeasured } from "@/components/measurement";
import { ChartKey, FollowersBlock, InteractionsBlock, VerdictBadge, ViewsBlock } from "@/components/trends";

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dash = await getDashboard();
  if (!dash.ok) return <SetupError message={dash.error} />;
  const { clients, fetchedAt } = dash;
  const c = clients.find((x) => x.id === id);
  if (!c) notFound();
  const vpa = await getVpaCampaigns([c.name, c.subtitle ? `${c.name} - ${c.subtitle}` : c.name]);
  const reelAccount = tenant().reels;
  const reelWindow = c.compare?.windows?.current;
  const ranked =
    reelAccount && reelWindow?.since && reelWindow.until
      ? await getTopReels(reelAccount, { since: reelWindow.since, until: reelWindow.until })
      : null;
  // A failed lookup keeps the stored links. The wrong Instagram account never does.
  const reelUrls =
    ranked?.ok ? ranked.reels.map((reel) => reel.permalink) : ranked?.reason === "wrong-account" ? [] : c.topContent;
  const reelAside = ranked?.ok ? `Most recent 90 days · ${reelWindow?.label}` : undefined;

  return (
    <>
      <Header fetchedAt={fetchedAt} back />
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-muted">{c.subtitle ?? "Agency account"}</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{c.name}</h1>
            <VerdictBadge client={c} />
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            Organic growth{c.onboardDate ? ` · onboarded ${date(c.onboardDate)}` : ""}
          </h2>
          <ChartKey />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <FollowersBlock client={c} height={180} />
          </Card>
          <Card>
            <ViewsBlock client={c} height={180} />
          </Card>
          <Card>
            <InteractionsBlock client={c} height={180} />
          </Card>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <Card>
            <p className="mb-3 text-xs text-muted">Where the followers are</p>
            <SplitBar a={{ label: "Instagram", value: c.igFollowers }} b={{ label: "Facebook", value: c.fbFollowers }} />
            <p className="mb-3 mt-6 text-xs text-muted">Audience</p>
            <AudienceBar male={c.malePct} female={c.femalePct} />
          </Card>
          <Card className="lg:col-span-2">
            {c.keyWins && (
              <>
                <p className="mb-2 text-xs text-muted">Key wins</p>
                <p className="mb-4 whitespace-pre-line text-sm">{c.keyWins}</p>
              </>
            )}
            <HowMeasured source={c} />
          </Card>
        </div>

        <div className="mt-10">
          <SectionTitle aside={reelAside}>Top performing content</SectionTitle>
          <Reels urls={reelUrls} />
        </div>

        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Meta ads{c.ads.status === "ok" ? ` · ${c.ads.data.accountName}` : ""}
            </h2>
            <LeadSheets urls={c.leadSheets} />
          </div>
          {c.ads.status === "ok" ? (
            <>
              <div className="grid gap-5 lg:grid-cols-3">
                <Card>
                  <AdsSnapshot ads={c.ads} />
                </Card>
                <Card className="lg:col-span-2">
                  <AdsTotals ads={c.ads} />
                </Card>
              </div>
              <Card className="mt-5">
                <p className="mb-1 text-xs text-muted">Campaigns by type · active first</p>
                <CampaignGroups campaigns={c.ads.data.campaigns} currency={c.ads.data.currency} />
              </Card>
            </>
          ) : (
            <Card className="max-w-md">
              <AdsSnapshot ads={c.ads} />
            </Card>
          )}
        </div>

        {vpa.length > 0 && (
          <div className="mt-10">
            <SectionTitle aside="From Airtable · Table 1">VPA campaigns</SectionTitle>
            <Card>
              <VpaSection campaigns={vpa} />
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
