# Codex Handoff

## Project Overview

This is the Software Engineering and Usability Group website for KPI FEI TUKE.
The frontend is a Vue CLI / Vue 3 app intended to stay deployable as a static
GitHub Pages site. Dynamic editing, analytics, backups, and OpenAlex publication
sync are handled by a small Node HTTP API.

Production shape:
- Frontend: GitHub Pages/static build from `dist/`.
- API: `https://seug-api.167.233.132.16.sslip.io`
- VPS service: `seug-api`
- Internal API bind: `127.0.0.1:3004`
- Persistent DB: `/var/lib/seug/data`
- Public snapshots: `/var/lib/seug/public-data`

Main frontend entry points:
- `src/components/PortfolioPage.vue` - top-level page, routing state, data loading, footer, person detail, and SEO meta updates.
- `src/components/PeopleTab.vue` - active member cards plus compact ex-member/student section.
- `src/components/PublicationsTab.vue` - publication timeline with search/year/type filters.
- `src/components/EventsTab.vue` - editable Events tab/page.
- `src/components/AdminPage.vue` - password-gated admin UI at `/admin`.
- `src/router/index.js` - catch-all route into `PortfolioPage.vue`.
  The `/admin` route is lazy-loaded.

Server entry points:
- `server/publications-api.js` - API, admin saves, analytics, backup export, sync trigger.
- `server/openalex-sync.js` - OpenAlex publication sync with manual edit/delete protection.
- `server/export-people.js` - exports `data/people-db.json` to `public/data/people.json`.

Historical Excel/RTF publication tooling still exists in `clan/`, but the live
site no longer reads publication data from that flow.

## Current Behavior

Data loading:
- In local development, `/api/*` calls are proxied to `http://127.0.0.1:5174`.
- In production, the frontend uses `VUE_APP_API_BASE_URL` if set, otherwise
  `https://seug-api.167.233.132.16.sslip.io`.
- If API reads fail, the public site falls back to JSON files in `public/data/`.

Editable data:
- People: `data/people-db.json` and `public/data/people.json`.
- Content/tabs/events/footer meta: `data/content-db.json` and `public/data/content.json`.
- Publications: `data/publications-db.json`, `public/data/publications.json`, and `public/data/publications-meta.json`.
- Analytics: `data/analytics-db.json`.
- Audit log: `data/audit-db.json`.

Admin:
- Default password is `kronos` unless `ADMIN_PASSWORD` is set.
- Admin can edit people, tab visibility, Events, and publications.
- People, tabs, and events support visibility toggles.
- People admin shows one flat list of all people on the left; the selected person's Role dropdown moves that person between the underlying people groups.
- Delete actions for people, events, and publications show a named confirmation and remind the admin to click Save to persist the deletion.
- Admin has an `Export backup` button that downloads all DB and public snapshot JSON files.
- Admin has a `Restore backup` button that imports an exported backup JSON.
- Admin can trigger OpenAlex publication sync and author refresh from the Publications section.
- Admin shows OpenAlex sync metadata and recent sync history, including preserved manual items and skipped deleted publications.
- Admin has an Audit tab for recent saves, syncs, backup exports, and restores.

OpenAlex sync:
- Only visible active people are used for OpenAlex author syncing.
- Admin-saved publication edits are preserved on later syncs.
- Admin-deleted publications are tracked in `meta.deletedPublicationKeys`, so later syncs do not re-add them.
- Manual publications are carried across syncs.
- `syncHistory` is kept in publication metadata with recent count summaries.
- `POST /api/publications/sync` now requires admin auth.

Public site:
- People tab shows active members as cards.
- Ex members and students are shown as compact name pills so they do not take the same space as active members.
- Publications tab has search plus year and type filters.
- Events tab is visible by default and contains Live IT Projects, Game Jams, Hackathons, and Namakaný deň.
- Footer "Last updated" is formatted from content DB metadata, not hardcoded in the component.
- Footer contains a small `Developed by Marek Horváth` link to `https://marek-horvath.github.io/portfolio/seug`.
- Member photos are loaded from the original filenames stored in the people data, for example `marek.jpg`.
- `public/index.html`, `public/sitemap.xml`, and `public/robots.txt` contain baseline SEO for GitHub Pages. Runtime title, description, canonical, Open Graph tags, locale, and document language are updated by `PortfolioPage.vue` for each tab/person route.
- Public UI copy follows the selected SK/EN language, including small labels such as copy/open/back buttons and social link accessibility labels. Admin UI remains English except fields that explicitly edit EN/SK content.

Recent cleanup:
- Removed the old public helper text from the people section.
- Removed unnecessary explanatory admin text about API paths and local file paths.
- Fixed visible Slovak diacritics in data and key UI labels.
- Compressed `src/assets/ema.jpg` from about 2.32 MiB to about 73 KiB.
- Added mobile card-style table rendering in admin for narrow screens.
- Restored member photo loading to the original JPG/PNG asset filenames and removed generated AVIF/WebP variants after Marek's photo failed to render in the browser.
- Changed the local Vue dev proxy default to `http://127.0.0.1:5174`; using `localhost:5174` caused admin API proxy failures on Windows.
- Improved the mobile person detail layout with a back button, localized role badge, centered mobile hero, and safer text wrapping.

## API Endpoints

Public:
- `GET /api/people`
- `GET /api/people/meta`
- `GET /api/content`
- `GET /api/content/meta`
- `GET /api/publications`
- `GET /api/publications/meta`
- `POST /api/analytics/events`

Admin/authenticated:
- `POST /api/analytics/summary`
- `POST /api/admin/content`
- `POST /api/admin/people/save`
- `POST /api/admin/content/save`
- `POST /api/admin/publications/save`
- `POST /api/admin/backup`
- `POST /api/admin/backup/restore`
- `POST /api/admin/audit`
- `POST /api/publications/sync`

Admin password can be sent in JSON body as `password` or in the
`X-Admin-Password` header.

## Commands

Install dependencies:

```bash
npm install
```

Run local API:

```bash
npm run serve:api
```

Run Vue dev server:

```bash
npm run serve
```

Local admin:

```text
http://localhost:8080/admin
```

Refresh people static snapshot:

```bash
npm run export:people
```

Refresh publications from OpenAlex:

```bash
npm run sync:publications
```

Refresh OpenAlex author matching too:

```bash
node server/openalex-sync.js --refresh-authors
```

Verify:

```bash
npm run lint
npm run build
```

## Useful Env Vars

- `VUE_APP_API_BASE_URL` - production/frontend API override.
- `VUE_APP_SITE_URL` - frontend canonical/SEO base URL, defaults to `https://marek-horvath.github.io/skupina`.
- `PUBLICATIONS_API_HOST` - defaults to `127.0.0.1`.
- `PUBLICATIONS_API_PORT` - defaults to `5174` locally, `3004` on VPS.
- `PUBLICATIONS_API_PROXY` - Vue dev proxy target, defaults to `http://127.0.0.1:5174`.
- `SEUG_DATA_DIR` - persistent DB directory, `/var/lib/seug/data` on VPS.
- `SEUG_PUBLIC_DATA_DIR` - public snapshot directory, `/var/lib/seug/public-data` on VPS.
- `ADMIN_PASSWORD` - defaults to `kronos`.
- `ANALYTICS_MAX_EVENTS` - defaults to `20000`.
- `AUDIT_MAX_EVENTS` - defaults to `1000`.
- `REQUEST_BODY_LIMIT_BYTES` - defaults to `10485760` for backup restore payloads.
- `OPENALEX_API_KEY` - recommended for regular OpenAlex syncs.
- `OPENALEX_INSTITUTION_ROR` - defaults to TUKE ROR `https://ror.org/05xm08015`.
- `OPENALEX_INCLUDE_PREPRINTS=true` - include preprints if desired.
- `OPENALEX_MAX_PAGES_PER_AUTHOR` - defaults to `5`.

## VPS Notes

Server:
- IP: `167.233.132.16`
- SSH user: `root`
- SSH key on this PC: `C:\Users\marek\.ssh\hetzner_ms_hockey`

SEUG API:
- Service: `seug-api`
- Code: `/opt/seug-api`
- Env: `/opt/seug-api/.env.production`
- Node runtime: `/opt/node-v22.12.0/bin/node`
- Data: `/var/lib/seug/data`
- Public data: `/var/lib/seug/public-data`
- Backups directory: `/var/backups/seug`
- Caddy host: `seug-api.167.233.132.16.sslip.io`
- Caddy reverse proxy: `127.0.0.1:3004`

Existing apps were left untouched:
- `ms-hockey` on `3000`
- `krajcirstvo` on `3001`
- `portfolio-scholar` on `3002`
- `athena-api` on `3003`

VPS checks:

```bash
systemctl status seug-api --no-pager -l
journalctl -u seug-api -n 100 --no-pager
curl -fsS http://127.0.0.1:3004/api/content
curl -fsS https://seug-api.167.233.132.16.sslip.io/api/content
```

To update API code manually from this workstation:

```powershell
scp -i $env:USERPROFILE\.ssh\hetzner_ms_hockey server\publications-api.js server\openalex-sync.js root@167.233.132.16:/opt/seug-api/server/
ssh -i $env:USERPROFILE\.ssh\hetzner_ms_hockey root@167.233.132.16 "chown -R seug:seug /opt/seug-api && systemctl restart seug-api"
```

To update VPS data snapshots manually:

```powershell
scp -i $env:USERPROFILE\.ssh\hetzner_ms_hockey data\people-db.json data\content-db.json data\publications-db.json data\openalex-authors.json data\analytics-db.json data\audit-db.json root@167.233.132.16:/var/lib/seug/data/
scp -i $env:USERPROFILE\.ssh\hetzner_ms_hockey public\data\people.json public\data\content.json public\data\publications.json public\data\publications-meta.json root@167.233.132.16:/var/lib/seug/public-data/
ssh -i $env:USERPROFILE\.ssh\hetzner_ms_hockey root@167.233.132.16 "chown -R seug:seug /var/lib/seug && systemctl restart seug-api"
```

## Data Shape

People:

```json
{
  "professor": [],
  "associateProfessor": [],
  "researchAssistants": [],
  "phdCandidates": [],
  "exMembers": [],
  "students": []
}
```

People can include `visible`; missing `visible` is treated as visible.

Content:

```json
{
  "tabs": [
    { "id": "people", "visible": true },
    { "id": "publications", "visible": true },
    { "id": "teaching", "visible": true },
    { "id": "events", "visible": true }
  ],
  "events": {
    "intro": "English intro",
    "introSK": "Slovak intro",
    "pressLinkLabel": "KPI events and press releases",
    "pressLinkLabelSK": "Udalosti a tlačové správy KPI",
    "pressLinkUrl": "https://kpi.fei.tuke.sk/sk/udalosti",
    "items": []
  },
  "meta": {
    "updatedAt": "2026-07-05T00:00:00.000Z"
  }
}
```

Publication:

```json
{
  "date": "2026",
  "title": "Publication title",
  "authors": "Author One; Author Two",
  "venue": "Journal or proceedings name",
  "link": "https://doi.org/...",
  "type": "journal"
}
```

Expected `type` values are mainly `journal`, `conference`, `book`, or empty.

## Current Verification

Verified on 2026-07-05:
- `npm run lint` passes.
- `npm run build` passes.
- Build still warns that `caniuse-lite` is old and the app entrypoint is 309 KiB.
  Admin is split into a lazy-loaded chunk.
- Local API tested at `http://127.0.0.1:5174`.
- Local frontend is running at `http://localhost:8080`.
- VPS API service is active and listening on `127.0.0.1:3004`.
- Public API `https://seug-api.167.233.132.16.sslip.io/api/content` returns content.
- Public admin backup export and restore endpoints work with password `kronos`.
- Old password `marecek` returns `401`.
- Unauthenticated public sync returns `401`.
- CORS preflight returns `Access-Control-Allow-Origin: *`.
