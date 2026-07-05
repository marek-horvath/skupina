# portfolio

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Publications data
People are loaded from the local API when it is running, otherwise from
`public/data/people.json`. Edit the local people database in `data/people-db.json`.

Update the static people snapshot after editing the local database:
```
npm run export:people
```

Publications are loaded from the same local API when it is running, otherwise
from `public/data/publications.json`.

Refresh the local OpenAlex snapshot:
```
npm run sync:publications
```

Run the local publications API/dashboard:
```
npm run serve:api
```

### Local admin analytics
Admin page:
```
http://localhost:8080/admin
```

Default local password:
```
marecek
```

Click analytics are stored locally in `data/analytics-db.json`. The local API
must be running for tracking and admin stats:
```
npm run serve:api
```

The admin also has content editing sections:
- People editor writes `data/people-db.json` and `public/data/people.json`.
- Publications editor writes `data/publications-db.json` and `public/data/publications.json`.

Manual publication edits are local snapshot edits. Running `npm run sync:publications`
can regenerate that snapshot from OpenAlex, so curate publications after a sync.

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
