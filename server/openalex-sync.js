const fs = require("fs/promises");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const OPENALEX_BASE_URL = "https://api.openalex.org";
const TUKE_ROR = process.env.OPENALEX_INSTITUTION_ROR || "https://ror.org/05xm08015";
const OPENALEX_API_KEY = process.env.OPENALEX_API_KEY || "";
const INCLUDE_PREPRINTS = process.env.OPENALEX_INCLUDE_PREPRINTS === "true";
const MAX_PAGES_PER_AUTHOR = Number(process.env.OPENALEX_MAX_PAGES_PER_AUTHOR || 5);

const DATA_DIR = path.resolve(process.env.SEUG_DATA_DIR || path.join(ROOT_DIR, "data"));
const PUBLIC_DATA_DIR = path.resolve(process.env.SEUG_PUBLIC_DATA_DIR || path.join(ROOT_DIR, "public", "data"));
const PEOPLE_DB_PATH = path.join(DATA_DIR, "people-db.json");
const AUTHOR_DB_PATH = path.join(DATA_DIR, "openalex-authors.json");
const PUBLICATION_DB_PATH = path.join(DATA_DIR, "publications-db.json");
const PEOPLE_PATH = path.join(PUBLIC_DATA_DIR, "people.json");
const PUBLICATIONS_PATH = path.join(PUBLIC_DATA_DIR, "publications.json");
const PUBLICATIONS_META_PATH = path.join(PUBLIC_DATA_DIR, "publications-meta.json");

const ACTIVE_ROLES = new Set([
  "professor",
  "associate professor",
  "research assistant",
  "phd candidate"
]);

const WORK_SELECT_FIELDS = [
  "id",
  "doi",
  "display_name",
  "title",
  "publication_year",
  "publication_date",
  "type",
  "type_crossref",
  "primary_location",
  "authorships",
  "cited_by_count",
  "is_retracted"
].join(",");

const PUBLICATION_EDIT_FIELDS = [
  "date",
  "title",
  "authors",
  "venue",
  "link",
  "type",
  "doi",
  "openalexId"
];

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitle(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeDoi(value) {
  return String(value || "")
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:/i, "")
    .toLowerCase();
}

function doiUrl(value) {
  const doi = normalizeDoi(value);
  return doi ? `https://doi.org/${doi}` : "";
}

function extractOrcid(value) {
  const match = String(value || "").match(/\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i);
  return match ? `https://orcid.org/${match[0].toUpperCase()}` : "";
}

function compactOpenAlexId(value) {
  const match = String(value || "").match(/[AWISCPF]\d+$/i);
  return match ? match[0].toUpperCase() : "";
}

function authorDbKey(person) {
  return normalizeText(person.name);
}

function buildOpenAlexUrl(pathname, params = {}) {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const url = new URL(`${OPENALEX_BASE_URL}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  if (OPENALEX_API_KEY) {
    url.searchParams.set("api_key", OPENALEX_API_KEY);
  }

  return url;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "skupina-publications-sync/1.0"
    }
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`OpenAlex request failed (${response.status}) ${url}: ${body.slice(0, 500)}`);
  }

  return response.json();
}

async function openAlexGet(pathname, params) {
  return fetchJson(buildOpenAlexUrl(pathname, params));
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

function flattenPeople(peoplePayload) {
  const people = peoplePayload && peoplePayload.people ? peoplePayload.people : peoplePayload;
  if (!people || Array.isArray(people)) {
    return Array.isArray(people) ? people : [];
  }

  return [
    ...(people.professor || []),
    ...(people.associateProfessor || []),
    ...(people.researchAssistants || []),
    ...(people.phdCandidates || [])
  ];
}

async function fetchPeople() {
  const peopleDb = await readJson(PEOPLE_DB_PATH, null);
  const fallbackPeople = peopleDb ? null : await readJson(PEOPLE_PATH, null);
  const people = flattenPeople(peopleDb || fallbackPeople);

  if (!people.length) {
    throw new Error(`No local people data found. Expected ${PEOPLE_DB_PATH} or ${PEOPLE_PATH}.`);
  }

  return people
    .filter(person => person.visible !== false)
    .map(person => ({
      name: String(person.name || "").trim(),
      role: String(person.role || "").trim(),
      orcid: extractOrcid(
        person.orcid ||
        (person.links || []).find(link => link.label && link.label.toLowerCase() === "orcid")?.url
      )
    }))
    .filter(person => person.name && ACTIVE_ROLES.has(person.role.toLowerCase()));
}

function emptyAuthorDb() {
  return {
    source: "OpenAlex",
    peopleSource: PEOPLE_DB_PATH,
    institutionRor: TUKE_ROR,
    updatedAt: null,
    authors: []
  };
}

function findCachedAuthor(db, person) {
  const key = authorDbKey(person);
  return (db.authors || []).find(author => author.key === key && author.openalexId);
}

function upsertAuthor(db, person, resolved) {
  const key = authorDbKey(person);
  const authors = db.authors || [];
  const index = authors.findIndex(author => author.key === key);
  const next = {
    key,
    name: person.name,
    role: person.role,
    sourceOrcid: person.orcid || "",
    openalexId: resolved.openalexId || "",
    displayName: resolved.displayName || "",
    openalexOrcid: resolved.openalexOrcid || "",
    worksCount: resolved.worksCount || 0,
    citedByCount: resolved.citedByCount || 0,
    resolution: resolved.resolution || "",
    resolvedAt: nowIso()
  };

  if (index >= 0) {
    authors[index] = next;
  } else {
    authors.push(next);
  }

  db.authors = authors.sort((a, b) => a.name.localeCompare(b.name));
}

function scoreAuthorCandidate(candidate, person) {
  const candidateName = normalizeText(candidate.display_name);
  const personName = normalizeText(person.name);
  const personLastName = normalizeText(person.name.split(/\s+/).slice(-1)[0]);
  const institutions = candidate.last_known_institutions || [];
  const hasTargetInstitution = institutions.some(institution => institution.ror === TUKE_ROR);

  let score = 0;
  if (candidateName === personName) {
    score += 80;
  }
  if (candidateName.includes(personLastName)) {
    score += 25;
  }
  if (hasTargetInstitution) {
    score += 60;
  }
  if (person.orcid && candidate.orcid === person.orcid) {
    score += 100;
  }
  score += Math.min(Number(candidate.works_count || 0), 100) / 10;
  score += Math.min(Number(candidate.cited_by_count || 0), 500) / 100;

  return score;
}

function authorFromOpenAlex(author, resolution) {
  return {
    openalexId: author.id || "",
    displayName: author.display_name || "",
    openalexOrcid: author.orcid || "",
    worksCount: author.works_count || 0,
    citedByCount: author.cited_by_count || 0,
    resolution
  };
}

async function resolveAuthorByOrcid(orcid) {
  if (!orcid) {
    return null;
  }

  const author = await openAlexGet(`/authors/${orcid}`, {
    select: "id,display_name,works_count,cited_by_count,last_known_institutions,orcid"
  });

  return authorFromOpenAlex(author, "orcid");
}

async function resolveAuthorBySearch(person) {
  const commonParams = {
    search: person.name,
    per_page: 10,
    select: "id,display_name,works_count,cited_by_count,last_known_institutions,orcid"
  };
  const withInstitution = await openAlexGet("/authors", {
    ...commonParams,
    filter: `last_known_institutions.ror:${TUKE_ROR}`
  });
  const candidates = withInstitution.results && withInstitution.results.length
    ? withInstitution.results
    : (await openAlexGet("/authors", commonParams)).results || [];

  const best = candidates
    .map(candidate => ({
      candidate,
      score: scoreAuthorCandidate(candidate, person)
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (!best || best.score < 50) {
    return null;
  }

  return authorFromOpenAlex(best.candidate, "search");
}

async function resolveAuthors(people, options = {}) {
  const db = await readJson(AUTHOR_DB_PATH, emptyAuthorDb());
  const resolved = [];
  const unresolved = [];

  for (const person of people) {
    const cached = !options.refreshAuthors && findCachedAuthor(db, person);
    if (cached) {
      resolved.push({
        ...cached,
        name: person.name,
        role: person.role,
        sourceOrcid: person.orcid || cached.sourceOrcid || ""
      });
      continue;
    }

    try {
      const author = person.orcid
        ? await resolveAuthorByOrcid(person.orcid)
        : await resolveAuthorBySearch(person);

      if (author && author.openalexId) {
        upsertAuthor(db, person, author);
        resolved.push({
          key: authorDbKey(person),
          name: person.name,
          role: person.role,
          sourceOrcid: person.orcid,
          ...author
        });
      } else {
        unresolved.push(person);
      }
    } catch (error) {
      unresolved.push({ ...person, error: error.message });
    }
  }

  db.peopleSource = PEOPLE_DB_PATH;
  delete db.peopleCsvUrl;
  db.institutionRor = TUKE_ROR;
  db.updatedAt = nowIso();
  await writeJson(AUTHOR_DB_PATH, db);

  return { resolved, unresolved, authorDb: db };
}

async function fetchWorksForAuthor(author) {
  const authorId = compactOpenAlexId(author.openalexId);
  const works = [];

  if (!authorId) {
    return works;
  }

  for (let page = 1; page <= MAX_PAGES_PER_AUTHOR; page += 1) {
    const payload = await openAlexGet("/works", {
      filter: `authorships.author.id:${authorId},is_retracted:false`,
      sort: "publication_year:desc",
      per_page: 100,
      page,
      select: WORK_SELECT_FIELDS
    });

    const results = payload.results || [];
    works.push(...results.map(work => ({ work, matchedPerson: author.name })));

    if (!results.length || works.length >= Number(payload.meta && payload.meta.count || 0)) {
      break;
    }
  }

  return works;
}

function sourceName(work) {
  return (
    work.primary_location &&
    work.primary_location.source &&
    work.primary_location.source.display_name
  ) || "";
}

function sourceType(work) {
  return normalizeText(
    work.primary_location &&
    work.primary_location.source &&
    work.primary_location.source.type
  );
}

function classifyPublication(work) {
  const primarySourceType = sourceType(work);
  const openAlexType = normalizeText(work.type);
  const crossrefType = normalizeText(work.type_crossref);
  const venue = normalizeText(sourceName(work));
  const conferenceLike = [
    "conference",
    "proceedings",
    "symposium",
    "workshop",
    "lecture notes"
  ].some(token => venue.includes(token) || openAlexType.includes(token) || crossrefType.includes(token));

  if (conferenceLike || primarySourceType.includes("conference")) {
    return "conference";
  }
  if (
    primarySourceType.includes("journal") ||
    crossrefType.includes("journal") ||
    (openAlexType === "article" && primarySourceType !== "repository")
  ) {
    return "journal";
  }

  return "";
}

function publicationLink(work) {
  return doiUrl(work.doi) ||
    (
      work.primary_location &&
      work.primary_location.landing_page_url
    ) ||
    work.id ||
    "";
}

function shouldIncludeWork(work) {
  const type = normalizeText(work.type);
  if (!work || work.is_retracted || !work.publication_year || !(work.display_name || work.title)) {
    return false;
  }
  if (!INCLUDE_PREPRINTS && type === "preprint") {
    return false;
  }
  if (["dataset", "erratum", "editorial", "letter", "other", "paratext", "software"].includes(type)) {
    return false;
  }
  return true;
}

function publicationScore(publication, work) {
  let score = 0;
  if (publication.doi) {
    score += 30;
  }
  if (publication.type === "journal" || publication.type === "conference") {
    score += 20;
  }
  if (normalizeText(work.type) !== "preprint") {
    score += 10;
  }
  if (sourceName(work)) {
    score += 5;
  }
  score += Math.min(Number(work.cited_by_count || 0), 100) / 20;
  return score;
}

function normalizeWork({ work, matchedPerson }) {
  const authors = (work.authorships || [])
    .map(authorship => authorship.author && authorship.author.display_name)
    .filter(Boolean);
  const publication = {
    date: String(work.publication_year || ""),
    title: work.display_name || work.title || "",
    authors: authors.join("; "),
    venue: sourceName(work),
    link: publicationLink(work),
    type: classifyPublication(work),
    doi: normalizeDoi(work.doi),
    openalexId: work.id || "",
    sourceType: sourceType(work),
    openalexType: work.type || "",
    matchedAuthors: matchedPerson ? [matchedPerson] : []
  };
  publication._score = publicationScore(publication, work);
  return publication;
}

function publicationKey(publication) {
  const title = normalizeTitle(publication.title);
  if (title) {
    return `title:${title}:${publication.date}`;
  }
  return publication.doi ? `doi:${publication.doi}` : `openalex:${publication.openalexId}`;
}

function publicationIdentityKey(publication) {
  const openalexId = compactOpenAlexId(publication.openalexId || publication.id);
  if (openalexId) {
    return `openalex:${openalexId}`;
  }

  const doiFromLink = /^https?:\/\/(dx\.)?doi\.org\//i.test(String(publication.link || ""))
    ? normalizeDoi(publication.link)
    : "";
  const doi = normalizeDoi(publication.doi) || doiFromLink;
  if (doi) {
    return `doi:${doi}`;
  }

  const title = normalizeTitle(publication.title);
  const year = String(publication.date || publication.publication_year || "").trim();
  return title && year ? `title:${title}:${year}` : "";
}

function mapPublicationsByIdentity(publications) {
  const map = new Map();
  (publications || []).forEach(publication => {
    const key = publicationIdentityKey(publication);
    if (key && !map.has(key)) {
      map.set(key, publication);
    }
  });
  return map;
}

function sortPublications(publications) {
  return publications.slice().sort((a, b) => {
    const yearDiff = Number(b.date || 0) - Number(a.date || 0);
    return yearDiff || a.title.localeCompare(b.title);
  });
}

function mergeManualPublication(syncedPublication, manualPublication) {
  const merged = {
    ...syncedPublication,
    sourceType: syncedPublication.sourceType || manualPublication.sourceType || "",
    openalexType: syncedPublication.openalexType || manualPublication.openalexType || "",
    matchedAuthors: mergeArray(syncedPublication.matchedAuthors, manualPublication.matchedAuthors),
    manual: true,
    manualEditedAt: manualPublication.manualEditedAt || ""
  };

  PUBLICATION_EDIT_FIELDS.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(manualPublication, field)) {
      merged[field] = manualPublication[field];
    }
  });

  return merged;
}

function mergeSyncedPublicationsWithLocalState(syncedPublications, previousPublications, deletedPublicationKeys) {
  const previousByKey = mapPublicationsByIdentity(previousPublications);
  const deletedKeys = new Set(deletedPublicationKeys || []);
  const syncedKeys = new Set();
  const publications = [];
  const stats = {
    skippedDeletedPublicationCount: 0,
    preservedManualPublicationCount: 0,
    carriedManualPublicationCount: 0
  };

  syncedPublications.forEach(publication => {
    const key = publicationIdentityKey(publication);
    if (key) {
      syncedKeys.add(key);
    }
    if (key && deletedKeys.has(key)) {
      stats.skippedDeletedPublicationCount += 1;
      return;
    }

    const previous = key ? previousByKey.get(key) : null;
    if (previous && previous.manual) {
      publications.push(mergeManualPublication(publication, previous));
      stats.preservedManualPublicationCount += 1;
      return;
    }

    publications.push({
      ...publication,
      manual: false
    });
  });

  (previousPublications || []).forEach(publication => {
    const key = publicationIdentityKey(publication);
    if (!publication.manual || (key && (syncedKeys.has(key) || deletedKeys.has(key)))) {
      return;
    }
    publications.push(publication);
    stats.carriedManualPublicationCount += 1;
  });

  return {
    publications: sortPublications(publications),
    stats
  };
}

function mergeArray(first, second) {
  return Array.from(new Set([...(first || []), ...(second || [])].filter(Boolean)));
}

function upsertPublication(map, nextPublication) {
  const key = publicationKey(nextPublication);
  const current = map.get(key);

  if (!current) {
    map.set(key, nextPublication);
    return;
  }

  const mergedMatchedAuthors = mergeArray(current.matchedAuthors, nextPublication.matchedAuthors);
  const winner = nextPublication._score > current._score ? nextPublication : current;
  const fallback = winner === nextPublication ? current : nextPublication;

  map.set(key, {
    ...winner,
    authors: winner.authors || fallback.authors,
    venue: winner.venue || fallback.venue,
    link: winner.link || fallback.link,
    type: winner.type || fallback.type,
    matchedAuthors: mergedMatchedAuthors
  });
}

function normalizeAndDedupeWorks(rawWorks) {
  const publications = new Map();

  rawWorks
    .filter(({ work }) => shouldIncludeWork(work))
    .map(normalizeWork)
    .forEach(publication => upsertPublication(publications, publication));

  return sortPublications(Array.from(publications.values())
    .map(publication => {
      const { _score, ...cleanPublication } = publication;
      return {
        ...cleanPublication,
        matchedAuthors: mergeArray(publication.matchedAuthors)
      };
    }));
}

async function syncPublications(options = {}) {
  const startedAt = nowIso();
  const previousDb = await readJson(PUBLICATION_DB_PATH, {});
  const previousPublications = Array.isArray(previousDb.publications)
    ? previousDb.publications
    : await readJson(PUBLICATIONS_PATH, []);
  const deletedPublicationKeys = Array.isArray(previousDb.meta && previousDb.meta.deletedPublicationKeys)
    ? previousDb.meta.deletedPublicationKeys
    : [];
  const people = await fetchPeople();
  const { resolved, unresolved } = await resolveAuthors(people, options);
  const rawWorks = [];

  for (const author of resolved) {
    const works = await fetchWorksForAuthor(author);
    rawWorks.push(...works);
  }

  const syncedPublications = normalizeAndDedupeWorks(rawWorks);
  const merged = mergeSyncedPublicationsWithLocalState(
    syncedPublications,
    previousPublications,
    deletedPublicationKeys
  );
  const publications = merged.publications;
  const syncSummary = {
    generatedAt: nowIso(),
    startedAt,
    peopleCount: people.length,
    resolvedAuthorCount: resolved.length,
    unresolvedAuthorCount: unresolved.length,
    rawWorkCount: rawWorks.length,
    syncedPublicationCount: syncedPublications.length,
    publicationCount: publications.length,
    manualPublicationCount: publications.filter(publication => publication.manual).length,
    skippedDeletedPublicationCount: merged.stats.skippedDeletedPublicationCount,
    preservedManualPublicationCount: merged.stats.preservedManualPublicationCount,
    carriedManualPublicationCount: merged.stats.carriedManualPublicationCount,
    deletedPublicationKeyCount: deletedPublicationKeys.length
  };
  const syncHistory = [
    syncSummary,
    ...(
      Array.isArray(previousDb.meta && previousDb.meta.syncHistory)
        ? previousDb.meta.syncHistory
        : []
    )
  ].slice(0, 10);

  const meta = {
    source: "OpenAlex",
    generatedAt: syncSummary.generatedAt,
    startedAt,
    peopleSource: PEOPLE_DB_PATH,
    institutionRor: TUKE_ROR,
    usedApiKey: Boolean(OPENALEX_API_KEY),
    includePreprints: INCLUDE_PREPRINTS,
    peopleCount: people.length,
    resolvedAuthorCount: resolved.length,
    unresolvedAuthorCount: unresolved.length,
    rawWorkCount: rawWorks.length,
    syncedPublicationCount: syncedPublications.length,
    publicationCount: publications.length,
    manualPublicationCount: publications.filter(publication => publication.manual).length,
    deletedPublicationKeys,
    deletedPublicationKeyCount: deletedPublicationKeys.length,
    localEditedAt: previousDb.meta && previousDb.meta.localEditedAt ? previousDb.meta.localEditedAt : "",
    syncHistory,
    ...merged.stats,
    resolvedAuthors: resolved.map(author => ({
      name: author.name,
      displayName: author.displayName,
      openalexId: author.openalexId,
      orcid: author.openalexOrcid || author.sourceOrcid || "",
      resolution: author.resolution
    })),
    unresolvedAuthors: unresolved.map(author => ({
      name: author.name,
      role: author.role,
      orcid: author.orcid || "",
      error: author.error || ""
    }))
  };

  await writeJson(PUBLICATION_DB_PATH, { meta, publications });
  await writeJson(PUBLICATIONS_PATH, publications);
  await writeJson(PUBLICATIONS_META_PATH, meta);

  return { meta, publications };
}

async function runCli() {
  const refreshAuthors = process.argv.includes("--refresh-authors");

  if (!OPENALEX_API_KEY) {
    console.log("OPENALEX_API_KEY is not set; using the unauthenticated OpenAlex trial budget.");
  }

  const result = await syncPublications({ refreshAuthors });
  console.log(`Resolved authors: ${result.meta.resolvedAuthorCount}/${result.meta.peopleCount}`);
  console.log(`Raw OpenAlex works: ${result.meta.rawWorkCount}`);
  console.log(`Publications written: ${result.meta.publicationCount}`);
  console.log(`Snapshot: ${PUBLICATIONS_PATH}`);

  if (result.meta.unresolvedAuthors.length) {
    console.log("Unresolved authors:");
    result.meta.unresolvedAuthors.forEach(author => {
      console.log(`- ${author.name}${author.error ? ` (${author.error})` : ""}`);
    });
  }
}

if (require.main === module) {
  runCli().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  paths: {
    DATA_DIR,
    PUBLIC_DATA_DIR,
    PEOPLE_DB_PATH,
    PEOPLE_PATH,
    AUTHOR_DB_PATH,
    PUBLICATION_DB_PATH,
    PUBLICATIONS_PATH,
    PUBLICATIONS_META_PATH
  },
  publicationIdentityKey,
  syncPublications
};
