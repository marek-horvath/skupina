# Codex Handoff

## Project Overview

This is a Vue CLI / Vue 3 research group website.

Main frontend entry points:
- `src/components/PortfolioPage.vue` - top-level page, routing state, data loading, person detail view.
- `src/components/AdminPage.vue` - password-gated local analytics dashboard at `/admin`.
- `src/components/PublicationsTab.vue` - publication timeline rendering.
- `src/components/PeopleTab.vue` - people cards and person selection.
- `src/router/index.js` - catch-all route into `PortfolioPage.vue`.

Historical publication tooling is in `clan/`. The old Excel/RTF flow is still present there, but the website no longer reads publication data from `clan/pub.xlsx`.

## What Was Changed

People were moved from Google Sheets CSV to a local JSON database. Publications were moved from the Google Sheets/Excel-style CSV source to a local OpenAlex-backed snapshot flow.

Current behavior:
- People load from `/api/people` when the local API is running.
- If the API is not running, people fall back to `public/data/people.json`.
- Teaching still loads from the existing public Google Sheets CSV.
- Publications load from `/api/publications` when the local API is running.
- If the API is not running, publications fall back to `public/data/publications.json`.

This keeps the deployed site static-friendly while allowing local refreshes from OpenAlex.

## New Files

- `server/openalex-sync.js`
  - Resolves current people to OpenAlex authors.
  - Reads current people from `data/people-db.json` first, with `public/data/people.json` as fallback.
  - Fetches their OpenAlex works.
  - Deduplicates by normalized `title + year`.
  - Filters out non-publication-like OpenAlex types: `dataset`, `software`, `preprint`, `other`, `paratext`, `erratum`, `editorial`, `letter`.
  - Writes both local DB/cache and public static snapshot files.

- `server/publications-api.js`
  - Small Node HTTP server.
  - Serves:
    - `GET /api/people`
    - `GET /api/people/meta`
    - `GET /api/publications`
    - `GET /api/publications/meta`
    - `POST /api/analytics/events`
    - `POST /api/analytics/summary`
    - `POST /api/admin/content`
    - `POST /api/admin/people/save`
    - `POST /api/admin/publications/save`
    - `POST /api/publications/sync`
  - Root page `http://localhost:5174/` is a minimal local data dashboard with a sync button.

- `server/export-people.js`
  - Copies the `people` object from `data/people-db.json` into `public/data/people.json`.
  - Use after editing the local people database.

- `data/people-db.json`
  - Local editable people database.
  - This is the primary local source for people and author matching.

- `public/data/people.json`
  - Static people snapshot consumed by frontend fallback and static deploys.

- `data/openalex-authors.json`
  - Local cache mapping website people to OpenAlex author IDs.
  - If author matching is wrong, fix this file or rerun sync with `--refresh-authors`.

- `data/publications-db.json`
  - Local generated DB containing metadata plus normalized publications.

- `data/analytics-db.json`
  - Local click/event database for admin analytics.
  - Written by `POST /api/analytics/events`.

- `public/data/publications.json`
  - Static publication snapshot consumed by the frontend fallback and by static deploys.

- `public/data/publications-meta.json`
  - Sync metadata: counts, generated time, resolved/unresolved authors.

## Changed Files

- `src/components/PortfolioPage.vue`
  - Removed people CSV loading from Google Sheets.
  - Removed publication CSV loading from Google Sheets.
  - Added `loadPeople()`.
  - Added `loadPublications()`.
  - Added event tracking for people, tabs, languages, publication clicks, and detail links.
  - Added API-first/static-fallback people loading.
  - Added API-first/static-fallback publication loading.
  - Teaching still uses the existing CSV parser.

- `src/components/AdminPage.vue`
  - New `/admin` UI.
  - Password-gated with default local password `marecek`.
  - Has internal sections: `Stats`, `Ludia`, `Publikacie`.
  - Fetches analytics from `POST /api/analytics/summary`.
  - Loads editable content from `POST /api/admin/content`.
  - Saves people through `POST /api/admin/people/save`.
  - Saves publications through `POST /api/admin/publications/save`.
  - Visual style is intentionally aligned with `PortfolioPage.vue`: same Fraunces/Space Grotesk fonts, paper/mist background, dark teal header, orange/teal accents.

- `package.json`
  - Added:
    - `npm run sync:publications`
    - `npm run serve:api`
    - `npm run export:people`

- `vue.config.js`
  - Added dev proxy from `/api` to `http://localhost:5174`.
  - Added `historyApiFallback: true` so direct routes such as `/publications` work in dev.

- `README.md`
  - Added short publication data instructions.

## Commands

Install dependencies:

```bash
npm install
```

Run Vue dev server:

```bash
npm run serve
```

Run local publications API/dashboard:

```bash
npm run serve:api
```

Run admin analytics:

```bash
npm run serve:api
npm run serve
```

Then open:

```bash
http://localhost:8080/admin
```

Default local admin password:

```bash
marecek
```

Edit people locally in:

```bash
data/people-db.json
```

For static fallback/deploys, regenerate `public/data/people.json` with:

```bash
npm run export:people
```

Refresh publications from OpenAlex:

```bash
npm run sync:publications
```

Refresh author matching too:

```bash
node server/openalex-sync.js --refresh-authors
```

Verify:

```bash
npm run lint
npm run build
```

## OpenAlex Notes

OpenAlex now uses API keys for normal usage. Small local tests worked without a key, but regular updates should set:

```bash
$env:OPENALEX_API_KEY="your-key"
npm run sync:publications
```

Useful optional env vars:
- `OPENALEX_API_KEY` - API key for OpenAlex.
- `OPENALEX_INSTITUTION_ROR` - defaults to TUKE ROR `https://ror.org/05xm08015`.
- `OPENALEX_INCLUDE_PREPRINTS=true` - include preprints if desired.
- `OPENALEX_MAX_PAGES_PER_AUTHOR` - defaults to `5`.
- `PUBLICATIONS_API_PORT` - defaults to `5174` for the local data API.
- `PUBLICATIONS_API_PROXY` - Vue dev proxy target, defaults to `http://localhost:5174`.
- `ADMIN_PASSWORD` - defaults to `marecek`.
- `ANALYTICS_MAX_EVENTS` - defaults to `20000`.

## Data Shape

The frontend expects people in grouped form:

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

Active people should include `role`, `name`, `email`, `info`, `infoSK`, `image`, and `links`. ORCID can be stored as a link with label `ORCID`; OpenAlex sync reads it from there.

The frontend expects each publication to have:

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

`type` is used only for timeline styling. Expected values are mainly `journal` and `conference`; empty string is allowed.

Extra fields such as `doi`, `openalexId`, `sourceType`, `openalexType`, and `matchedAuthors` are kept in the generated snapshot for debugging and future improvements.

## Current Generated State

Last verified state after sync:
- People load from local `data/people-db.json` / `/api/people`.
- ORCID links are present in `data/people-db.json` and exported to `public/data/people.json` for Jaroslav Poruban, Emilia Pietrikova, Matus Sulir, Michaela Bacikova, Filip Gurbal, Tomas Kormanik, and Lenka Bubenkova.
- 9 active people resolved to OpenAlex authors.
- 0 unresolved authors.
- 185 publications generated after filtering and deduplication.
- `npm run lint` passes.
- `npm run build` passes.

Build warnings are existing/non-blocking:
- old Browserslist data warning.
- webpack performance warning for large `src/assets/ema.jpg`.

## Important Behavior

New publications are not pulled on every website page load.

They appear after one of these happens:
- run `npm run sync:publications`,
- click sync in the local dashboard at `http://localhost:5174/`,
- or add a future automation such as GitHub Actions cron.

For static deployment, run sync before build/deploy and commit the updated `public/data/publications.json`.

Analytics are local-only. They are recorded only when the local API server is running. The frontend sends events to `/api/analytics/events`; if that request fails, the site ignores it and continues normally.

Admin content editing is local-only too. People edits update both `data/people-db.json` and `public/data/people.json`. Publication edits update both `data/publications-db.json` and `public/data/publications.json`. Running `npm run sync:publications` can regenerate the publication snapshot from OpenAlex, so manual publication curation should generally happen after syncing.

## Known Limitations

OpenAlex metadata can be imperfect:
- Some venues are missing.
- Some conference proceedings may be classified as journal articles by OpenAlex.
- Author matching is heuristic for people without ORCID, biased toward TUKE via ROR.

If a person is matched incorrectly, edit `data/openalex-authors.json` or improve the matching logic in `server/openalex-sync.js`.
