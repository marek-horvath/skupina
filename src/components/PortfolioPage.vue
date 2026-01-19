<template>
  <div class="portfolio-wrapper">
    <!-- Background particles -->
    <div id="particles-js"></div>

    <!-- Main content area -->
    <div class="portfolio-content">
      <!-- Header with fade effect -->
      <header class="header">
        <div class="container">
          <div class="eyebrow">Research Group</div>
          <h1 class="group-title">{{ group.name }}</h1>
          <p class="group-desc">{{ group.description }}</p>
          <div class="stats">
            <div class="stat">
              <span class="stat-value">{{ totalPeople }}</span>
              <span class="stat-label">People</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ totalPublications }}</span>
              <span class="stat-label">Publications</span>
            </div>
          </div>
          <div class="affiliation">
            <div class="logos">
              <img :src="getImage('tuke-logo.png')" alt="TUKE Logo" class="logo" />
              <img :src="getImage('kpi-logo.png')" alt="KPI TUKE Logo" class="logo" />
            </div>
            <p class="affiliation-text">
              Technical University of Kosice · Faculty of Electrical Engineering and Informatics
            </p>
          </div>
        </div>
      </header>

      <!-- Tabs for switching between People, Publications, and Teaching -->
      <TabNav v-model="tabModel" :tabs="tabs" />

      <!-- Main content (People or Publications) -->
      <div class="container content">
        <div v-if="selectedPerson" class="person-detail">
          <div class="person-hero">
            <img
              :src="getImage(selectedPerson.image)"
              alt="Profile Picture"
              class="person-photo"
            />
            <div class="person-meta">
              <div class="person-name-row">
                <h2>{{ selectedPerson.name }}</h2>
                <a
                  v-if="personLinkedin(selectedPerson)"
                  :href="personLinkedin(selectedPerson)"
                  target="_blank"
                  class="person-linkedin"
                  aria-label="LinkedIn profile"
                >
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                    alt="LinkedIn"
                    class="linkedin-logo"
                  />
                </a>
              </div>
              <p class="person-email">{{ selectedPerson.email }}</p>
              <p class="person-info">{{ selectedPerson.info }}</p>
            </div>
          </div>

          <div class="person-publications">
            <h2>Publications</h2>
            <div v-if="groupedSelectedPublications.length" class="person-timeline">
              <div class="year-group" v-for="group in groupedSelectedPublications" :key="group.year">
                <div class="year-label">{{ group.year }}</div>
                <div class="person-timeline-item" v-for="(pub, index) in group.items" :key="index" :style="{ '--i': index }">
                  <div class="person-timeline-connector"></div>
                  <div class="person-timeline-content">
                    <small class="pub-authors">{{ pub.authors }}</small>
                    <div class="pub-title">{{ pub.title }}</div>
                    <small class="pub-venue">
                      <a :href="pub.link" target="_blank">{{ pub.venue }}</a>
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="person-empty">No publications found for this author yet.</p>
          </div>
        </div>
        <template v-else>
          <PeopleTab
            v-if="activeTab === 'people'"
            :people="people"
            :getImage="getImage"
            @select="openPerson"
          />
          <PublicationsTab v-else-if="activeTab === 'publications'" :groupedPublications="groupedPublications" />
          <TeachingTab v-else-if="activeTab === 'teaching'" :subjects="teachingSubjects" />
        </template>
      </div> <!-- .content -->

      <!-- Footer with logos -->
      <footer class="footer">
        <div class="footer-content">
          <div class="logos">
            <img :src="getImage('tuke-logo.png')" alt="TÚ KE Logo" class="logo" />
            <img :src="getImage('kpi-logo.png')" alt="KPI TÚ Logo" class="logo" />
          </div>
          <p class="footer-text">
            We are part of the Technical University of Košice and the Faculty of Electrical Engineering and Informatics.
          </p>
        </div>
      </footer>
    </div> <!-- .portfolio-content -->
  </div> <!-- .portfolio-wrapper -->
</template>

<script>
import Papa from "papaparse";
import TabNav from "./TabNav.vue";
import PeopleTab from "./PeopleTab.vue";
import PublicationsTab from "./PublicationsTab.vue";
import TeachingTab from "./TeachingTab.vue";
/* global particlesJS */
export default {
  name: "ResearchGroup",
  components: {
    TabNav,
    PeopleTab,
    PublicationsTab,
    TeachingTab
  },
  data() {
    return {
      activeTab: "people",
      tabs: [
        { id: "people", label: "People" },
        { id: "publications", label: "Publications" },
        { id: "teaching", label: "Teaching" }
      ],
      group: {
        name: "Software Engineering and Usability Group",
        description: `We focus on the interaction between humans and computers in two dimensions:
- Software creation by humans (Software Engineering)
- Software usage by humans (Usability)`
      },
      // People and publications budú načítané dynamicky z CSV endpointov.
      people: {
        professor: [],
        associateProfessor: [],
        researchAssistants: [],
        phdCandidates: []
      },
      teachingSubjects: [],
      publications: [],
      currentSlug: "",
      suppressRouteSync: false
    };
  },
  watch: {
    activeTab() {
      if (this.suppressRouteSync || this.selectedPerson) {
        return;
      }
      const nextPath = this.activeTab === "people" ? "/" : `/${this.activeTab}`;
      window.history.pushState({}, "", nextPath);
      this.$nextTick(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }
  },
  computed: {
    groupedPublications() {
      const groups = {};
      this.publications.forEach(pub => {
        if (!groups[pub.date]) {
          groups[pub.date] = [];
        }
        groups[pub.date].push(pub);
      });
      return Object.keys(groups)
        .sort((a, b) => b - a)
        .map(year => ({ year, items: groups[year] }));
    },
    totalPeople() {
      return (
        this.people.professor.length +
        this.people.associateProfessor.length +
        this.people.researchAssistants.length +
        this.people.phdCandidates.length
      );
    },
    totalPublications() {
      return this.publications.length;
    },
    allPeople() {
      return [
        ...this.people.professor,
        ...this.people.associateProfessor,
        ...this.people.researchAssistants,
        ...this.people.phdCandidates
      ];
    },
    selectedPerson() {
      if (!this.currentSlug) {
        return null;
      }
      return this.allPeople.find(person => this.personSlug(person) === this.currentSlug) || null;
    },
    groupedSelectedPublications() {
      if (!this.selectedPerson) {
        return [];
      }
      const matching = this.publications.filter(pub => this.isAuthorMatch(pub, this.selectedPerson));
      const groups = {};
      matching.forEach(pub => {
        if (!groups[pub.date]) {
          groups[pub.date] = [];
        }
        groups[pub.date].push(pub);
      });
      return Object.keys(groups)
        .sort((a, b) => b - a)
        .map(year => ({ year, items: groups[year] }));
    },
    tabModel: {
      get() {
        return this.selectedPerson ? "" : this.activeTab;
      },
      set(value) {
        this.currentSlug = "";
        this.activeTab = value || "people";
      }
    }
  },
  methods: {
    getImage(filename) {
      return require(`../assets/${filename}`);
    },
    setRouteFromPath() {
      const part = window.location.pathname.replace(/^\/+/, "").split("/")[0];
      this.suppressRouteSync = true;
      if (part === "publications") {
        this.currentSlug = "";
        this.activeTab = "publications";
      } else if (part === "teaching") {
        this.currentSlug = "";
        this.activeTab = "teaching";
      } else if (part) {
        this.currentSlug = part;
      } else {
        this.currentSlug = "";
        this.activeTab = "people";
      }
      this.$nextTick(() => {
        this.suppressRouteSync = false;
      });
    },
    slugify(value) {
      return value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .trim();
    },
    normalizeText(value) {
      return value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    },
    personSlug(person) {
      const lastName = person.name.split(" ").slice(-1)[0] || person.name;
      return this.slugify(lastName);
    },
    personLinkedin(person) {
      if (!person.links || !person.links.length) {
        return "";
      }
      const link = person.links.find(item => item.label && item.label.toLowerCase() === "linkedin");
      return link ? link.url : "";
    },
    isAuthorMatch(pub, person) {
      const authors = this.normalizeText(pub.authors || "");
      const fullName = this.normalizeText(person.name);
      const lastName = this.normalizeText(person.name.split(" ").slice(-1)[0]);
      return authors.includes(fullName) || authors.includes(lastName);
    },
    openPerson(person) {
      const slug = this.personSlug(person);
      window.history.pushState({}, "", `/${slug}`);
      this.currentSlug = slug;
    },
    closePerson() {
      window.history.pushState({}, "", "/");
      this.currentSlug = "";
      this.activeTab = "people";
    }
  },
  mounted() {
    this.setRouteFromPath();
    window.addEventListener("popstate", this.setRouteFromPath);
    // Načítanie particles s pôvodnou konfiguráciou
    const particlesConfig = `${process.env.BASE_URL || "/"}particles-config.json`;
    particlesJS.load("particles-js", particlesConfig, () => {
      console.log("Particles.js loaded!");
    });

    const peopleCSVUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0yU5qib1xjuPlctizfGQFSpPsQ_TLgWFA59b7b3oFPxITDT8j3cV04p_O3yJtBKOBZa6ZarzRsKLi/pub?gid=1186507161&single=true&output=csv";
    const publicationsCSVUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0yU5qib1xjuPlctizfGQFSpPsQ_TLgWFA59b7b3oFPxITDT8j3cV04p_O3yJtBKOBZa6ZarzRsKLi/pub?output=csv";
    const teachingCSVUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0yU5qib1xjuPlctizfGQFSpPsQ_TLgWFA59b7b3oFPxITDT8j3cV04p_O3yJtBKOBZa6ZarzRsKLi/pub?gid=1202110167&single=true&output=csv";

    Promise.all([
      fetch(peopleCSVUrl).then(response => response.text()),
      fetch(publicationsCSVUrl).then(response => response.text()),
      fetch(teachingCSVUrl).then(response => response.text())
    ])
      .then(([peopleCsvText, publicationsCsvText, teachingCsvText]) => {
        // Spracovanie CSV pre ľudí
        const parsedPeople = Papa.parse(peopleCsvText, { header: true, skipEmptyLines: true });
        const peopleObj = {
          professor: [],
          associateProfessor: [],
          researchAssistants: [],
          phdCandidates: []
        };
        parsedPeople.data.forEach(row => {
          const role = row.role.trim().toLowerCase();
          const person = {
            name: row.name,
            email: row.email,
            info: row.info,
            image: row.image, // napr. "jaro.jpg"
            links: []
          };
          if (row.profile) {
            person.links.push({ label: "Profile", url: row.profile });
          }
          if (row.linkedin) {
            person.links.push({ label: "LinkedIn", url: row.linkedin });
          }
          if (row.github) {
            person.links.push({ label: "GitHub", url: row.github });
          }
          if (role === "professor") {
            peopleObj.professor.push(person);
          } else if (role === "associate professor") {
            peopleObj.associateProfessor.push(person);
          } else if (role === "research assistant") {
            peopleObj.researchAssistants.push(person);
          } else if (role === "phd candidate") {
            peopleObj.phdCandidates.push(person);
          }
        });
        this.people = peopleObj;

        // Spracovanie CSV pre publikácie
        const parsedPublications = Papa.parse(publicationsCsvText, { header: true, skipEmptyLines: true });
        this.publications = parsedPublications.data.filter(row => row.date && row.title);

        const parsedTeaching = Papa.parse(teachingCsvText, { header: true, skipEmptyLines: true });
        this.teachingSubjects = parsedTeaching.data
          .filter(row => row.Name)
          .map(row => ({
            name: row.Name,
            description: row.Description || "",
            link: row.Link || ""
          }));

        // Po načítaní dát vyvoláme resize event pre opravu renderovania particles
        this.$nextTick(() => {
          window.dispatchEvent(new Event("resize"));
        });
      })
      .catch(error => console.error("Error loading CSV data:", error));
  },
  beforeUnmount() {
    window.removeEventListener("popstate", this.setRouteFromPath);
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Space+Grotesk:wght@400;500;600;700&display=swap");

:global(:root) {
  --ink: #0f172a;
  --muted: #4b5563;
  --accent: #f15a29;
  --accent-2: #0f766e;
  --accent-3: #f59e0b;
  --paper: #ffffff;
  --mist: #f6f3ee;
  --line: rgba(15, 23, 42, 0.12);
  --shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
}

:global(body) {
  background: var(--mist);
  color: var(--ink);
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
}

:global(*) {
  box-sizing: border-box;
}

/* Reset */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* Portfolio wrapper: allow content to grow */
.portfolio-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  min-height: 100vh;
  width: 100%;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(241, 90, 41, 0.15), transparent 60%),
    radial-gradient(900px 600px at 90% 10%, rgba(15, 118, 110, 0.16), transparent 55%),
    linear-gradient(180deg, #fbf7f1 0%, #eef5f4 100%);
  overflow: hidden;
  z-index: 0;
}

.portfolio-wrapper::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: linear-gradient(120deg, rgba(15, 23, 42, 0.04) 0%, transparent 60%);
  opacity: 0.8;
  pointer-events: none;
  z-index: 0;
}


/* Particles background */
#particles-js {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  opacity: 0.8;
  pointer-events: none;
}

/* Main content area (white frame) */
.portfolio-content {
  width: min(92%, 1020px);
  background-color: var(--paper);
  padding: 16px 20px 24px;
  box-shadow: var(--shadow);
  position: relative;
  z-index: 1;
  margin: 20px auto 32px;
  border-radius: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
}

.container {
  width: 100%;
  max-width: 980px;
  margin: 0 auto;
}

/* Header with fade effect and brand colors */
.header {
  background:
    linear-gradient(135deg, rgba(15, 118, 110, 0.96), rgba(15, 23, 42, 0.92)),
    radial-gradient(400px 200px at 20% 20%, rgba(245, 158, 11, 0.35), transparent 60%);
  color: #f8fafc;
  padding: 20px 20px;
  text-align: center;
  border-radius: 18px;
  animation: fadeIn 1s ease-out;
}
.header .container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  align-items: center;
}
.eyebrow {
  font-size: 0.85em;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(248, 250, 252, 0.75);
}
.header .group-title {
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-family: "Fraunces", "Times New Roman", serif;
  font-weight: 700;
  margin-bottom: 0;
  text-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);
}
.group-desc {
  font-size: 0.95rem;
  max-width: 560px;
  margin: 0 auto;
  white-space: pre-line;
  line-height: 1.5;
  opacity: 0.92;
}
.stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}
.stat {
  background: rgba(248, 250, 252, 0.1);
  border: 1px solid rgba(248, 250, 252, 0.2);
  border-radius: 14px;
  padding: 8px 12px;
  min-width: 120px;
  backdrop-filter: blur(6px);
}
.stat-value {
  display: block;
  font-size: 1.3rem;
  font-weight: 700;
}
.stat-label {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(248, 250, 252, 0.7);
}

.affiliation {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 2px;
  justify-content: center;
}
.affiliation .logos {
  display: flex;
  gap: 10px;
  align-items: center;
}
.affiliation .logo {
  width: 48px;
  height: auto;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
.affiliation-text {
  font-size: 0.82rem;
  color: rgba(248, 250, 252, 0.72);
  max-width: 340px;
  text-align: center;
}

/* Fade animation */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Tabs styling */
/* Content area within frame */
.content {
  background: #ffffff;
  margin-top: 20px;
  padding: 22px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  position: relative;
  z-index: 1;
}

.person-detail {
  display: grid;
  gap: 24px;
}

.person-publications {
  display: grid;
  gap: 12px;
}

.person-timeline {
  position: relative;
  margin: 0 auto;
  max-width: 800px;
  padding-left: 40px;
}

.person-timeline::before {
  content: "";
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(15, 23, 42, 0.2);
  border-radius: 999px;
}

.person-timeline-item {
  position: relative;
  margin-bottom: 20px;
  padding-left: 20px;
  animation: riseIn 0.6s ease both;
  animation-delay: calc(var(--i) * 0.05s);
}

.person-timeline-connector {
  position: absolute;
  left: -26px;
  top: 50%;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  border: 3px solid var(--paper);
  box-shadow: 0 0 0 3px rgba(241, 90, 41, 0.2);
  transform: translateY(-50%);
}

.person-timeline-content {
  background: var(--paper);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.person-hero {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #ffffff;
}

.person-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(241, 90, 41, 0.3);
}

.person-meta {
  display: grid;
  gap: 8px;
  min-width: 220px;
}

.person-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.person-linkedin {
  display: inline-flex;
  align-items: center;
}

.person-name-row h2 {
  font-size: 1.6rem;
}

.person-email {
  color: var(--accent-2);
  font-size: 0.95rem;
}

.person-info {
  color: var(--muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.person-publications h2 {
  font-size: 1.4rem;
  margin-bottom: 10px;
}

.person-empty {
  color: var(--muted);
  font-size: 0.95rem;
}

/* People Section */
:global(.people-section) h2 {
  margin-bottom: 20px;
  border-bottom: 1px solid var(--line);
  padding-bottom: 5px;
  font-size: 1.5rem;
  color: var(--ink);
}
:global(.people-group) {
  margin-bottom: 40px;
}
:global(.people-cards) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
:global(.card) {
  background: var(--paper);
  padding: 18px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid rgba(15, 23, 42, 0.08);
  transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
  animation: riseIn 0.6s ease both;
  animation-delay: calc(var(--i) * 0.06s);
}
:global(.card):hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  border-color: rgba(15, 118, 110, 0.4);
}
:global(.profile-pic) {
  width: 92px;
  height: 92px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 10px;
  border: 3px solid rgba(241, 90, 41, 0.3);
}
:global(.card) h3 {
  margin-bottom: 8px;
  font-size: 1.1rem;
  font-weight: 600;
}
:global(.email) {
  font-size: 0.9rem;
  color: var(--accent-2);
  margin-bottom: 8px;
}
:global(.card) p {
  font-size: 0.92rem;
  margin-bottom: 10px;
  color: var(--muted);
}
:global(.links) a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 4px;
  font-size: 0.85rem;
  color: var(--ink);
  text-decoration: none;
  transition: color 0.3s, background 0.3s, border-color 0.3s;
  border: 1px solid rgba(15, 23, 42, 0.1);
  padding: 4px 10px;
  border-radius: 999px;
}
:global(.links) a:hover {
  color: var(--accent);
  border-color: rgba(241, 90, 41, 0.35);
}

/* Style for LinkedIn logo inside links */
:global(.linkedin-logo) {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

/* Publications Timeline */
:global(.publications-section) h2 {
  text-align: left;
  margin-bottom: 30px;
  font-size: 1.5rem;
  color: var(--ink);
}
:global(.timeline) {
  position: relative;
  margin: 0 auto;
  max-width: 800px;
  padding-left: 40px;
}
:global(.timeline)::before {
  content: "";
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(15, 23, 42, 0.2);
  border-radius: 999px;
}
:global(.year-group) {
  margin-bottom: 40px;
}
:global(.year-label) {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--accent-2);
  margin-bottom: 20px;
}
:global(.timeline-item) {
  position: relative;
  margin-bottom: 20px;
  padding-left: 20px;
  animation: riseIn 0.6s ease both;
  animation-delay: calc(var(--i) * 0.05s);
}
:global(.timeline-item-connector) {
  position: absolute;
  left: -26px;
  top: 50%;
  width: 12px;
  height: 12px;
  background: var(--accent);
  border-radius: 50%;
  border: 3px solid var(--paper);
  box-shadow: 0 0 0 3px rgba(241, 90, 41, 0.2);
  transform: translateY(-50%);
}
:global(.timeline-content) {
  background: var(--paper);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
}
:global(.pub-authors) {
  font-size: 0.82rem;
  color: var(--muted);
  display: block;
  margin-bottom: 4px;
  text-transform: none;
}
:global(.pub-title) {
  font-size: 1rem;
  color: var(--ink);
  margin-bottom: 4px;
}
:global(.pub-venue) a {
  font-size: 0.85rem;
  color: var(--accent-2);
  text-decoration: none;
  transition: color 0.3s;
}
:global(.pub-venue) a:hover {
  color: var(--accent);
}

/* Footer */
.footer {
  display: none;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .portfolio-content {
    width: 92%;
    padding: 14px 12px 22px;
  }
  .header {
    padding: 28px 18px;
  }
  .stats {
    gap: 12px;
  }
  .stat {
    flex: 1 1 140px;
  }
  .timeline {
    padding-left: 30px;
  }
  .timeline::before {
    left: 10px;
  }
  .timeline-item {
    padding-left: 15px;
  }
}
</style>
