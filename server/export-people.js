const fs = require("fs/promises");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PEOPLE_DB_PATH = path.join(ROOT_DIR, "data", "people-db.json");
const PEOPLE_SNAPSHOT_PATH = path.join(ROOT_DIR, "public", "data", "people.json");

async function main() {
  const raw = await fs.readFile(PEOPLE_DB_PATH, "utf8");
  const db = JSON.parse(raw);

  if (!db.people || typeof db.people !== "object" || Array.isArray(db.people)) {
    throw new Error(`Invalid people database: ${PEOPLE_DB_PATH}`);
  }

  await fs.mkdir(path.dirname(PEOPLE_SNAPSHOT_PATH), { recursive: true });
  await fs.writeFile(PEOPLE_SNAPSHOT_PATH, `${JSON.stringify(db.people, null, 2)}\n`, "utf8");
  console.log(`People snapshot written: ${PEOPLE_SNAPSHOT_PATH}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
