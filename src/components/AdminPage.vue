<template>
  <main class="admin-shell">
    <section v-if="!authenticated" class="login-panel">
      <h1>Admin</h1>
      <form class="login-form" @submit.prevent="login">
        <input v-model="password" type="password" autocomplete="current-password" placeholder="Password" autofocus />
        <button type="submit" :disabled="loading">Log in</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
    </section>

    <section v-else class="dashboard">
      <header class="admin-header">
        <h1>Admin</h1>
        <div class="header-actions">
          <button type="button" class="ghost-btn" @click="logout">Log out</button>
          <button type="button" @click="refresh" :disabled="loading">Refresh</button>
        </div>
      </header>

      <nav class="section-tabs" aria-label="Admin sections">
        <button type="button" :class="{ active: activeSection === 'stats' }" @click="selectSection('stats')">Stats</button>
        <button type="button" :class="{ active: activeSection === 'people' }" @click="selectSection('people')">People</button>
        <button type="button" :class="{ active: activeSection === 'publications' }" @click="selectSection('publications')">Publications</button>
      </nav>

      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <section v-if="activeSection === 'stats'" class="admin-section">
        <div class="api-row">
          <span>API:</span>
          <code>/api/analytics/summary</code>
        </div>

        <div class="metrics">
          <article class="metric-card">
            <span>Total clicks</span>
            <strong>{{ summary.totalEvents || 0 }}</strong>
          </article>
          <article class="metric-card">
            <span>Last 24h</span>
            <strong>{{ summary.last24h || 0 }}</strong>
          </article>
          <article class="metric-card">
            <span>Last 7 days</span>
            <strong>{{ summary.last7d || 0 }}</strong>
          </article>
          <article class="metric-card">
            <span>Daily peak</span>
            <strong>{{ summary.maxDaily || 0 }}</strong>
          </article>
        </div>

        <section class="chart-card">
          <div class="section-heading">
            <div>
              <h2>Clicks by date</h2>
              <p>Daily click count over the last 14 days.</p>
            </div>
            <span>{{ summary.maxDaily || 0 }} max/day</span>
          </div>
          <svg class="line-chart" viewBox="0 0 760 260" role="img" aria-label="Clicks by date">
            <line x1="48" y1="218" x2="728" y2="218" class="axis" />
            <line x1="48" y1="32" x2="48" y2="218" class="axis" />
            <line x1="48" y1="125" x2="728" y2="125" class="grid" />
            <line x1="48" y1="32" x2="728" y2="32" class="grid" />
            <polyline v-if="chartPoints" :points="chartPoints" class="chart-line" />
            <g v-for="point in chartPointItems" :key="point.date">
              <circle :cx="point.x" :cy="point.y" r="5" class="chart-dot" />
              <text :x="point.x" y="242" text-anchor="middle" class="chart-label">{{ point.label }}</text>
            </g>
            <text x="16" y="222" class="chart-y">0</text>
            <text x="16" y="129" class="chart-y">{{ midChartValue }}</text>
            <text x="16" y="36" class="chart-y">{{ summary.maxDaily || 1 }}</text>
          </svg>
        </section>

        <div class="panels">
          <CountPanel title="People" :items="summary.personCounts" empty-label="No person clicks yet." />
          <CountPanel title="Tabs" :items="summary.tabCounts" empty-label="No tab clicks yet." />
          <CountPanel title="Buttons and links" :items="summary.linkCounts" empty-label="No link clicks yet." />
          <CountPanel title="Actions" :items="summary.actionCounts" empty-label="No actions yet." />
          <CountPanel title="Publications" :items="summary.publicationCounts" empty-label="No publication clicks yet." />
          <CountPanel title="Language" :items="summary.languageCounts" empty-label="No language switches yet." />
        </div>

        <section class="recent-card">
          <h2>Recent clicks</h2>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Label</th>
                  <th>Language</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in summary.recentEvents" :key="event.id">
                  <td>{{ formatTime(event.timestamp) }}</td>
                  <td>{{ event.action }}</td>
                  <td>{{ event.label }}</td>
                  <td>{{ event.language }}</td>
                  <td>{{ event.target }}</td>
                </tr>
                <tr v-if="!summary.recentEvents || !summary.recentEvents.length">
                  <td colspan="5">No clicks have been recorded yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section v-if="activeSection === 'people'" class="admin-section">
        <div class="editor-toolbar">
          <div>
            <h2>Edit people</h2>
            <p>Data is saved to <code>data/people-db.json</code> and <code>public/data/people.json</code>.</p>
          </div>
          <div class="toolbar-actions">
            <button type="button" class="ghost-btn" @click="addPerson">Add person</button>
            <button type="button" @click="savePeople" :disabled="loading">Save people</button>
          </div>
        </div>

        <div class="editor-grid">
          <aside class="editor-list">
            <label>
              Group
              <select v-model="selectedGroup" @change="selectedPersonIndex = 0">
                <option v-for="group in groupOptions" :key="group.key" :value="group.key">{{ group.label }}</option>
              </select>
            </label>
            <button
              v-for="(person, index) in selectedPeople"
              :key="`${person.name}-${index}`"
              type="button"
              class="list-item"
              :class="{ active: selectedPersonIndex === index }"
              @click="selectedPersonIndex = index"
            >
              <strong>{{ person.name || "Unnamed" }}</strong>
              <span>{{ person.role }}</span>
            </button>
            <p v-if="!selectedPeople.length" class="empty">There are no people in this group yet.</p>
          </aside>

          <form v-if="selectedPerson" class="edit-form" @submit.prevent="savePeople">
            <div class="form-actions">
              <h3>{{ selectedPerson.name || "New person" }}</h3>
              <button type="button" class="danger-btn" @click="deletePerson">Delete</button>
            </div>
            <div class="form-grid">
              <label>Name<input v-model="selectedPerson.name" /></label>
              <label>Role<input v-model="selectedPerson.role" /></label>
              <label>Email<input v-model="selectedPerson.email" /></label>
              <label>Image<input v-model="selectedPerson.image" placeholder="marek.jpg" /></label>
            </div>
            <label>Info EN<textarea v-model="selectedPerson.info" rows="4"></textarea></label>
            <label>Info SK<textarea v-model="selectedPerson.infoSK" rows="4"></textarea></label>
            <div class="form-grid">
              <label v-for="linkLabel in linkLabels" :key="linkLabel">
                {{ linkLabel }}
                <input :value="linkValue(selectedPerson, linkLabel)" @input="setLink(selectedPerson, linkLabel, $event.target.value)" />
              </label>
            </div>
          </form>
        </div>
      </section>

      <section v-if="activeSection === 'publications'" class="admin-section">
        <div class="editor-toolbar">
          <div>
            <h2>Edit publications</h2>
            <p>Data is saved to the local snapshot. A new OpenAlex sync can overwrite manual publication edits.</p>
          </div>
          <div class="toolbar-actions">
            <button type="button" class="ghost-btn" @click="addPublication">Add publication</button>
            <button type="button" @click="savePublications" :disabled="loading">Save publications</button>
          </div>
        </div>

        <div class="editor-grid publications-editor">
          <aside class="editor-list">
            <label>
              Filter
              <input v-model="publicationFilter" placeholder="Title, author, year..." />
            </label>
            <button
              v-for="item in filteredPublications"
              :key="`${item.index}-${item.publication.title}`"
              type="button"
              class="list-item"
              :class="{ active: selectedPublicationIndex === item.index }"
              @click="selectedPublicationIndex = item.index"
            >
              <strong>{{ item.publication.title || "Untitled" }}</strong>
              <span>{{ item.publication.date }} - {{ item.publication.type || "type not set" }}</span>
            </button>
            <p v-if="!filteredPublications.length" class="empty">No results found.</p>
          </aside>

          <form v-if="selectedPublication" class="edit-form" @submit.prevent="savePublications">
            <div class="form-actions">
              <h3>{{ selectedPublication.title || "New publication" }}</h3>
              <button type="button" class="danger-btn" @click="deletePublication">Delete</button>
            </div>
            <div class="form-grid">
              <label>Year<input v-model="selectedPublication.date" /></label>
              <label>
                Type
                <select v-model="selectedPublication.type">
                  <option value="">unclassified</option>
                  <option value="conference">conference</option>
                  <option value="journal">journal</option>
                  <option value="book">book</option>
                </select>
              </label>
              <label>DOI<input v-model="selectedPublication.doi" /></label>
              <label>OpenAlex ID<input v-model="selectedPublication.openalexId" /></label>
            </div>
            <label>Title<textarea v-model="selectedPublication.title" rows="3"></textarea></label>
            <label>Authors<textarea v-model="selectedPublication.authors" rows="3" placeholder="First Author; Second Author"></textarea></label>
            <label>Venue<textarea v-model="selectedPublication.venue" rows="2"></textarea></label>
            <label>Link<input v-model="selectedPublication.link" /></label>
          </form>
        </div>
      </section>
    </section>
  </main>
</template>

<script>
import { h } from "vue";

const emptyPeople = () => ({
  professor: [],
  associateProfessor: [],
  researchAssistants: [],
  phdCandidates: [],
  exMembers: [],
  students: []
});

const emptySummary = () => ({
  totalEvents: 0,
  last24h: 0,
  last7d: 0,
  maxDaily: 0,
  dateSeries: [],
  actionCounts: [],
  personCounts: [],
  publicationCounts: [],
  tabCounts: [],
  linkCounts: [],
  languageCounts: [],
  recentEvents: []
});

const CountPanel = {
  name: "CountPanel",
  props: {
    title: { type: String, required: true },
    items: { type: Array, default: () => [] },
    emptyLabel: { type: String, default: "No data yet." }
  },
  render() {
    const rows = this.items && this.items.length
      ? this.items.map(item => h("div", { class: "count-row", key: item.label }, [
        h("span", item.label),
        h("strong", String(item.count))
      ]))
      : [h("p", { class: "empty" }, this.emptyLabel)];

    return h("section", { class: "panel" }, [
      h("h2", this.title),
      h("div", { class: "count-list" }, rows)
    ]);
  }
};

export default {
  name: "AdminPage",
  components: { CountPanel },
  data() {
    return {
      password: "",
      authenticated: false,
      loading: false,
      error: "",
      message: "",
      activeSection: "stats",
      summary: emptySummary(),
      people: emptyPeople(),
      publications: [],
      selectedGroup: "professor",
      selectedPersonIndex: 0,
      selectedPublicationIndex: 0,
      publicationFilter: "",
      linkLabels: ["Profile", "LinkedIn", "ORCID", "Web"],
      groupOptions: [
        { key: "professor", label: "Professor", role: "Professor" },
        { key: "associateProfessor", label: "Associate Professor", role: "Associate Professor" },
        { key: "researchAssistants", label: "Research Assistants", role: "Research Assistant" },
        { key: "phdCandidates", label: "PhD Candidates", role: "PhD Candidate" },
        { key: "exMembers", label: "Ex Members", role: "Ex" },
        { key: "students", label: "Students", role: "Student" }
      ]
    };
  },
  computed: {
    selectedPeople() {
      return this.people[this.selectedGroup] || [];
    },
    selectedPerson() {
      return this.selectedPeople[this.selectedPersonIndex] || null;
    },
    selectedPublication() {
      return this.publications[this.selectedPublicationIndex] || null;
    },
    filteredPublications() {
      const needle = this.publicationFilter.toLowerCase().trim();
      return this.publications
        .map((publication, index) => ({ publication, index }))
        .filter(item => {
          if (!needle) {
            return true;
          }
          return [
            item.publication.date,
            item.publication.title,
            item.publication.authors,
            item.publication.venue,
            item.publication.link
          ].join(" ").toLowerCase().includes(needle);
        })
        .slice(0, 120);
    },
    chartPointItems() {
      const items = this.summary.dateSeries || [];
      const max = Math.max(this.summary.maxDaily || 1, 1);
      const width = 680;
      const left = 48;
      const top = 32;
      const height = 186;
      const step = items.length > 1 ? width / (items.length - 1) : 0;
      return items.map((item, index) => ({
        ...item,
        x: left + step * index,
        y: top + height - (item.count / max) * height
      }));
    },
    chartPoints() {
      return this.chartPointItems.map(point => `${point.x},${point.y}`).join(" ");
    },
    midChartValue() {
      return Math.ceil((this.summary.maxDaily || 1) / 2);
    }
  },
  mounted() {
    const saved = window.localStorage.getItem("adminPassword");
    if (saved) {
      this.password = saved;
      this.login();
    }
  },
  methods: {
    login() {
      this.loading = true;
      this.error = "";
      Promise.all([this.fetchSummary(), this.fetchContent()])
        .then(() => {
          this.authenticated = true;
          window.localStorage.setItem("adminPassword", this.password);
        })
        .catch(error => {
          this.authenticated = false;
          this.error = error.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    logout() {
      window.localStorage.removeItem("adminPassword");
      this.authenticated = false;
      this.password = "";
      this.error = "";
      this.message = "";
    },
    selectSection(section) {
      this.activeSection = section;
      this.message = "";
    },
    refresh() {
      this.loading = true;
      this.error = "";
      const request = this.activeSection === "stats" ? this.fetchSummary() : this.fetchContent();
      request
        .catch(error => {
          this.error = error.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    adminPost(path, payload = {}) {
      return fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: this.password, ...payload })
      }).then(response => {
        if (!response.ok) {
          throw new Error("Wrong password or unavailable API.");
        }
        return response.json();
      });
    },
    fetchSummary() {
      return this.adminPost("/api/analytics/summary").then(summary => {
        this.summary = summary;
      });
    },
    fetchContent() {
      return this.adminPost("/api/admin/content").then(content => {
        this.people = this.normalizePeople(content.people);
        this.publications = Array.isArray(content.publications) ? content.publications : [];
        this.clampSelections();
      });
    },
    normalizePeople(people) {
      return {
        ...emptyPeople(),
        ...(people || {})
      };
    },
    clampSelections() {
      this.selectedPersonIndex = Math.min(this.selectedPersonIndex, Math.max(this.selectedPeople.length - 1, 0));
      this.selectedPublicationIndex = Math.min(this.selectedPublicationIndex, Math.max(this.publications.length - 1, 0));
    },
    addPerson() {
      const option = this.groupOptions.find(group => group.key === this.selectedGroup);
      const person = {
        role: option ? option.role : "",
        name: "",
        email: "",
        info: "",
        infoSK: "",
        image: "",
        links: []
      };
      this.people[this.selectedGroup].push(person);
      this.selectedPersonIndex = this.people[this.selectedGroup].length - 1;
    },
    deletePerson() {
      if (!this.selectedPerson || !window.confirm("Delete this person?")) {
        return;
      }
      this.people[this.selectedGroup].splice(this.selectedPersonIndex, 1);
      this.clampSelections();
    },
    linkValue(person, label) {
      const link = (person.links || []).find(item => item.label === label);
      return link ? link.url : "";
    },
    setLink(person, label, value) {
      if (!Array.isArray(person.links)) {
        person.links = [];
      }
      const trimmed = value.trim();
      const index = person.links.findIndex(item => item.label === label);
      if (!trimmed && index >= 0) {
        person.links.splice(index, 1);
        return;
      }
      if (index >= 0) {
        person.links[index].url = trimmed;
      } else if (trimmed) {
        person.links.push({ label, url: trimmed });
      }
    },
    savePeople() {
      this.loading = true;
      this.error = "";
      this.adminPost("/api/admin/people/save", { people: this.people })
        .then(response => {
          this.people = this.normalizePeople(response.people);
          this.message = "People were saved.";
        })
        .catch(error => {
          this.error = error.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    addPublication() {
      this.publications.unshift({
        date: String(new Date().getFullYear()),
        title: "",
        authors: "",
        venue: "",
        link: "",
        type: "",
        doi: "",
        openalexId: "",
        sourceType: "manual",
        openalexType: "manual",
        matchedAuthors: [],
        manual: true
      });
      this.selectedPublicationIndex = 0;
      this.publicationFilter = "";
    },
    deletePublication() {
      if (!this.selectedPublication || !window.confirm("Delete this publication?")) {
        return;
      }
      this.publications.splice(this.selectedPublicationIndex, 1);
      this.clampSelections();
    },
    savePublications() {
      this.loading = true;
      this.error = "";
      this.adminPost("/api/admin/publications/save", { publications: this.publications })
        .then(response => {
          this.publications = response.publications || [];
          this.clampSelections();
          this.message = "Publications were saved.";
        })
        .catch(error => {
          this.error = error.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    formatTime(timestamp) {
      if (!timestamp) {
        return "";
      }
      const date = new Date(timestamp);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
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

.admin-shell {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 20% -10%, rgba(241, 90, 41, 0.15), transparent 60%),
    radial-gradient(900px 600px at 90% 10%, rgba(15, 118, 110, 0.16), transparent 55%),
    linear-gradient(180deg, #fbf7f1 0%, #eef5f4 100%);
  color: var(--ink);
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
  padding: 20px;
}

.admin-shell::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: linear-gradient(120deg, rgba(15, 23, 42, 0.04) 0%, transparent 60%);
  opacity: 0.8;
  pointer-events: none;
}

.dashboard,
.login-panel {
  position: relative;
  z-index: 1;
  max-width: 1020px;
  margin: 0 auto;
  background: var(--paper);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  box-shadow: var(--shadow);
  padding: 16px 20px 24px;
}

.login-panel {
  max-width: 540px;
  margin-top: 9vh;
  padding: 28px;
}

.admin-header {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 18px;
  background:
    linear-gradient(135deg, rgba(15, 118, 110, 0.96), rgba(15, 23, 42, 0.92)),
    radial-gradient(400px 200px at 20% 20%, rgba(245, 158, 11, 0.35), transparent 60%);
  color: #f8fafc;
  border-radius: 18px;
  padding: 20px;
}

h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1;
  color: #f8fafc;
  font-family: "Fraunces", "Times New Roman", serif;
  font-weight: 700;
  margin: 0 0 10px;
  text-shadow: 0 4px 12px rgba(15, 23, 42, 0.3);
}

.admin-header h1 {
  margin: 0;
}

h2,
h3 {
  margin: 0 0 12px;
  color: var(--ink);
}

h2 {
  font-size: 1.12rem;
}

h3 {
  font-size: 1rem;
}

.editor-toolbar p,
.section-heading p {
  color: var(--muted);
  font-size: 1rem;
  margin: 0;
}

.login-panel h1 {
  color: var(--ink);
  text-shadow: none;
}

.header-actions,
.toolbar-actions,
.form-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.form-actions {
  justify-content: space-between;
}

button {
  border: 0;
  border-radius: 999px;
  background: var(--accent-2);
  color: #ffffff;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 700;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

button:hover:not(:disabled) {
  background: #0d625c;
  box-shadow: 0 10px 22px rgba(15, 118, 110, 0.18);
  transform: translateY(-1px);
}

button:disabled {
  opacity: 0.62;
  cursor: wait;
}

.ghost-btn {
  background: rgba(248, 250, 252, 0.14);
  color: #f8fafc;
  border: 1px solid rgba(248, 250, 252, 0.24);
}

.editor-toolbar .ghost-btn {
  background: rgba(15, 118, 110, 0.08);
  color: var(--accent-2);
  border: 1px solid rgba(15, 118, 110, 0.18);
}

.danger-btn {
  background: var(--accent);
}

.danger-btn:hover:not(:disabled) {
  background: #d9461f;
  box-shadow: 0 10px 22px rgba(241, 90, 41, 0.18);
}

.login-form {
  margin-top: 24px;
  display: flex;
  gap: 10px;
}

.login-form input,
input,
select,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--ink);
  background: #ffffff;
  font: inherit;
}

.login-form input {
  border-radius: 999px;
}

textarea {
  resize: vertical;
}

label {
  display: grid;
  gap: 6px;
  color: var(--ink);
  font-weight: 700;
  font-size: 0.88rem;
}

.error,
.message {
  margin-top: 14px;
  font-weight: 800;
}

.error {
  color: var(--accent);
}

.message {
  color: #0f766e;
}

.section-tabs {
  display: inline-flex;
  gap: 6px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 6px;
  margin-top: 22px;
}

.section-tabs button {
  background: transparent;
  color: var(--muted);
}

.section-tabs button.active {
  background: var(--ink);
  color: #ffffff;
}

.admin-section {
  margin-top: 24px;
}

.api-row {
  margin: 0 0 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px 16px;
  background: #fbfaf7;
  color: var(--muted);
  display: flex;
  gap: 6px;
  align-items: center;
}

.api-row code,
.editor-toolbar code {
  color: var(--accent-2);
  font-weight: 700;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.chart-card,
.panel,
.recent-card,
.editor-list,
.edit-form {
  border: 1px solid var(--line);
  background: #fbfaf7;
  border-radius: 8px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
}

.metric-card {
  padding: 18px;
  display: grid;
  gap: 8px;
}

.metric-card span {
  color: var(--muted);
  font-weight: 700;
  font-size: 0.88rem;
}

.metric-card strong {
  font-size: 2rem;
  color: var(--ink);
}

.chart-card,
.recent-card,
.panel,
.editor-list,
.edit-form {
  padding: 18px;
}

.chart-card,
.recent-card {
  margin-top: 16px;
}

.section-heading,
.editor-toolbar {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.section-heading span {
  background: rgba(241, 90, 41, 0.1);
  color: var(--accent);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.82rem;
  font-weight: 700;
}

.line-chart {
  width: 100%;
  height: auto;
  margin-top: 8px;
}

.axis {
  stroke: rgba(15, 23, 42, 0.24);
  stroke-width: 2;
}

.grid {
  stroke: rgba(15, 23, 42, 0.08);
  stroke-width: 1;
}

.chart-line {
  fill: none;
  stroke: var(--accent-2);
  stroke-width: 5;
  stroke-linejoin: round;
  stroke-linecap: round;
}

.chart-dot {
  fill: var(--accent);
  stroke: #ffffff;
  stroke-width: 3;
}

.chart-label,
.chart-y {
  fill: var(--muted);
  font-size: 14px;
  font-weight: 700;
}

.panels,
.editor-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(260px, 0.85fr) minmax(0, 1.6fr);
  gap: 14px;
}

.panels {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.publications-editor {
  grid-template-columns: minmax(320px, 1fr) minmax(0, 1.5fr);
}

.editor-list {
  display: grid;
  gap: 10px;
  align-content: start;
  max-height: 760px;
  overflow: auto;
}

.list-item {
  border-radius: 8px;
  background: #ffffff;
  color: var(--ink);
  border: 1px solid var(--line);
  text-align: left;
  display: grid;
  gap: 4px;
}

.list-item.active {
  background: var(--ink);
  color: #ffffff;
}

.list-item span {
  font-size: 0.82rem;
  opacity: 0.82;
}

.edit-form {
  display: grid;
  gap: 14px;
  align-content: start;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.count-list {
  display: grid;
}

.count-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: center;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding: 10px 0;
  color: var(--ink);
  font-weight: 700;
}

.count-row strong {
  min-width: 44px;
  text-align: center;
  background: var(--ink);
  color: #ffffff;
  border-radius: 999px;
  padding: 4px 10px;
}

.empty {
  color: var(--muted);
  font-weight: 700;
}

:deep(.panel h2) {
  margin: 0 0 12px;
  color: var(--ink);
  font-size: 1.12rem;
}

:deep(.count-list) {
  display: grid;
}

:deep(.count-row) {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: center;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding: 10px 0;
  color: var(--ink);
  font-weight: 700;
}

:deep(.count-row strong) {
  min-width: 44px;
  text-align: center;
  background: var(--ink);
  color: #ffffff;
  border-radius: 999px;
  padding: 4px 10px;
}

:deep(.empty) {
  color: var(--muted);
  font-weight: 700;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
}

th,
td {
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  padding: 10px 8px;
  text-align: left;
  color: var(--muted);
  font-size: 0.9rem;
}

th {
  color: var(--ink);
  font-weight: 800;
}

td:last-child {
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .admin-shell {
    padding: 16px;
  }

  .dashboard,
  .login-panel {
    padding: 18px;
  }

  .admin-header,
  .editor-grid,
  .publications-editor {
    grid-template-columns: 1fr;
  }

  .section-heading,
  .editor-toolbar,
  .header-actions,
  .toolbar-actions,
  .login-form {
    flex-direction: column;
  }

  .metrics,
  .panels,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
