const fs = require("fs/promises");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const { paths, syncPublications } = require("./openalex-sync");

const PORT = Number(process.env.PUBLICATIONS_API_PORT || 5174);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "marecek";
const ANALYTICS_DB_PATH = path.resolve(__dirname, "..", "data", "analytics-db.json");
const MAX_ANALYTICS_EVENTS = Number(process.env.ANALYTICS_MAX_EVENTS || 20000);
const PEOPLE_GROUP_KEYS = [
  "professor",
  "associateProfessor",
  "researchAssistants",
  "phdCandidates",
  "exMembers",
  "students"
];
let activeSync = null;

function countPeople(people) {
  if (!people) {
    return 0;
  }
  return [
    ...(people.professor || []),
    ...(people.associateProfessor || []),
    ...(people.researchAssistants || []),
    ...(people.phdCandidates || [])
  ].length;
}

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function readJsonBody(request) {
  const raw = await readBody(request);
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

function setCommonHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
  response.setHeader("Cache-Control", "no-store");
}

function sendJson(response, statusCode, payload) {
  setCommonHeaders(response);
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function sendHtml(response, statusCode, html) {
  setCommonHeaders(response);
  response.writeHead(statusCode, { "content-type": "text/html; charset=utf-8" });
  response.end(html);
}

function sendError(response, statusCode, message) {
  sendJson(response, statusCode, { error: message });
}

function normalizePeopleGroups(people) {
  const groups = {};
  PEOPLE_GROUP_KEYS.forEach(key => {
    groups[key] = Array.isArray(people && people[key]) ? people[key] : [];
  });
  return groups;
}

function normalizeLinks(links) {
  if (!Array.isArray(links)) {
    return [];
  }
  return links
    .map(link => ({
      label: cleanText(link.label, 80),
      url: cleanText(link.url, 1000)
    }))
    .filter(link => link.label && link.url);
}

function normalizePeopleForSave(people) {
  const groups = normalizePeopleGroups(people);
  PEOPLE_GROUP_KEYS.forEach(key => {
    groups[key] = groups[key]
      .map(person => ({
        role: cleanText(person.role, 120),
        name: cleanText(person.name, 200),
        email: cleanText(person.email, 240),
        info: cleanText(person.info, 2000),
        infoSK: cleanText(person.infoSK, 2000),
        image: cleanText(person.image, 240),
        links: normalizeLinks(person.links)
      }))
      .filter(person => person.name || key === "exMembers" || key === "students");
  });
  return groups;
}

function normalizePublicationForSave(publication) {
  return {
    date: cleanText(publication.date, 16),
    title: cleanText(publication.title, 1000),
    authors: cleanText(publication.authors, 3000),
    venue: cleanText(publication.venue, 1200),
    link: cleanText(publication.link, 1000),
    type: cleanText(publication.type, 40),
    doi: cleanText(publication.doi, 300),
    openalexId: cleanText(publication.openalexId, 300),
    sourceType: cleanText(publication.sourceType, 80),
    openalexType: cleanText(publication.openalexType, 80),
    matchedAuthors: Array.isArray(publication.matchedAuthors)
      ? publication.matchedAuthors.map(author => cleanText(author, 200)).filter(Boolean)
      : [],
    manual: Boolean(publication.manual)
  };
}

function normalizePublicationsForSave(publications) {
  if (!Array.isArray(publications)) {
    throw new Error("Publications payload must be an array.");
  }
  return publications
    .map(normalizePublicationForSave)
    .filter(publication => publication.date && publication.title)
    .sort((a, b) => {
      const yearDiff = Number(b.date || 0) - Number(a.date || 0);
      return yearDiff || a.title.localeCompare(b.title);
    });
}

async function readPeopleData() {
  const peopleDb = await readJson(paths.PEOPLE_DB_PATH, null);
  const people = peopleDb && peopleDb.people ? peopleDb.people : await readJson(paths.PEOPLE_PATH, {});
  return normalizePeopleGroups(people);
}

async function savePeopleData(people) {
  const normalized = normalizePeopleForSave(people);
  const previous = await readJson(paths.PEOPLE_DB_PATH, {});
  const now = new Date().toISOString();
  const nextDb = {
    meta: {
      ...(previous.meta || {}),
      source: "local",
      updatedAt: now
    },
    people: normalized
  };
  await writeJson(paths.PEOPLE_DB_PATH, nextDb);
  await writeJson(paths.PEOPLE_PATH, normalized);
  return normalized;
}

async function readPublicationsData() {
  return readJson(paths.PUBLICATIONS_PATH, []);
}

async function savePublicationsData(publications) {
  const normalized = normalizePublicationsForSave(publications);
  const now = new Date().toISOString();
  const previousDb = await readJson(paths.PUBLICATION_DB_PATH, {});
  const previousMeta = await readJson(paths.PUBLICATIONS_META_PATH, {});
  const meta = {
    ...(previousDb.meta || previousMeta || {}),
    source: (previousDb.meta && previousDb.meta.source) || previousMeta.source || "local",
    localEditedAt: now,
    publicationCount: normalized.length
  };

  await writeJson(paths.PUBLICATIONS_PATH, normalized);
  await writeJson(paths.PUBLICATION_DB_PATH, { meta, publications: normalized });
  await writeJson(paths.PUBLICATIONS_META_PATH, meta);
  return normalized;
}

function emptyAnalyticsDb() {
  const now = new Date().toISOString();
  return {
    meta: {
      source: "local",
      createdAt: now,
      updatedAt: now
    },
    events: []
  };
}

function cleanText(value, maxLength = 300) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeAnalyticsEvent(payload, request) {
  const now = new Date();
  const metadata = payload && payload.metadata && typeof payload.metadata === "object"
    ? Object.fromEntries(
      Object.entries(payload.metadata)
        .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
        .map(([key, value]) => [cleanText(key, 60), typeof value === "string" ? cleanText(value, 300) : value])
    )
    : {};

  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now.toISOString(),
    action: cleanText(payload.action, 80) || "unknown",
    label: cleanText(payload.label, 200),
    language: cleanText(payload.language, 12),
    target: cleanText(payload.target, 500),
    path: cleanText(payload.path, 300),
    metadata,
    userAgent: cleanText(request.headers["user-agent"], 300),
    ip: cleanText(request.socket.remoteAddress, 80)
  };
}

async function appendAnalyticsEvent(payload, request) {
  const db = await readJson(ANALYTICS_DB_PATH, emptyAnalyticsDb());
  db.events = Array.isArray(db.events) ? db.events : [];
  db.events.push(normalizeAnalyticsEvent(payload, request));
  if (db.events.length > MAX_ANALYTICS_EVENTS) {
    db.events = db.events.slice(db.events.length - MAX_ANALYTICS_EVENTS);
  }
  db.meta = db.meta || {};
  db.meta.updatedAt = new Date().toISOString();
  db.meta.totalEvents = db.events.length;
  await writeJson(ANALYTICS_DB_PATH, db);
  return db.events[db.events.length - 1];
}

function isAuthorized(request, url, body = {}) {
  const provided =
    request.headers["x-admin-password"] ||
    url.searchParams.get("password") ||
    body.password ||
    "";
  return provided === ADMIN_PASSWORD;
}

function localDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDayLabel(dayKey) {
  const [, month, day] = dayKey.split("-");
  return `${day}. ${month}.`;
}

function increment(map, key) {
  if (!key) {
    return;
  }
  map.set(key, (map.get(key) || 0) + 1);
}

function topCounts(map, limit = 12) {
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function buildAnalyticsSummary(db) {
  const events = Array.isArray(db.events) ? db.events : [];
  const now = Date.now();
  const dayCounts = new Map();
  const actionCounts = new Map();
  const personCounts = new Map();
  const publicationCounts = new Map();
  const tabCounts = new Map();
  const linkCounts = new Map();
  const languageCounts = new Map();
  let last24h = 0;
  let last7d = 0;

  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dayCounts.set(localDayKey(date), 0);
  }

  events.forEach(event => {
    const time = new Date(event.timestamp).getTime();
    if (Number.isFinite(time)) {
      const diff = now - time;
      if (diff <= 24 * 60 * 60 * 1000) {
        last24h += 1;
      }
      if (diff <= 7 * 24 * 60 * 60 * 1000) {
        last7d += 1;
      }
      const dayKey = localDayKey(new Date(time));
      if (dayCounts.has(dayKey)) {
        dayCounts.set(dayKey, dayCounts.get(dayKey) + 1);
      }
    }

    increment(actionCounts, event.action);
    if (event.action === "person_open") {
      increment(personCounts, event.label);
    }
    if (event.action === "publication_open") {
      increment(publicationCounts, event.label);
    }
    if (event.action === "tab_select") {
      increment(tabCounts, event.label);
    }
    if (["person_link_open", "person_detail_link_open", "email_copy"].includes(event.action)) {
      increment(linkCounts, event.metadata && event.metadata.linkType ? event.metadata.linkType : event.action);
    }
    if (event.action === "language_switch") {
      increment(languageCounts, event.label || event.language);
    }
  });

  const dateSeries = Array.from(dayCounts.entries()).map(([date, count]) => ({
    date,
    label: formatDayLabel(date),
    count
  }));
  const maxDaily = dateSeries.reduce((max, item) => Math.max(max, item.count), 0);

  return {
    generatedAt: new Date().toISOString(),
    totalEvents: events.length,
    last24h,
    last7d,
    maxDaily,
    dateSeries,
    actionCounts: topCounts(actionCounts, 20),
    personCounts: topCounts(personCounts, 20),
    publicationCounts: topCounts(publicationCounts, 10),
    tabCounts: topCounts(tabCounts, 20),
    linkCounts: topCounts(linkCounts, 20),
    languageCounts: topCounts(languageCounts, 10),
    recentEvents: events
      .slice()
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50)
  };
}

async function dashboardHtml() {
  const meta = await readJson(paths.PUBLICATIONS_META_PATH, null);
  const peopleDb = await readJson(paths.PEOPLE_DB_PATH, null);
  const generatedAt = meta && meta.generatedAt ? meta.generatedAt : "not generated yet";
  const publicationCount = meta && Number.isFinite(meta.publicationCount) ? meta.publicationCount : 0;
  const unresolvedAuthors = meta && meta.unresolvedAuthors ? meta.unresolvedAuthors : [];
  const people = peopleDb && peopleDb.people ? peopleDb.people : await readJson(paths.PEOPLE_PATH, {});
  const peopleCount = countPeople(people);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Local Data API</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 40px; color: #0f172a; background: #f8fafc; }
    main { max-width: 760px; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; }
    button { border: 0; border-radius: 6px; padding: 10px 14px; background: #0f766e; color: #fff; cursor: pointer; font-weight: 700; }
    button:disabled { opacity: 0.65; cursor: wait; }
    code, pre { background: #f1f5f9; border-radius: 6px; padding: 2px 5px; }
    pre { padding: 12px; overflow: auto; }
  </style>
</head>
<body>
  <main>
    <h1>Local Data API</h1>
    <p><strong>People:</strong> ${peopleCount}</p>
    <p><strong>Publications:</strong> ${publicationCount}</p>
    <p><strong>Last sync:</strong> ${generatedAt}</p>
    <p><strong>Unresolved authors:</strong> ${unresolvedAuthors.length}</p>
    <button id="sync">Sync from OpenAlex</button>
    <pre id="result">GET /api/people
GET /api/people/meta
GET /api/publications
GET /api/publications/meta
POST /api/analytics/events
POST /api/analytics/summary
POST /api/admin/content
POST /api/admin/people/save
POST /api/admin/publications/save
POST /api/publications/sync</pre>
  </main>
  <script>
    const button = document.getElementById("sync");
    const result = document.getElementById("result");
    button.addEventListener("click", async () => {
      button.disabled = true;
      result.textContent = "Syncing from OpenAlex...";
      try {
        const response = await fetch("/api/publications/sync", { method: "POST" });
        const json = await response.json();
        result.textContent = JSON.stringify(json, null, 2);
      } catch (error) {
        result.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}

async function handleRequest(request, response) {
  setCommonHeaders(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);

  try {
    if (request.method === "GET" && url.pathname === "/") {
      sendHtml(response, 200, await dashboardHtml());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/people") {
      sendJson(response, 200, await readPeopleData());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/people/meta") {
      const peopleDb = await readJson(paths.PEOPLE_DB_PATH, null);
      sendJson(response, 200, peopleDb && peopleDb.meta ? peopleDb.meta : {});
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/publications") {
      sendJson(response, 200, await readPublicationsData());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/publications/meta") {
      const meta = await readJson(paths.PUBLICATIONS_META_PATH, {});
      sendJson(response, 200, meta);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/analytics/events") {
      const payload = await readJsonBody(request);
      const event = await appendAnalyticsEvent(payload, request);
      sendJson(response, 201, { ok: true, event });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/content") {
      const body = await readJsonBody(request);
      if (!isAuthorized(request, url, body)) {
        sendError(response, 401, "Unauthorized");
        return;
      }
      sendJson(response, 200, {
        people: await readPeopleData(),
        publications: await readPublicationsData()
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/people/save") {
      const body = await readJsonBody(request);
      if (!isAuthorized(request, url, body)) {
        sendError(response, 401, "Unauthorized");
        return;
      }
      const people = await savePeopleData(body.people || {});
      sendJson(response, 200, { ok: true, people });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/admin/publications/save") {
      const body = await readJsonBody(request);
      if (!isAuthorized(request, url, body)) {
        sendError(response, 401, "Unauthorized");
        return;
      }
      const publications = await savePublicationsData(body.publications || []);
      sendJson(response, 200, { ok: true, publications });
      return;
    }

    if (
      (request.method === "GET" || request.method === "POST") &&
      url.pathname === "/api/analytics/summary"
    ) {
      const body = request.method === "POST" ? await readJsonBody(request) : {};
      if (!isAuthorized(request, url, body)) {
        sendError(response, 401, "Unauthorized");
        return;
      }

      const db = await readJson(ANALYTICS_DB_PATH, emptyAnalyticsDb());
      sendJson(response, 200, buildAnalyticsSummary(db));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/publications/sync") {
      if (activeSync) {
        sendError(response, 409, "A publication sync is already running.");
        return;
      }

      activeSync = syncPublications({
        refreshAuthors: url.searchParams.get("refreshAuthors") === "true"
      });

      try {
        const result = await activeSync;
        sendJson(response, 200, result);
      } finally {
        activeSync = null;
      }
      return;
    }

    sendError(response, 404, "Not found");
  } catch (error) {
    sendError(response, 500, error.message);
  }
}

const server = http.createServer((request, response) => {
  handleRequest(request, response);
});

server.listen(PORT, () => {
  console.log(`Local data API listening on http://localhost:${PORT}`);
});
