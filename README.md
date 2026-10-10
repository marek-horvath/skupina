# SEUG website

## Docker on Windows

Prerequisite: Docker Desktop with Docker Compose v2.

For the simplest local start, double-click start.bat. On the first run it
creates a Git-ignored .env with a random admin password, builds both containers,
waits for the API and frontend healthchecks, and opens:

    http://localhost:8090/

The local API is also available at http://localhost:5174/. The host ports can
be changed with FRONTEND_PORT and API_PORT in .env. To stop the application,
double-click stop.bat. It runs docker compose down and keeps all application
data.

The same commands can be run manually:

    Copy-Item .env.example .env
    # Set a local ADMIN_PASSWORD in .env before continuing.
    docker compose up -d --build
    docker compose down

Docker runs the Vue frontend and Node API in development mode. The repository is
mounted into both containers and file polling is enabled, so frontend and API
source changes reload automatically. Rebuild after changing dependencies,
Dockerfile, or Compose configuration:

    docker compose up -d --build

The JSON databases use the named volumes seug_app_data and seug_public_data.
They are initialized from the repository only when empty and survive
docker compose down. Use docker compose down -v only when you explicitly want
to delete the local Docker data and initialize it again from the repository.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Publications data
People are loaded from `/api/people` in local development and from the VPS API
in production. If the API is unavailable, the frontend falls back to
`public/data/people.json`. Edit the local people database in `data/people-db.json`
or through `/admin`.

Update the static people snapshot after editing the local database:
```
npm run export:people
```

Publications are loaded from the same API, otherwise from
`public/data/publications.json`.

Tabs, Events content, and footer "last updated" metadata are loaded from the API
or from `public/data/content.json`. Edit them through `/admin` or in
`data/content-db.json`.

Refresh the local OpenAlex snapshot:
```
npm run sync:publications
```

Run the local publications API/dashboard:
```
npm run serve:api
```

### Production API

The GitHub Pages frontend uses this API by default in production:

```
https://seug-api.167.233.132.16.sslip.io
```

Override it for another deploy target with:

```
VUE_APP_API_BASE_URL=https://your-api.example.com npm run build
```

VPS service details:
- service: `seug-api`
- internal port: `127.0.0.1:3004`
- app code: `/opt/seug-api`
- persistent DB: `/var/lib/seug/data`
- public snapshots: `/var/lib/seug/public-data`

Useful VPS commands:

```
systemctl status seug-api --no-pager
journalctl -u seug-api -n 100 --no-pager
systemctl restart seug-api
```

### Local admin analytics
Admin page:
```
http://localhost:8080/admin
```

Default local password:
```
kronos
```

Click analytics are stored locally in `data/analytics-db.json`. The local API
must be running for tracking and admin stats:
```
npm run serve:api
```

The admin also has content editing sections:
- People editor writes `data/people-db.json` and `public/data/people.json`.
- Content editor writes tab visibility and Events content to `data/content-db.json`
  and `public/data/content.json`.
- Publications editor writes `data/publications-db.json` and `public/data/publications.json`.
- Export backup downloads all JSON databases and public snapshots from the API.
- Restore backup imports a previously exported JSON backup and overwrites current data.
- OpenAlex sync can be triggered from the Publications admin section.
- Audit tab shows recent admin saves, syncs, backup exports, and restores.

Manual publication edits are protected after saving through admin. The next
OpenAlex sync preserves edited publication fields, keeps manual publications,
and does not re-add publications that were deleted in admin.

People can opt out of publication matching with the "Sync OpenAlex publications"
checkbox in admin. New people start with it off. Disabling it removes the
cached OpenAlex author match; the next sync removes publications that came only
from that author while retaining manually edited publications.

Member photos are loaded from the original filenames stored in the people data,
for example `marek.jpg`. Do not switch these to generated formats unless the
rendering is checked in the browser.

SEO defaults live in `public/index.html`; runtime title/description/canonical
tags are updated by `PortfolioPage.vue`. For another public URL set:
```
VUE_APP_SITE_URL=https://your-site.example.com npm run build
```

OpenAlex now uses API keys for normal usage. The sync also works for small local
tests without a key, but for regular updates set `OPENALEX_API_KEY` first.

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
