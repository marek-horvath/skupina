const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { test } = require("node:test");

test("disabled author is removed from cache and their synced works disappear", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "seug-sync-"));
  process.env.SEUG_DATA_DIR = path.join(root, "data");
  process.env.SEUG_PUBLIC_DATA_DIR = path.join(root, "public");
  const { paths, syncPublications } = require("./openalex-sync");
  const write = async (filePath, value) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(value), "utf8");
  };
  const originalFetch = global.fetch;

  try {
    await write(paths.PEOPLE_DB_PATH, {
      people: {
        phdCandidates: [{
          name: "Gabriel Sás",
          role: "PhD Candidate",
          visible: true,
          syncPublications: false
        }]
      }
    });
    await write(paths.AUTHOR_DB_PATH, {
      authors: [{
        key: "gabriel sas",
        openalexId: "https://openalex.org/A5005287610"
      }]
    });
    await write(paths.PUBLICATION_DB_PATH, {
      meta: { deletedPublicationKeys: [] },
      publications: [
        {
          date: "2026",
          title: "Publication by the namesake",
          openalexId: "https://openalex.org/W111",
          matchedAuthors: ["Gabriel Sás"],
          manual: false
        },
        {
          date: "2025",
          title: "Manually added publication",
          openalexId: "https://openalex.org/W222",
          matchedAuthors: [],
          manual: true
        }
      ]
    });
    global.fetch = () => { throw new Error("Disabled author must not be fetched"); };

    const result = await syncPublications();
    const cache = JSON.parse(await fs.readFile(paths.AUTHOR_DB_PATH, "utf8"));
    const snapshot = JSON.parse(await fs.readFile(paths.PUBLICATIONS_PATH, "utf8"));

    assert.equal(result.meta.skippedAuthorCount, 1);
    assert.deepEqual(result.meta.skippedAuthors, ["Gabriel Sás"]);
    assert.deepEqual(cache.authors, []);
    assert.deepEqual(result.publications.map(publication => publication.title), ["Manually added publication"]);
    assert.deepEqual(snapshot, result.publications);
  } finally {
    global.fetch = originalFetch;
    await fs.rm(root, { recursive: true, force: true });
  }
});
