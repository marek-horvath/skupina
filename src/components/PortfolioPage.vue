<template>
  <div class="portfolio-wrapper">
    <!-- Background particles -->
    <div id="particles-js"></div>

    <!-- Main content area -->
    <div class="portfolio-content">
      <!-- Header with fade effect -->
      <header class="header">
        <div class="container">
          <h1 class="group-title">{{ group.name }}</h1>
          <p class="group-desc">{{ group.description }}</p>
        </div>
      </header>

      <!-- Tabs for switching between People and Publications -->
      <nav class="tabs">
        <button :class="{ active: activeTab === 'people' }" @click="activeTab = 'people'">
          People
        </button>
        <button :class="{ active: activeTab === 'publications' }" @click="activeTab = 'publications'">
          Publications
        </button>
      </nav>

      <!-- Main content (People or Publications) -->
      <div class="container content">
        <!-- People Section -->
        <div v-if="activeTab === 'people'" class="people-section">
          <!-- Professor -->
          <section class="people-group" v-if="people.professor.length">
            <h2>Professor</h2>
            <div class="people-cards">
              <div class="card" v-for="(person, index) in people.professor" :key="'prof-'+index">
                <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
                <h3>{{ person.name }}</h3>
                <p class="email">{{ person.email }}</p>
                <p>{{ person.info }}</p>
                <div class="links">
                  <a
                    v-for="(link, idx) in person.links"
                    :key="idx"
                    :href="link.url"
                    target="_blank"
                    class="link-item"
                  >
                    <template v-if="link.label.toLowerCase() === 'linkedin'">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s" alt="LinkedIn" class="linkedin-logo" />
                    </template>
                    <template v-else>
                      {{ link.label }}
                    </template>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <!-- Associate Professor -->
          <section class="people-group" v-if="people.associateProfessor.length">
            <h2>Associate Professor</h2>
            <div class="people-cards">
              <div class="card" v-for="(person, index) in people.associateProfessor" :key="'assoc-'+index">
                <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
                <h3>{{ person.name }}</h3>
                <p class="email">{{ person.email }}</p>
                <p>{{ person.info }}</p>
                <div class="links">
                  <a
                    v-for="(link, idx) in person.links"
                    :key="idx"
                    :href="link.url"
                    target="_blank"
                    class="link-item"
                  >
                    <template v-if="link.label.toLowerCase() === 'linkedin'">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s" alt="LinkedIn" class="linkedin-logo" />
                    </template>
                    <template v-else>
                      {{ link.label }}
                    </template>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <!-- Research Assistants -->
          <section class="people-group" v-if="people.researchAssistants.length">
            <h2>Research Assistants</h2>
            <div class="people-cards">
              <div class="card" v-for="(person, index) in people.researchAssistants" :key="'ra-'+index">
                <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
                <h3>{{ person.name }}</h3>
                <p class="email">{{ person.email }}</p>
                <p>{{ person.info }}</p>
                <div class="links">
                  <a
                    v-for="(link, idx) in person.links"
                    :key="idx"
                    :href="link.url"
                    target="_blank"
                    class="link-item"
                  >
                    <template v-if="link.label.toLowerCase() === 'linkedin'">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s" alt="LinkedIn" class="linkedin-logo" />
                    </template>
                    <template v-else>
                      {{ link.label }}
                    </template>
                  </a>
                </div>
              </div>
            </div>
          </section>

          <!-- PhD Candidates -->
          <section class="people-group" v-if="people.phdCandidates.length">
            <h2>PhD Candidates</h2>
            <div class="people-cards">
              <div class="card" v-for="(person, index) in people.phdCandidates" :key="'phd-'+index">
                <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
                <h3>{{ person.name }}</h3>
                <p class="email">{{ person.email }}</p>
                <p>{{ person.info }}</p>
                <div class="links">
                  <a
                    v-for="(link, idx) in person.links"
                    :key="idx"
                    :href="link.url"
                    target="_blank"
                    class="link-item"
                  >
                    <template v-if="link.label.toLowerCase() === 'linkedin'">
                      <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s" alt="LinkedIn" class="linkedin-logo" />
                    </template>
                    <template v-else>
                      {{ link.label }}
                    </template>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Publications Section -->
        <div v-else-if="activeTab === 'publications'" class="publications-section">
          <h2>Publications Timeline</h2>
          <div class="timeline">
            <div class="year-group" v-for="group in groupedPublications" :key="group.year">
              <div class="year-label">{{ group.year }}</div>
              <div class="timeline-item" v-for="(pub, index) in group.items" :key="index">
                <div class="timeline-item-connector"></div>
                <div class="timeline-content">
                  <small class="pub-authors">{{ pub.authors }}</small>
                  <div class="pub-title">{{ pub.title }}</div>
                  <small class="pub-venue">
                    <a :href="pub.link" target="_blank">{{ pub.venue }}</a>
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
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
/* global particlesJS */
export default {
  name: "ResearchGroup",
  data() {
    return {
      activeTab: "people",
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
      publications: []
    };
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
    }
  },
  methods: {
    getImage(filename) {
      return require(`../assets/${filename}`);
    }
  },
  mounted() {
    // Načítanie particles s pôvodnou konfiguráciou
    particlesJS.load("particles-js", "./particles-config.json", () => {
      console.log("Particles.js loaded!");
    });

    const peopleCSVUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0yU5qib1xjuPlctizfGQFSpPsQ_TLgWFA59b7b3oFPxITDT8j3cV04p_O3yJtBKOBZa6ZarzRsKLi/pub?gid=1186507161&single=true&output=csv";
    const publicationsCSVUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0yU5qib1xjuPlctizfGQFSpPsQ_TLgWFA59b7b3oFPxITDT8j3cV04p_O3yJtBKOBZa6ZarzRsKLi/pub?output=csv";

    Promise.all([
      fetch(peopleCSVUrl).then(response => response.text()),
      fetch(publicationsCSVUrl).then(response => response.text())
    ])
      .then(([peopleCsvText, publicationsCsvText]) => {
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

        // Po načítaní dát vyvoláme resize event pre opravu renderovania particles
        this.$nextTick(() => {
          window.dispatchEvent(new Event("resize"));
        });
      })
      .catch(error => console.error("Error loading CSV data:", error));
  }
};
</script>

<style scoped>
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
}

/* Particles background */
#particles-js {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

/* Main content area (white frame) */
.portfolio-content {
  width: 80%;
  max-width: 1200px;
  background-color: #fff;
  padding: 20px 40px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  position: relative;
  z-index: 1;
  margin: 20px auto;
}

/* Header with fade effect and brand colors */
.header {
  background: linear-gradient(135deg, #19aeff, #0084c8, #005c94);
  color: #fff;
  padding: 50px 20px;
  text-align: center;
  animation: fadeIn 1s ease-out;
}
.header .group-title {
  font-size: 2.6em;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}
.group-desc {
  font-size: 1.1em;
  max-width: 800px;
  margin: 0 auto;
  white-space: pre-line;
  line-height: 1.6;
  opacity: 0.9;
}

/* Fade animation */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Tabs styling */
.tabs {
  display: flex;
  justify-content: center;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin: 20px 0;
  padding: 10px 0;
}
.tabs button {
  background: none;
  border: none;
  padding: 12px 25px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.3s, color 0.3s;
  color: #555;
  font-weight: 600;
  margin: 0 10px;
}
.tabs button.active {
  background: #0084c8;
  color: #fff;
  border-radius: 4px;
}
.tabs button:hover {
  background: #005c94;
  color: #fff;
  border-radius: 4px;
}

/* Content area within frame */
.content {
  background: #fff;
  margin-top: 20px;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

/* People Section */
.people-section h2 {
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 5px;
  font-size: 1.6em;
  color: #444;
}
.people-group {
  margin-bottom: 40px;
}
.people-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.card {
  background: #fff;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(0,132,200,0.3);
  transition: transform 0.3s, box-shadow 0.3s;
}
.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}
.profile-pic {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 50%;
  margin-bottom: 10px;
}
.card h3 {
  margin-bottom: 8px;
  font-size: 1.2em;
  font-weight: 600;
}
.email {
  font-size: 0.9em;
  color: #0084c8;
  margin-bottom: 8px;
}
.card p {
  font-size: 0.9em;
  margin-bottom: 10px;
  color: #666;
}
.links a {
  display: inline-block;
  margin: 0 5px;
  font-size: 0.9em;
  color: #0084c8;
  text-decoration: none;
  transition: color 0.3s;
}
.links a:hover {
  color: #005c94;
}

/* Style for LinkedIn logo inside links */
.linkedin-logo {
  width: 16px;
  height: 16px;
  vertical-align: middle;
}

/* Publications Timeline */
.publications-section h2 {
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.6em;
  color: #444;
}
.timeline {
  position: relative;
  margin: 0 auto;
  max-width: 800px;
  padding-left: 40px;
}
.timeline::before {
  content: "";
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 6px;
  background: #0084c8;
  border-radius: 3px;
}
.year-group {
  margin-bottom: 40px;
}
.year-label {
  font-size: 1.4em;
  font-weight: bold;
  color: #0084c8;
  margin-bottom: 20px;
}
.timeline-item {
  position: relative;
  margin-bottom: 20px;
  padding-left: 20px;
}
.timeline-item-connector {
  position: absolute;
  left: -20px;
  top: 50%;
  width: 20px;
  height: 2px;
  background: #0084c8;
  transform: translateY(-50%);
}
.timeline-content {
  background: #fff;
  padding: 10px 15px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.pub-authors {
  font-size: 0.85em;
  color: #666;
  display: block;
  margin-bottom: 4px;
  text-transform: lowercase;
}
.pub-title {
  font-size: 1em;
  color: #333;
  margin-bottom: 4px;
}
.pub-venue a {
  font-size: 0.85em;
  color: #0084c8;
  text-decoration: none;
  transition: color 0.3s;
}
.pub-venue a:hover {
  color: #005c94;
}

/* Footer */
.footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}
.footer .footer-content {
  max-width: 800px;
  margin: 0 auto;
}
.footer .logos {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
}
.footer .logo {
  width: 80px;
  height: auto;
}
.footer .footer-text {
  font-size: 0.9em;
  color: #555;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .portfolio-content {
    width: 95%;
    padding: 15px 20px;
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
