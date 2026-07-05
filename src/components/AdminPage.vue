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
          <button type="button" class="ghost-btn" @click="exportBackup" :disabled="loading">Export backup</button>
          <button type="button" class="ghost-btn" @click="triggerRestoreBackup" :disabled="loading">Restore backup</button>
          <button type="button" @click="refresh" :disabled="loading">Refresh</button>
          <input ref="backupInput" class="file-input-hidden" type="file" accept="application/json,.json" @change="restoreBackup" />
        </div>
      </header>

      <nav class="section-tabs" aria-label="Admin sections">
        <button type="button" :class="{ active: activeSection === 'stats' }" @click="selectSection('stats')">Stats</button>
        <button type="button" :class="{ active: activeSection === 'people' }" @click="selectSection('people')">People</button>
        <button type="button" :class="{ active: activeSection === 'content' }" @click="selectSection('content')">Content</button>
        <button type="button" :class="{ active: activeSection === 'publications' }" @click="selectSection('publications')">Publications</button>
        <button type="button" :class="{ active: activeSection === 'audit' }" @click="selectSection('audit')">Audit</button>
      </nav>

      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="error" class="error">{{ error }}</p>

      <section v-if="activeSection === 'stats'" class="admin-section">
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
                  <td data-label="Time">{{ formatTime(event.timestamp) }}</td>
                  <td data-label="Action">{{ event.action }}</td>
                  <td data-label="Label">{{ event.label }}</td>
                  <td data-label="Language">{{ event.language }}</td>
                  <td data-label="Target">{{ event.target }}</td>
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
          </div>
          <div class="toolbar-actions">
            <button type="button" class="ghost-btn" @click="addPerson">Add person</button>
            <button type="button" @click="savePeople" :disabled="loading">Save people</button>
          </div>
        </div>

        <div class="editor-grid">
          <aside class="editor-list">
            <div class="list-summary">
              <span>All people</span>
              <strong>{{ allPeople.length }}</strong>
            </div>
            <button
              v-for="item in allPeople"
              :key="`${item.groupKey}-${item.index}`"
              type="button"
              class="list-item"
              :class="{ active: selectedGroup === item.groupKey && selectedPersonIndex === item.index }"
              @click="setSelectedPerson(item.groupKey, item.index)"
            >
              <strong>{{ item.person.name || "Unnamed" }}</strong>
              <span>{{ item.person.role || item.roleLabel }}{{ item.person.visible === false ? " - hidden" : "" }}</span>
            </button>
            <p v-if="!allPeople.length" class="empty">There are no people yet.</p>
          </aside>

          <form v-if="selectedPerson" class="edit-form" @submit.prevent="savePeople">
            <div class="form-actions">
              <h3>{{ selectedPerson.name || "New person" }}</h3>
              <button type="button" class="danger-btn" @click="deletePerson">Delete</button>
            </div>
            <div class="form-grid">
              <label>Name<input v-model="selectedPerson.name" /></label>
              <label>
                Role
                <select :value="selectedGroup" @change="changeSelectedPersonGroup($event.target.value)">
                  <option v-for="group in groupOptions" :key="group.key" :value="group.key">{{ group.role }}</option>
                </select>
              </label>
              <label>Email<input v-model="selectedPerson.email" /></label>
              <label>Image<input v-model="selectedPerson.image" placeholder="marek.jpg" /></label>
              <label class="check-row"><input v-model="selectedPerson.visible" type="checkbox" /> Visible</label>
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

      <section v-if="activeSection === 'content'" class="admin-section">
        <div class="editor-toolbar">
          <div>
            <h2>Edit tabs and events</h2>
          </div>
          <div class="toolbar-actions">
            <button type="button" class="ghost-btn" @click="addEvent">Add event</button>
            <button type="button" @click="saveContent" :disabled="loading">Save content</button>
          </div>
        </div>

        <section class="settings-card">
          <h3>Visible tabs</h3>
          <div class="toggle-grid">
            <label v-for="tab in content.tabs" :key="tab.id" class="check-row">
              <input v-model="tab.visible" type="checkbox" />
              {{ tabLabel(tab.id) }}
            </label>
          </div>
        </section>

        <section class="settings-card">
          <h3>Events page intro</h3>
          <div class="form-grid">
            <label>Intro EN<textarea v-model="content.events.intro" rows="4"></textarea></label>
            <label>Intro SK<textarea v-model="content.events.introSK" rows="4"></textarea></label>
            <label>Press link label EN<input v-model="content.events.pressLinkLabel" /></label>
            <label>Press link label SK<input v-model="content.events.pressLinkLabelSK" /></label>
          </div>
          <label>Press link URL<input v-model="content.events.pressLinkUrl" /></label>
        </section>

        <div class="editor-grid">
          <aside class="editor-list">
            <button
              v-for="(event, index) in content.events.items"
              :key="`${event.title}-${index}`"
              type="button"
              class="list-item"
              :class="{ active: selectedEventIndex === index }"
              @click="selectedEventIndex = index"
            >
              <strong>{{ event.title || event.titleSK || "Unnamed event" }}</strong>
              <span>{{ event.visible === false ? "hidden" : "visible" }}</span>
            </button>
            <p v-if="!content.events.items.length" class="empty">There are no events yet.</p>
          </aside>

          <form v-if="selectedEvent" class="edit-form" @submit.prevent="saveContent">
            <div class="form-actions">
              <h3>{{ selectedEvent.title || selectedEvent.titleSK || "New event" }}</h3>
              <button type="button" class="danger-btn" @click="deleteEvent">Delete</button>
            </div>
            <div class="form-grid">
              <label>Title EN<input v-model="selectedEvent.title" /></label>
              <label>Title SK<input v-model="selectedEvent.titleSK" /></label>
            </div>
            <label>Description EN<textarea v-model="selectedEvent.description" rows="4"></textarea></label>
            <label>Description SK<textarea v-model="selectedEvent.descriptionSK" rows="4"></textarea></label>
            <div class="form-grid">
              <label>URL<input v-model="selectedEvent.url" /></label>
              <label class="check-row"><input v-model="selectedEvent.visible" type="checkbox" /> Visible</label>
            </div>
          </form>
        </div>
      </section>

      <section v-if="activeSection === 'publications'" class="admin-section">
        <div class="editor-toolbar">
          <div>
            <h2>Edit publications</h2>
          </div>
          <div class="toolbar-actions">
            <button type="button" class="ghost-btn" @click="syncPublications(false)" :disabled="loading">Sync OpenAlex</button>
            <button type="button" class="ghost-btn" @click="syncPublications(true)" :disabled="loading">Refresh authors</button>
            <button type="button" class="ghost-btn" @click="addPublication">Add publication</button>
            <button type="button" @click="savePublications" :disabled="loading">Save publications</button>
          </div>
        </div>

        <section class="sync-card" v-if="publicationMeta.generatedAt || syncHistory.length">
          <div class="sync-heading">
            <h3>OpenAlex sync</h3>
            <span v-if="publicationMeta.generatedAt">{{ formatFullTime(publicationMeta.generatedAt) }}</span>
          </div>
          <div class="sync-metrics">
            <article>
              <span>Publications</span>
              <strong>{{ publicationMeta.publicationCount || publications.length }}</strong>
            </article>
            <article>
              <span>Manual</span>
              <strong>{{ publicationMeta.manualPublicationCount || 0 }}</strong>
            </article>
            <article>
              <span>Preserved</span>
              <strong>{{ publicationMeta.preservedManualPublicationCount || 0 }}</strong>
            </article>
            <article>
              <span>Skipped deleted</span>
              <strong>{{ publicationMeta.skippedDeletedPublicationCount || 0 }}</strong>
            </article>
            <article>
              <span>Deleted keys</span>
              <strong>{{ publicationMeta.deletedPublicationKeyCount || 0 }}</strong>
            </article>
          </div>
          <div v-if="syncHistory.length" class="sync-history">
            <div v-for="item in syncHistory.slice(0, 5)" :key="`${item.generatedAt}-${item.publicationCount}`" class="sync-row">
              <span>{{ formatFullTime(item.generatedAt) }}</span>
              <strong>{{ item.publicationCount || 0 }}</strong>
              <small>preserved {{ item.preservedManualPublicationCount || 0 }} / skipped {{ item.skippedDeletedPublicationCount || 0 }}</small>
            </div>
          </div>
        </section>

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

      <section v-if="activeSection === 'audit'" class="admin-section">
        <div class="editor-toolbar">
          <div>
            <h2>Audit log</h2>
          </div>
          <div class="toolbar-actions">
            <button type="button" @click="fetchAudit" :disabled="loading">Refresh audit</button>
          </div>
        </div>

        <section class="recent-card">
          <div class="audit-meta" v-if="auditMeta.updatedAt">
            Last audit update: {{ formatFullTime(auditMeta.updatedAt) }}
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in auditEvents" :key="event.id">
                  <td data-label="Time">{{ formatFullTime(event.timestamp) }}</td>
                  <td data-label="Action">{{ event.action }}</td>
                  <td data-label="Details">{{ formatDetails(event.details) }}</td>
                  <td data-label="IP">{{ event.ip }}</td>
                </tr>
                <tr v-if="!auditEvents.length">
                  <td colspan="4">No admin actions recorded yet.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>

<script>
import { h } from "vue";

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? "https://seug-api.167.233.132.16.sslip.io" : "");

const emptyPeople = () => ({
  professor: [],
  associateProfessor: [],
  researchAssistants: [],
  phdCandidates: [],
  exMembers: [],
  students: []
});

const emptyContent = () => ({
  tabs: [
    { id: "people", visible: true },
    { id: "publications", visible: true },
    { id: "teaching", visible: true },
    { id: "events", visible: true }
  ],
  events: {
    intro: "",
    introSK: "",
    pressLinkLabel: "KPI events",
    pressLinkLabelSK: "Udalosti KPI",
    pressLinkUrl: "",
    items: []
  }
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
      auditEvents: [],
      auditMeta: {},
      people: emptyPeople(),
      content: emptyContent(),
      publications: [],
      publicationMeta: {},
      selectedGroup: "professor",
      selectedPersonIndex: 0,
      selectedEventIndex: 0,
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
    allPeople() {
      return this.groupOptions.flatMap(group => (
        Array.isArray(this.people[group.key]) ? this.people[group.key] : []
      ).map((person, index) => ({
        groupKey: group.key,
        roleLabel: group.role,
        index,
        person
      })));
    },
    selectedPeople() {
      return this.people[this.selectedGroup] || [];
    },
    selectedPerson() {
      return this.selectedPeople[this.selectedPersonIndex] || null;
    },
    selectedEvent() {
      return this.content.events.items[this.selectedEventIndex] || null;
    },
    selectedPublication() {
      return this.publications[this.selectedPublicationIndex] || null;
    },
    syncHistory() {
      return Array.isArray(this.publicationMeta.syncHistory) ? this.publicationMeta.syncHistory : [];
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
      this.login(true);
    }
  },
  methods: {
    login(fromSavedPassword = false) {
      const usingSavedPassword = fromSavedPassword === true;
      this.loading = true;
      this.error = "";
      Promise.all([this.fetchSummary(), this.fetchContent(), this.fetchAudit()])
        .then(() => {
          this.authenticated = true;
          window.localStorage.setItem("adminPassword", this.password);
        })
        .catch(error => {
          this.authenticated = false;
          if (usingSavedPassword) {
            window.localStorage.removeItem("adminPassword");
            this.password = "";
            this.error = "Saved admin password is no longer valid. Enter the password again.";
          } else {
            this.error = error.message;
          }
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
      const request = this.activeSection === "stats"
        ? this.fetchSummary()
        : this.activeSection === "audit"
          ? this.fetchAudit()
          : this.fetchContent();
      request
        .catch(error => {
          this.error = error.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    apiUrl(path) {
      return `${API_BASE_URL}${path}`;
    },
    adminPost(path, payload = {}) {
      return fetch(this.apiUrl(path), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: this.password, ...payload })
      }).then(async response => {
        if (!response.ok) {
          let message = "Wrong password or unavailable API.";
          try {
            const payload = await response.json();
            message = payload.error || message;
          } catch (error) {
            // Keep the generic message if the API did not return JSON.
          }
          throw new Error(message);
        }
        return response.json();
      });
    },
    exportBackup() {
      this.loading = true;
      this.error = "";
      this.adminPost("/api/admin/backup")
        .then(backup => {
          const exportedAt = backup.exportedAt || new Date().toISOString();
          const blob = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: "application/json" });
          const link = document.createElement("a");
          link.href = window.URL.createObjectURL(blob);
          link.download = `seug-backup-${exportedAt.replace(/[:.]/g, "-")}.json`;
          document.body.appendChild(link);
          link.click();
          window.URL.revokeObjectURL(link.href);
          document.body.removeChild(link);
          this.message = "Backup was exported.";
          this.fetchAudit();
        })
        .catch(error => {
          this.error = error.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    triggerRestoreBackup() {
      if (this.$refs.backupInput) {
        this.$refs.backupInput.click();
      }
    },
    restoreBackup(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      if (!window.confirm("Restore this backup and overwrite current data?")) {
        event.target.value = "";
        return;
      }

      this.loading = true;
      this.error = "";
      file.text()
        .then(raw => JSON.parse(raw))
        .then(backup => this.adminPost("/api/admin/backup/restore", { backup }))
        .then(response => {
          this.message = `Backup restored (${response.restoredFiles.length} files).`;
          return Promise.all([this.fetchSummary(), this.fetchContent(), this.fetchAudit()]);
        })
        .catch(error => {
          this.error = error.message;
        })
        .finally(() => {
          event.target.value = "";
          this.loading = false;
        });
    },
    fetchSummary() {
      return this.adminPost("/api/analytics/summary").then(summary => {
        this.summary = summary;
      });
    },
    fetchAudit() {
      return this.adminPost("/api/admin/audit", { limit: 100 }).then(audit => {
        this.auditEvents = Array.isArray(audit.events) ? audit.events : [];
        this.auditMeta = audit.meta || {};
      });
    },
    fetchContent() {
      return this.adminPost("/api/admin/content").then(content => {
        this.people = this.normalizePeople(content.people);
        this.content = this.normalizeContent(content.content);
        this.publications = Array.isArray(content.publications) ? content.publications : [];
        this.publicationMeta = content.publicationMeta || {};
        if (content.audit) {
          this.auditEvents = Array.isArray(content.audit.events) ? content.audit.events : this.auditEvents;
          this.auditMeta = content.audit.meta || this.auditMeta;
        }
        this.clampSelections();
      });
    },
    normalizePeople(people) {
      return {
        ...emptyPeople(),
        ...(people || {})
      };
    },
    normalizeContent(content) {
      const defaults = emptyContent();
      const incomingTabs = Array.isArray(content && content.tabs) ? content.tabs : [];
      const tabs = defaults.tabs.map(tab => {
        const incoming = incomingTabs.find(item => item.id === tab.id);
        return {
          ...tab,
          visible: incoming ? incoming.visible !== false : tab.visible
        };
      });
      const events = content && content.events ? content.events : {};
      return {
        tabs,
        events: {
          ...defaults.events,
          ...events,
          items: Array.isArray(events.items)
            ? events.items.map(event => ({
              title: event.title || "",
              titleSK: event.titleSK || "",
              description: event.description || "",
              descriptionSK: event.descriptionSK || "",
              url: event.url || "",
              visible: event.visible !== false
            }))
            : []
        }
      };
    },
    clampSelections() {
      if (!Array.isArray(this.people[this.selectedGroup])) {
        this.selectedGroup = this.groupOptions[0].key;
      }
      if (!this.selectedPeople.length && this.allPeople.length) {
        this.selectedGroup = this.allPeople[0].groupKey;
        this.selectedPersonIndex = this.allPeople[0].index;
      } else {
        this.selectedPersonIndex = Math.min(this.selectedPersonIndex, Math.max(this.selectedPeople.length - 1, 0));
      }
      this.selectedEventIndex = Math.min(this.selectedEventIndex, Math.max(this.content.events.items.length - 1, 0));
      this.selectedPublicationIndex = Math.min(this.selectedPublicationIndex, Math.max(this.publications.length - 1, 0));
    },
    setSelectedPerson(groupKey, index) {
      this.selectedGroup = groupKey;
      this.selectedPersonIndex = index;
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
        visible: true,
        links: []
      };
      this.people[this.selectedGroup].push(person);
      this.selectedPersonIndex = this.people[this.selectedGroup].length - 1;
    },
    changeSelectedPersonGroup(groupKey) {
      if (!groupKey || groupKey === this.selectedGroup || !this.selectedPerson) {
        return;
      }
      const option = this.groupOptions.find(group => group.key === groupKey);
      if (!option) {
        return;
      }
      const person = this.selectedPerson;
      this.people[this.selectedGroup].splice(this.selectedPersonIndex, 1);
      if (!Array.isArray(this.people[groupKey])) {
        this.people[groupKey] = [];
      }
      person.role = option.role;
      this.people[groupKey].push(person);
      this.selectedGroup = groupKey;
      this.selectedPersonIndex = this.people[groupKey].length - 1;
    },
    confirmDelete(itemType, itemName) {
      const label = (itemName || `Untitled ${itemType}`).toString().trim();
      return window.confirm([
        `Delete this ${itemType}?`,
        "",
        label,
        "",
        "This removes it from the editor. Click Save to persist the change."
      ].join("\n"));
    },
    deletePerson() {
      if (!this.selectedPerson || !this.confirmDelete("person", this.selectedPerson.name)) {
        return;
      }
      this.people[this.selectedGroup].splice(this.selectedPersonIndex, 1);
      this.clampSelections();
      this.message = "Person removed from the editor. Click Save people to keep the change.";
    },
    tabLabel(id) {
      const labels = {
        people: "People",
        publications: "Publications",
        teaching: "Teaching",
        events: "Events"
      };
      return labels[id] || id;
    },
    addEvent() {
      this.content.events.items.push({
        title: "",
        titleSK: "",
        description: "",
        descriptionSK: "",
        url: "",
        visible: true
      });
      this.selectedEventIndex = this.content.events.items.length - 1;
    },
    deleteEvent() {
      const title = this.selectedEvent && (this.selectedEvent.title || this.selectedEvent.titleSK);
      if (!this.selectedEvent || !this.confirmDelete("event", title)) {
        return;
      }
      this.content.events.items.splice(this.selectedEventIndex, 1);
      this.clampSelections();
      this.message = "Event removed from the editor. Click Save content to keep the change.";
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
          this.fetchAudit();
        })
        .catch(error => {
          this.error = error.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    saveContent() {
      this.loading = true;
      this.error = "";
      this.adminPost("/api/admin/content/save", { content: this.content })
        .then(response => {
          this.content = this.normalizeContent(response.content);
          this.clampSelections();
          this.message = "Content was saved.";
          this.fetchAudit();
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
      if (!this.selectedPublication || !this.confirmDelete("publication", this.selectedPublication.title)) {
        return;
      }
      this.publications.splice(this.selectedPublicationIndex, 1);
      this.clampSelections();
      this.message = "Publication removed from the editor. Click Save publications to keep the change.";
    },
    savePublications() {
      this.loading = true;
      this.error = "";
      this.adminPost("/api/admin/publications/save", { publications: this.publications })
        .then(response => {
          this.publications = response.publications || [];
          this.publicationMeta = response.publicationMeta || this.publicationMeta;
          this.clampSelections();
          this.message = "Publications were saved.";
          this.fetchAudit();
        })
        .catch(error => {
          this.error = error.message;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    syncPublications(refreshAuthors) {
      const label = refreshAuthors ? "refresh OpenAlex author matching and sync publications" : "sync publications from OpenAlex";
      if (!window.confirm(`Start ${label}?`)) {
        return;
      }
      this.loading = true;
      this.error = "";
      this.message = "OpenAlex sync is running...";
      this.adminPost("/api/publications/sync", { refreshAuthors })
        .then(response => {
          this.publications = Array.isArray(response.publications) ? response.publications : this.publications;
          this.publicationMeta = response.meta || this.publicationMeta;
          this.clampSelections();
          this.message = `OpenAlex sync finished with ${this.publications.length} publications.`;
          return this.fetchAudit();
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
    },
    formatFullTime(timestamp) {
      if (!timestamp) {
        return "";
      }
      const date = new Date(timestamp);
      return date.toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    formatDetails(details) {
      if (!details || typeof details !== "object") {
        return "";
      }
      return Object.entries(details)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
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

.file-input-hidden {
  display: none;
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
.settings-card,
.sync-card,
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
.settings-card,
.sync-card,
.editor-list,
.edit-form {
  padding: 18px;
}

.chart-card,
.recent-card,
.settings-card,
.sync-card {
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

.list-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--muted);
  font-size: 0.84rem;
  font-weight: 800;
  text-transform: uppercase;
}

.list-summary strong {
  min-width: 30px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: var(--ink);
  padding: 4px 8px;
  text-align: center;
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

.toggle-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.sync-card {
  display: grid;
  gap: 14px;
}

.sync-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.sync-heading h3 {
  margin: 0;
}

.sync-heading span {
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 700;
}

.sync-metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.sync-metrics article {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  background: #ffffff;
  padding: 11px;
  display: grid;
  gap: 6px;
}

.sync-metrics span,
.sync-row small {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.sync-metrics strong {
  color: var(--ink);
  font-size: 1.15rem;
}

.sync-history {
  display: grid;
  gap: 6px;
}

.sync-row {
  display: grid;
  grid-template-columns: minmax(140px, 0.9fr) 60px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  padding-top: 7px;
}

.sync-row span,
.sync-row strong {
  color: var(--ink);
  font-size: 0.86rem;
  font-weight: 800;
}

.check-row {
  display: inline-flex;
  grid-template-columns: none;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  padding: 9px 12px;
}

.check-row input {
  width: auto;
  min-width: 16px;
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

.audit-meta {
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 800;
  margin-bottom: 12px;
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
  .sync-metrics,
  .toggle-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .sync-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .section-tabs {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-radius: 14px;
    width: 100%;
  }

  .section-tabs button {
    border-radius: 10px;
  }

  table {
    min-width: 0;
  }

  thead {
    display: none;
  }

  table,
  tbody,
  tr,
  td {
    display: block;
    width: 100%;
  }

  tbody tr {
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 8px;
    background: #ffffff;
    margin-bottom: 10px;
    padding: 8px 10px;
  }

  td {
    border-bottom: 0;
    display: grid;
    grid-template-columns: minmax(90px, 0.38fr) minmax(0, 1fr);
    gap: 10px;
    padding: 7px 0;
    white-space: normal;
    overflow-wrap: anywhere;
  }

  td::before {
    content: attr(data-label);
    color: var(--ink);
    font-weight: 800;
  }

  td:last-child {
    max-width: none;
    white-space: normal;
  }
}
</style>
