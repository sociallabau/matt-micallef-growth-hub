import Link from "next/link";
import { getDashboard, type ClientWithAds } from "@/lib/data";
import { tenant } from "@/lib/tenants";
import { OfficeMap } from "@/components/office-map";
import { LeadSheets } from "@/components/lead-sheets";
import { fmt } from "@/lib/format";
import { comparisonCopy, sharedLabel } from "@/lib/windows";
import { Header } from "@/components/header";
import { SetupError } from "@/components/setup-error";
import { AdsSnapshot } from "@/components/ads";
import { Card, SectionTitle, Stat } from "@/components/ui";
import { ChartKey, FollowersBlock, InteractionsBlock, VerdictBadge, ViewsBlock } from "@/components/trends";

export const dynamic = "force-dynamic";


export default async function Overview() {
  const dash = await getDashboard();
  if (!dash.ok) return <SetupError message={dash.error} />;
  const { clients, sample, fetchedAt } = dash;

  const sum = (f: (c: ClientWithAds) => number) => clients.reduce((t, c) => t + f(c), 0);
  const withAds = clients.flatMap((c) => (c.ads.status === "ok" ? [c.ads.data] : []));
  const viewsSince = sum((c) => c.viewsSince);
  const viewsBefore = sum((c) => c.viewsBefore);
  const viewsCopy = comparisonCopy(
    viewsSince,
    viewsBefore,
    sharedLabel(clients.map((c) => c.compare?.recentLabel)),
    sharedLabel(clients.map((c) => c.compare?.earlyLabel)),
  );
  const viewsSub = viewsBefore
    ? `${viewsCopy.recent === "since onboarding" ? "" : `${viewsCopy.recent} · `}${viewsCopy.direction} from ${viewsCopy.beforeText} ${viewsCopy.early}`
    : undefined;

  return (
    <>
      <Header fetchedAt={fetchedAt} />
      <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6">
        {sample && (
          <p className="mb-6 rounded-md border border-dashed border-line px-3 py-2 text-xs text-muted">
            Showing a local copy of Airtable. Add AIRTABLE_TOKEN to .env.local to load live data.
          </p>
        )}

        {tenant().offices?.length ? (
          <div className="mb-8">
            <OfficeMap offices={tenant().offices!} region={tenant().region} />
          </div>
        ) : null}

        <SectionTitle>All accounts</SectionTitle>
        <Card className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat large label="Total followers" value={fmt(sum((c) => c.totalFollowers))} />
          <Stat large label={`New since ${clients[0]?.startLabel ?? "onboarding"}`} value={`+${fmt(sum((c) => c.netGrowth))}`} />
          <Stat
            large
            label="Views a month"
            value={viewsCopy.sinceText}
            sub={viewsSub}
          />
          <Stat
            large
            label="Active ad campaigns"
            value={withAds.length ? `${withAds.reduce((t, d) => t + d.activeCampaigns, 0)}` : "—"}
          />
        </Card>

        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Accounts</h2>
            <ChartKey />
          </div>
          <div className="space-y-5">
            {clients.map((c, i) => (
              <ClientCard key={c.id} client={c} index={i} />
            ))}
          </div>
        </div>

      </main>
    </>
  );
}

function ClientCard({ client: c, index }: { client: ClientWithAds; index: number }) {
  return (
    <article className="glow animate-rise rounded-xl border p-5 sm:p-6" style={{ animationDelay: `${150 + index * 120}ms` }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/clients/${c.id}`} className="group flex min-w-0 items-baseline gap-3">
          <h3 className="truncate text-xl font-semibold tracking-tight group-hover:underline">{c.name}</h3>
          <span className="truncate text-xs text-muted">{c.subtitle ?? "Agency account"}</span>
        </Link>
        <div className="flex items-center gap-4">
          <VerdictBadge client={c} />
          <Link href={`/clients/${c.id}`} className="whitespace-nowrap text-sm text-muted hover:text-fg">
            Full report →
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_240px]">
        <FollowersBlock client={c} height={170} />
        <ViewsBlock client={c} height={170} />
        <InteractionsBlock client={c} height={170} />
        <div className="xl:border-l xl:border-line xl:pl-6">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Meta ads</p>
            <LeadSheets urls={c.leadSheets} />
          </div>
          <AdsSnapshot ads={c.ads} />
        </div>
      </div>
    </article>
  );
}
