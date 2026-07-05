const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const indexPath = path.join(distDir, "index.html");
const peoplePath = path.join(rootDir, "public", "data", "people.json");

function slugify(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

function personSlug(person) {
  const name = person && person.name ? person.name : "";
  const lastName = name.split(" ").slice(-1)[0] || name;
  return slugify(lastName);
}

function visibleList(items) {
  return Array.isArray(items) ? items.filter(item => item.visible !== false) : [];
}

function readPeopleSlugs() {
  try {
    const payload = JSON.parse(fs.readFileSync(peoplePath, "utf8"));
    const people = payload.people || payload;
    return [
      ...visibleList(people.professor),
      ...visibleList(people.associateProfessor),
      ...visibleList(people.researchAssistants),
      ...visibleList(people.phdCandidates)
    ]
      .map(personSlug)
      .filter(Boolean);
  } catch (error) {
    console.warn(`Could not create person route fallbacks: ${error.message}`);
    return [];
  }
}

function writeFallback(route, indexHtml) {
  const targetDir = path.join(distDir, route);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(path.join(targetDir, "index.html"), indexHtml);
}

function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error("dist/index.html does not exist. Run the Vue build first.");
  }

  const indexHtml = fs.readFileSync(indexPath, "utf8");
  const routes = new Set([
    "publications",
    "teaching",
    "events",
    "admin",
    ...readPeopleSlugs()
  ]);

  routes.forEach(route => writeFallback(route, indexHtml));
  console.log(`Created ${routes.size} GitHub Pages route fallback(s).`);
}

main();
