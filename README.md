# Matt Micallef Ray White TMG · Growth Hub

A password-protected dashboard showing every Matt Micallef Ray White TMG profile's organic Instagram/Facebook performance (from Airtable) and their Meta ad campaigns (live from the Marketing API), at a glance. Built from the McGrath Redcliffe Growth Hub, themed in Matt Micallef grey `#585859` with yellow `#FFE512` accents.

- **Organic:** read from the `Matt Micallef Dashboard` and `Matt Micallef Monthly Trend` tables in the Airtable **Reports** base. Update Airtable and the dashboard picks it up within a minute (or hit **Refresh**).
- **Ads:** pulled live from each profile's `Ad Account ID` using the Meta Marketing API, over the account's whole lifetime (`date_preset=maximum`). Cached for 5 minutes.
- Profiles with no Ad Account ID show "No ad account connected".

## Environment variables

See [.env.example](.env.example). Set them in `.env.local` for local dev and in Vercel → Settings → Environment Variables for production.

| Key | What |
|---|---|
| `DASHBOARD_CLIENT` | `matt-micallef` (the default) |
| `DASHBOARD_PASSWORD` | Password to open the dashboard |
| `AIRTABLE_TOKEN` | Airtable personal access token, `data.records:read` on the Reports base |
| `META_ACCESS_TOKEN` | Meta token with `ads_read` on every client ad account (System User token recommended) |

## Local dev

```bash
npm install
npm run dev
```

`AIRTABLE_TOKEN` is required (there is no offline snapshot for Matt Micallef). Without `DASHBOARD_PASSWORD`, local dev skips the login.

## Adding a profile

Add a row to the `Matt Micallef Dashboard` table (and its months to `Matt Micallef Monthly Trend`). It appears automatically.

## Core suburbs map

The suburb strip at the top of the overview is driven by `offices` in [src/lib/tenants.ts](src/lib/tenants.ts). It's hidden until suburbs are added there.
