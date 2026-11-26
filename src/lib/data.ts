import "server-only";
import { getClients, type Client } from "./airtable";
import { getAdAccount, type AdsResult } from "./meta";
import { getDrivers, type MonthDrivers } from "./organic";
import { tenant } from "./tenants";

export type ClientWithAds = Client & { ads: AdsResult; drivers: MonthDrivers[] | null };

export type Dashboard =
  | { ok: true; clients: ClientWithAds[]; sample: boolean; fetchedAt: Date }
  | { ok: false; error: string };

export async function getDashboard(): Promise<Dashboard> {
  try {
    const { clients, sample } = await getClients();
    const withAds: ClientWithAds[] = await Promise.all(
      clients.map(async (c) => {
        // Month-by-month Meta drivers explain the calendar fallback only.
        // A 90-day headline is explained from the two window totals instead.
        const explainCalendar =
          !c.compare?.windows && (c.viewsSince < c.viewsBefore || c.interactionsSince < c.interactionsBefore);
        const [ads, drivers] = await Promise.all([
          getAdAccount(c.adAccountId, c.adAccountId ? tenant().adRules?.[c.adAccountId] : undefined),
          explainCalendar ? getDrivers(c.name, c.months.map((m) => m.month.slice(0, 7))) : Promise.resolve(null),
        ]);
        return { ...c, ads, drivers };
      }),
    );
    return { ok: true, clients: withAds, sample, fetchedAt: new Date() };
  } catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
