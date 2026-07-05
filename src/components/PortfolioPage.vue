<template>
  <div class="portfolio-wrapper">
    <!-- Background particles -->
    <div id="particles-js"></div>

    <!-- Main content area -->
    <div class="portfolio-content">
      <!-- Header with fade effect -->
      <header class="header">
        <div class="container">
          <div class="header-top">
            <div class="eyebrow">{{ t("research_group") }}</div>
            <div class="lang-switch" role="group" :aria-label="t('language_switch')">
              <button type="button" :class="{ active: language === 'sk' }" @click="setLanguage('sk')">SK</button>
              <button type="button" :class="{ active: language === 'en' }" @click="setLanguage('en')">EN</button>
            </div>
          </div>
          <h1 class="group-title">{{ groupName }}</h1>
          <p class="group-desc">{{ groupDescription }}</p>
          <div class="stats">
            <div class="stat">
              <span class="stat-value">{{ totalPeople }}</span>
              <span class="stat-label">{{ t("people") }}</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ totalPublications }}</span>
              <span class="stat-label">{{ t("publications") }}</span>
            </div>
          </div>
          <div class="affiliation">
            <div class="logos">
              <img :src="getImage('tuke-logo.png')" alt="TUKE Logo" class="logo" decoding="async" />
              <img :src="getImage('kpi-logo.png')" alt="KPI TUKE Logo" class="logo" decoding="async" />
            </div>
            <p class="affiliation-text">{{ t("affiliation") }}</p>
          </div>
        </div>
      </header>

      <!-- Tabs for switching between site sections -->
      <TabNav v-model="tabModel" :tabs="localizedTabs" />

      <!-- Main content (People or Publications) -->
      <div class="container content">
        <div v-if="selectedPerson" class="person-detail">
          <button type="button" class="person-back-btn" @click="closePerson">
            {{ t("back_to_people") }}
          </button>
          <div class="person-hero">
            <img
              :src="getImage(selectedPerson.image)"
              :alt="selectedPerson.name"
              class="person-photo"
              loading="lazy"
              decoding="async"
            />
            <div class="person-meta">
              <div class="person-name-row">
                <h2>{{ selectedPerson.name }}</h2>
                <a
                  v-if="personLinkedin(selectedPerson)"
                  :href="personLinkedin(selectedPerson)"
                  target="_blank"
                  class="person-linkedin"
                  @click="trackPersonDetailLink(selectedPerson, 'LinkedIn', personLinkedin(selectedPerson))"
                  :aria-label="t('linkedin_profile')"
                >
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                    alt="LinkedIn"
                    class="linkedin-logo"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                <a
                  v-if="personOrcid(selectedPerson)"
                  :href="personOrcid(selectedPerson)"
                  target="_blank"
                  class="person-linkedin"
                  @click="trackPersonDetailLink(selectedPerson, 'ORCID', personOrcid(selectedPerson))"
                  :aria-label="t('orcid_profile')"
                >
                  <img :src="getImage('orcid.png')" alt="ORCID" class="profile-social-icon" loading="lazy" decoding="async" />
                </a>
                <a
                  v-if="personWeb(selectedPerson)"
                  :href="personWeb(selectedPerson)"
                  target="_blank"
                  class="person-linkedin"
                  @click="trackPersonDetailLink(selectedPerson, 'Web', personWeb(selectedPerson))"
                  :aria-label="t('personal_website')"
                >
                  <img :src="getImage('web.png')" :alt="t('website')" class="profile-social-icon" loading="lazy" decoding="async" />
                </a>
              </div>
              <p v-if="selectedPerson.role" class="person-role">{{ localizedRole(selectedPerson.role) }}</p>
              <p class="person-email">{{ selectedPerson.email }}</p>
              <p class="person-info">{{ personInfo(selectedPerson) }}</p>
            </div>
          </div>

          <div class="person-publications">
            <h2>{{ t("publications") }}</h2>
            <div class="legend">
              <span class="legend-item">
                <span class="legend-swatch conference"></span>
                {{ t("conference") }}
              </span>
              <span class="legend-item">
                <span class="legend-swatch journal"></span>
                {{ t("journal") }}
              </span>
            </div>
            <div v-if="groupedSelectedPublicationsVisible.length" class="person-timeline">
              <div class="year-group" v-for="group in groupedSelectedPublicationsVisible" :key="group.year">
                <div class="year-label">{{ group.year }}</div>
                <div class="person-timeline-item" v-for="(pub, index) in group.items" :key="index" :style="{ '--i': index }">
                  <div class="person-timeline-connector"></div>
                  <div
                    class="person-timeline-content"
                    :class="publicationTypeClass(pub.type)"
                    role="button"
                    tabindex="0"
                    @click="openPublication(pub)"
                    @keydown.enter="openPublication(pub)"
                  >
                    <small class="pub-authors">{{ formatAuthors(pub.authors) }}</small>
                    <div class="pub-title">{{ pub.title }}</div>
                    <small class="pub-venue">
                      <a :href="pub.link" target="_blank" @click.stop>{{ pub.venue }}</a>
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="hasMoreSelectedPublications" ref="personLoadMore" class="person-load-more">{{ language === "sk" ? "Načítavam..." : "Loading more..." }}</div>
          </div>
        </div>
        <template v-else>
          <PeopleTab
            v-if="activeTab === 'people'"
            :people="visiblePeople"
            :language="language"
            :getImage="getImage"
            @select="openPerson"
            @analytics="handleAnalytics"
          />
          <PublicationsTab
            v-else-if="activeTab === 'publications'"
            :groupedPublications="groupedPublications"
            :language="language"
            @analytics="handleAnalytics"
          />
          <TeachingTab v-else-if="activeTab === 'teaching'" :subjects="teachingSubjects" :language="language" />
          <EventsTab
            v-else-if="activeTab === 'events'"
            :events="eventsContent"
            :language="language"
            @analytics="handleAnalytics"
          />
        </template>
      </div> <!-- .content -->

      <footer class="footer">
        <span v-if="lastUpdatedDate">{{ t("last_updated") }}: {{ lastUpdatedDate }}</span>
        <span v-if="lastUpdatedDate" class="footer-separator" aria-hidden="true">/</span>
        <span>
          {{ t("developed_by") }}
          <a href="https://marek-horvath.github.io/portfolio/seug" target="_blank" rel="noopener">Marek Horváth</a>
        </span>
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
import EventsTab from "./EventsTab.vue";
/* global particlesJS */

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production" ? "https://seug-api.167.233.132.16.sslip.io" : "");
const APP_BASE_PATH = (process.env.BASE_URL || "/").replace(/\/+$/, "");
const SITE_URL = (process.env.VUE_APP_SITE_URL || "https://marek-horvath.github.io/skupina").replace(/\/+$/, "");
const imageAssets = require.context("../assets", false, /\.(png|jpe?g)$/);

const defaultContent = () => ({
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

export default {
  name: "ResearchGroup",
  components: {
    TabNav,
    PeopleTab,
    PublicationsTab,
    TeachingTab,
    EventsTab
  },
  data() {
    return {
      activeTab: "people",
      language: "en",
      people: {
        professor: [],
        associateProfessor: [],
        researchAssistants: [],
        phdCandidates: [],
        exMembers: [],
        students: []
      },
      content: defaultContent(),
      teachingSubjects: [],
      publications: [],
      contentMeta: {},
      currentSlug: "",
      suppressRouteSync: false,
      personVisibleCount: 10,
      personPageSize: 10,
      personObserver: null
    };
  },
  watch: {
    activeTab() {
      if (!this.suppressRouteSync && !this.selectedPerson) {
        const nextPath = this.activeTab === "people" ? "/" : `/${this.activeTab}`;
        window.history.pushState({}, "", this.appPath(nextPath));
      }
      this.$nextTick(() => {
        window.dispatchEvent(new Event("resize"));
        this.updateSeoMeta();
      });
    },
    language() {
      this.$nextTick(() => {
        this.updateSeoMeta();
      });
    },
    selectedPerson() {
      this.personVisibleCount = 10;
      this.$nextTick(() => {
        this.setupPersonObserver();
        this.updateSeoMeta();
      });
    }
  },
  computed: {
    localizedTabs() {
      return this.content.tabs
        .filter(tab => tab.visible !== false)
        .map(tab => ({
          id: tab.id,
          label: this.t(tab.id)
        }));
    },
    eventsContent() {
      return this.content.events || defaultContent().events;
    },
    lastUpdatedDate() {
      const timestamp = this.contentMeta && this.contentMeta.updatedAt;
      if (!timestamp) {
        return "";
      }
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      return date.toLocaleDateString(this.language === "sk" ? "sk-SK" : "en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    },
    visiblePeople() {
      return {
        professor: this.visibleList(this.people.professor),
        associateProfessor: this.visibleList(this.people.associateProfessor),
        researchAssistants: this.visibleList(this.people.researchAssistants),
        phdCandidates: this.visibleList(this.people.phdCandidates),
        exMembers: this.visibleList(this.people.exMembers),
        students: this.visibleList(this.people.students)
      };
    },
    groupName() {
      return this.language === "sk"
        ? "Skupina softvérového inžinierstva a použiteľnosti"
        : "Software Engineering and Usability Group";
    },
    groupDescription() {
      return this.language === "sk"
        ? `Zameriavame sa na interakciu medzi človekom a počítačom v dvoch rovinách:
- Tvorba softvéru ľuďmi (Softvérové inžinierstvo)
- Používanie softvéru ľuďmi (Použiteľnosť)`
        : `We focus on the interaction between humans and computers in two dimensions:
- Software creation by humans (Software Engineering)
- Software usage by humans (Usability)`;
    },
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
        this.visiblePeople.professor.length +
        this.visiblePeople.associateProfessor.length +
        this.visiblePeople.researchAssistants.length +
        this.visiblePeople.phdCandidates.length
      );
    },
    totalPublications() {
      return this.publications.length;
    },
    allPeople() {
      return [
        ...this.visiblePeople.professor,
        ...this.visiblePeople.associateProfessor,
        ...this.visiblePeople.researchAssistants,
        ...this.visiblePeople.phdCandidates
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
    flatSelectedPublications() {
      const items = [];
      this.groupedSelectedPublications.forEach(group => {
        group.items.forEach(pub => {
          items.push({ year: group.year, pub });
        });
      });
      return items;
    },
    groupedSelectedPublicationsVisible() {
      const groups = {};
      this.flatSelectedPublications.slice(0, this.personVisibleCount).forEach(item => {
        if (!groups[item.year]) {
          groups[item.year] = [];
        }
        groups[item.year].push(item.pub);
      });
      return Object.keys(groups)
        .sort((a, b) => b - a)
        .map(year => ({ year, items: groups[year] }));
    },
    hasMoreSelectedPublications() {
      return this.personVisibleCount < this.flatSelectedPublications.length;
    },
    seoPath() {
      if (this.selectedPerson) {
        return `/${this.currentSlug}`;
      }
      return this.activeTab === "people" ? "/" : `/${this.activeTab}`;
    },
    seoPageCopy() {
      const pages = {
        en: {
          people: {
            title: "People",
            description: "Meet the Software Engineering and Usability Group at KPI FEI TUKE: professors, research assistants, PhD candidates, students, and alumni."
          },
          publications: {
            title: "Publications",
            description: "Browse SEUG publications by author, year, and type, including OpenAlex-backed research outputs from KPI FEI TUKE."
          },
          teaching: {
            title: "Teaching",
            description: "Explore teaching subjects connected with software engineering, usability, programming, and applied computer science at KPI FEI TUKE."
          },
          events: {
            title: "Events",
            description: "See SEUG events and community formats including Live IT Projects, Game Jams, hackathons, Namakaný deň, and KPI press links."
          }
        },
        sk: {
          people: {
            title: "Ľudia",
            description: "Spoznajte Skupinu softvérového inžinierstva a použiteľnosti na KPI FEI TUKE: profesorov, odborných asistentov, doktorandov, študentov a bývalých členov."
          },
          publications: {
            title: "Publikácie",
            description: "Prehľad publikácií SEUG podľa autora, roku a typu vrátane výstupov synchronizovaných cez OpenAlex."
          },
          teaching: {
            title: "Pedagogika",
            description: "Predmety a výučba spojené so softvérovým inžinierstvom, použiteľnosťou, programovaním a aplikovanou informatikou na KPI FEI TUKE."
          },
          events: {
            title: "Udalosti",
            description: "Udalosti a komunitné formáty SEUG vrátane Live IT Projects, Game Jamov, hackathonov, Namakaného dňa a tlačových správ KPI."
          }
        }
      };
      const localePages = pages[this.language] || pages.en;
      return localePages[this.activeTab] || localePages.people;
    },
    seoTitle() {
      if (this.selectedPerson) {
        const role = this.localizedRole(this.selectedPerson.role);
        return role ? `${this.selectedPerson.name} - ${role} | SEUG` : `${this.selectedPerson.name} | SEUG`;
      }
      return `${this.seoPageCopy.title} | SEUG`;
    },
    seoDescription() {
      if (this.selectedPerson) {
        const role = this.localizedRole(this.selectedPerson.role);
        const info = this.personInfo(this.selectedPerson);
        if (info) {
          return role ? `${this.selectedPerson.name}, ${role}. ${info}` : `${this.selectedPerson.name}. ${info}`;
        }
        return this.language === "sk"
          ? `${this.selectedPerson.name} v Skupine softvérového inžinierstva a použiteľnosti.`
          : `${this.selectedPerson.name} in the Software Engineering and Usability Group.`;
      }
      return this.seoPageCopy.description;
    },
    canonicalUrl() {
      return `${SITE_URL}${this.seoPath === "/" ? "/" : this.seoPath}`;
    },
    tabModel: {
      get() {
        return this.selectedPerson ? "" : this.activeTab;
      },
      set(value) {
        this.currentSlug = "";
        if (value && value !== this.activeTab) {
          const tab = this.localizedTabs.find(item => item.id === value);
          this.trackEvent({
            action: "tab_select",
            label: tab ? tab.label : value,
            target: value
          });
        }
        this.activeTab = value || "people";
      }
    }
  },
  methods: {
    appPath(path) {
      const normalized = path.startsWith("/") ? path : `/${path}`;
      return `${APP_BASE_PATH}${normalized}`;
    },
    currentRoutePath() {
      let pathname = window.location.pathname;
      if (APP_BASE_PATH && (pathname === APP_BASE_PATH || pathname.startsWith(`${APP_BASE_PATH}/`))) {
        pathname = pathname.slice(APP_BASE_PATH.length) || "/";
      }
      return pathname;
    },
    localizedRole(role) {
      const roles = {
        en: {
          Professor: "Professor",
          "Associate Professor": "Associate Professor",
          "Research Assistant": "Research Assistant",
          "PhD Candidate": "PhD Candidate",
          Student: "Student",
          Ex: "Former member"
        },
        sk: {
          Professor: "Profesor",
          "Associate Professor": "Docent",
          "Research Assistant": "Odborný asistent",
          "PhD Candidate": "Doktorand",
          Student: "Študent",
          Ex: "Bývalý člen"
        }
      };
      const localeRoles = roles[this.language] || roles.en;
      return localeRoles[role] || role || "";
    },
    t(key) {
      const dictionary = {
        en: {
          research_group: "Research Group",
          people: "People",
          publications: "Publications",
          teaching: "Teaching",
          events: "Events",
          conference: "Conference",
          journal: "Journal",
          last_updated: "Last updated",
          developed_by: "Developed by",
          language_switch: "Language switch",
          back_to_people: "Back to people",
          linkedin_profile: "LinkedIn profile",
          orcid_profile: "ORCID profile",
          personal_website: "Personal website",
          website: "Website",
          affiliation: "Technical University of Košice - Faculty of Electrical Engineering and Informatics",
          footer_text: "We are part of the Technical University of Košice and the Faculty of Electrical Engineering and Informatics."
        },
        sk: {
          research_group: "Výskumná skupina",
          people: "Ľudia",
          publications: "Publikácie",
          teaching: "Pedagogika",
          events: "Udalosti",
          conference: "Konferencia",
          journal: "Časopis",
          last_updated: "Aktualizované",
          developed_by: "Vytvoril",
          language_switch: "Prepínač jazyka",
          back_to_people: "Späť na ľudí",
          linkedin_profile: "LinkedIn profil",
          orcid_profile: "ORCID profil",
          personal_website: "Osobná stránka",
          website: "Webstránka",
          affiliation: "Technická univerzita v Košiciach - Fakulta elektrotechniky a informatiky",
          footer_text: "Sme súčasťou Technickej univerzity v Košiciach a Fakulty elektrotechniky a informatiky."
        }
      };
      return (dictionary[this.language] && dictionary[this.language][key]) || dictionary.en[key] || key;
    },
    setLanguage(lang) {
      this.language = lang;
      this.trackEvent({
        action: "language_switch",
        label: lang.toUpperCase(),
        target: lang
      });
    },
    personInfo(person) {
      if (!person) {
        return "";
      }
      if (this.language === "sk" && person.infoSK) {
        return person.infoSK;
      }
      return person.info || "";
    },
    visibleList(items) {
      return Array.isArray(items) ? items.filter(item => item.visible !== false) : [];
    },
    getImage(filename) {
      if (!filename) {
        return "";
      }
      const normalized = filename.replace(/^\.?\//, "");
      const originalPath = `./${normalized}`;

      try {
        return imageAssets(originalPath);
      } catch (error) {
        return "";
      }
    },
    setMetaTag(attribute, key, content) {
      if (!content) {
        return;
      }
      let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    },
    setCanonicalLink(url) {
      let element = document.head.querySelector('link[rel="canonical"]');
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", "canonical");
        document.head.appendChild(element);
      }
      element.setAttribute("href", url);
    },
    updateSeoMeta() {
      const description = this.seoDescription.replace(/\s+/g, " ").trim();
      document.documentElement.lang = this.language === "sk" ? "sk" : "en";
      document.title = this.seoTitle;
      this.setMetaTag("name", "description", description);
      this.setMetaTag("name", "robots", "index,follow");
      this.setMetaTag("property", "og:title", this.seoTitle);
      this.setMetaTag("property", "og:description", description);
      this.setMetaTag("property", "og:type", "website");
      this.setMetaTag("property", "og:url", this.canonicalUrl);
      this.setMetaTag("property", "og:locale", this.language === "sk" ? "sk_SK" : "en_GB");
      this.setMetaTag("property", "og:site_name", "Software Engineering and Usability Group");
      this.setCanonicalLink(this.canonicalUrl);
    },
    setRouteFromPath() {
      const part = this.currentRoutePath().replace(/^\/+/, "").split("/")[0];
      this.suppressRouteSync = true;
      if (["publications", "teaching", "events"].includes(part)) {
        this.currentSlug = "";
        this.activeTab = part;
      } else if (part) {
        this.currentSlug = part;
      } else {
        this.currentSlug = "";
        this.activeTab = "people";
      }
      this.ensureActiveTabVisible();
      this.$nextTick(() => {
        this.suppressRouteSync = false;
        this.updateSeoMeta();
      });
    },
    ensureActiveTabVisible() {
      if (this.currentSlug) {
        return;
      }
      const firstVisible = this.localizedTabs[0];
      if (!this.localizedTabs.some(tab => tab.id === this.activeTab)) {
        this.activeTab = firstVisible ? firstVisible.id : "people";
      }
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
    personOrcid(person) {
      if (!person.links || !person.links.length) {
        return "";
      }
      const link = person.links.find(item => item.label && item.label.toLowerCase() === "orcid");
      return link ? link.url : "";
    },
    personWeb(person) {
      if (!person.links || !person.links.length) {
        return "";
      }
      const link = person.links.find(item => item.label && item.label.toLowerCase() === "web");
      return link ? link.url : "";
    },
    publicationTypeClass(value) {
      if (!value) {
        return "";
      }
      const normalized = value.toString().trim().toLowerCase();
      if (normalized === "conference") {
        return "type-conference";
      }
      if (normalized === "journal") {
        return "type-journal";
      }
      return "";
    },
    formatAuthors(authors) {
      const list = (authors || "")
        .split(";")
        .map(item => item.trim())
        .filter(Boolean);
      if (list.length <= 3) {
        return list.join("; ");
      }
      return `${list.slice(0, 3).join("; ")}; et al.`;
    },
    handleAnalytics(event) {
      this.trackEvent(event);
    },
    trackEvent(event) {
      const payload = {
        action: event.action || "unknown",
        label: event.label || "",
        target: event.target || "",
        metadata: event.metadata || {},
        language: this.language,
        path: window.location.pathname
      };

      fetch(this.apiUrl("/api/analytics/events"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(() => {});
    },
    trackPersonDetailLink(person, linkType, url) {
      this.trackEvent({
        action: "person_detail_link_open",
        label: person.name,
        target: url,
        metadata: { linkType }
      });
    },
    openPublication(publication) {
      const url = typeof publication === "string" ? publication : publication.link;
      if (!url) {
        return;
      }
      if (typeof publication !== "string") {
        this.trackEvent({
          action: "publication_open",
          label: publication.title,
          target: url,
          metadata: { venue: publication.venue || "" }
        });
      }
      window.open(url, "_blank");
    },
    apiUrl(path) {
      return `${API_BASE_URL}${path}`;
    },
    publicAssetUrl(path) {
      const base = process.env.BASE_URL || "/";
      return `${base.replace(/\/?$/, "/")}${path.replace(/^\/+/, "")}`;
    },
    ensureOk(response) {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response;
    },
    normalizePublicationsPayload(payload) {
      const rows = Array.isArray(payload) ? payload : (payload.publications || []);
      return rows
        .filter(row => row && row.date && row.title)
        .map(row => ({
          date: String(row.date || ""),
          title: row.title || "",
          authors: row.authors || "",
          venue: row.venue || "",
          link: row.link || row.doi || row.openalexId || "",
          type: row.type || "",
          doi: row.doi || "",
          openalexId: row.openalexId || ""
        }));
    },
    normalizePeoplePayload(payload) {
      const people = payload && payload.people ? payload.people : payload;
      const groups = {
        professor: [],
        associateProfessor: [],
        researchAssistants: [],
        phdCandidates: [],
        exMembers: [],
        students: []
      };

      if (!people || Array.isArray(people)) {
        return groups;
      }

      Object.keys(groups).forEach(key => {
        groups[key] = Array.isArray(people[key]) ? people[key] : [];
      });

      return groups;
    },
    normalizeContentPayload(payload) {
      const content = payload && payload.content ? payload.content : payload;
      const defaults = defaultContent();
      const incomingTabs = Array.isArray(content && content.tabs) ? content.tabs : [];
      const tabs = defaults.tabs.map(tab => {
        const incoming = incomingTabs.find(item => item.id === tab.id);
        return {
          ...tab,
          visible: incoming ? incoming.visible !== false : tab.visible
        };
      });
      const events = content && content.events ? content.events : {};
      const eventItems = Array.isArray(events.items) ? events.items : [];

      return {
        tabs,
        events: {
          ...defaults.events,
          ...events,
          items: eventItems.map(event => ({
            title: event.title || "",
            titleSK: event.titleSK || "",
            description: event.description || "",
            descriptionSK: event.descriptionSK || "",
            url: event.url || "",
            visible: event.visible !== false
          }))
        }
      };
    },
    loadPeople() {
      return fetch(this.apiUrl("/api/people"), { cache: "no-store" })
        .then(this.ensureOk)
        .then(response => response.json())
        .catch(() => fetch(this.publicAssetUrl("data/people.json"), { cache: "no-store" })
          .then(this.ensureOk)
          .then(response => response.json()))
        .then(payload => {
          this.people = this.normalizePeoplePayload(payload);
        })
        .catch(error => {
          console.error("Error loading people data:", error);
          this.people = this.normalizePeoplePayload(null);
        });
    },
    loadContent() {
      return fetch(this.apiUrl("/api/content"), { cache: "no-store" })
        .then(this.ensureOk)
        .then(response => response.json())
        .catch(() => fetch(this.publicAssetUrl("data/content.json"), { cache: "no-store" })
          .then(this.ensureOk)
          .then(response => response.json()))
        .then(payload => {
          this.content = this.normalizeContentPayload(payload);
          this.contentMeta = payload && payload.meta ? payload.meta : {};
          this.ensureActiveTabVisible();
        })
        .catch(error => {
          console.error("Error loading content data:", error);
          this.content = this.normalizeContentPayload(null);
          this.contentMeta = {};
        });
    },
    loadPublications() {
      return fetch(this.apiUrl("/api/publications"), { cache: "no-store" })
        .then(this.ensureOk)
        .then(response => response.json())
        .catch(() => fetch(this.publicAssetUrl("data/publications.json"), { cache: "no-store" })
          .then(this.ensureOk)
          .then(response => response.json()))
        .then(payload => {
          this.publications = this.normalizePublicationsPayload(payload);
        })
        .catch(error => {
          console.error("Error loading publications data:", error);
          this.publications = [];
        });
    },
    applyTeachingCsv(teachingCsvText) {
      const parsedTeaching = Papa.parse(teachingCsvText, { header: true, skipEmptyLines: true });
      this.teachingSubjects = parsedTeaching.data
        .filter(row => row.Name)
        .map(row => ({
          name: row.Name,
          nameSK: row.NameSK || "",
          description: row.Description || "",
          descriptionSK: row.DescriptionSK || "",
          link: row.Link || ""
        }));
    },
    isAuthorMatch(pub, person) {
      const authors = this.normalizeText(pub.authors || "");
      const fullName = this.normalizeText(person.name);
      const lastName = this.normalizeText(person.name.split(" ").slice(-1)[0]);
      return authors.includes(fullName) || authors.includes(lastName);
    },
    openPerson(person) {
      const slug = this.personSlug(person);
      this.trackEvent({
        action: "person_open",
        label: person.name,
        target: `/${slug}`,
        metadata: { role: person.role || "" }
      });
      window.history.pushState({}, "", this.appPath(`/${slug}`));
      this.currentSlug = slug;
      this.$nextTick(() => {
        this.updateSeoMeta();
      });
    },
    closePerson() {
      window.history.pushState({}, "", this.appPath("/"));
      this.currentSlug = "";
      this.activeTab = "people";
      this.$nextTick(() => {
        this.updateSeoMeta();
      });
    },
    setupPersonObserver() {
      if (!("IntersectionObserver" in window)) {
        return;
      }
      if (this.personObserver) {
        this.personObserver.disconnect();
      }
      const target = this.$refs.personLoadMore;
      if (!target || !this.hasMoreSelectedPublications) {
        return;
      }
      this.personObserver = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            this.personVisibleCount = Math.min(
              this.personVisibleCount + this.personPageSize,
              this.flatSelectedPublications.length
            );
          }
        },
        { rootMargin: "200px" }
      );
      this.personObserver.observe(target);
    }
  },
  mounted() {
    this.language = "en";
    this.setRouteFromPath();
    window.addEventListener("popstate", this.setRouteFromPath);
    const particlesConfig = `${process.env.BASE_URL || "/"}particles-config.json`;
    particlesJS.load("particles-js", particlesConfig, () => {
      console.log("Particles.js loaded!");
    });

    const teachingCSVUrl =
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ0yU5qib1xjuPlctizfGQFSpPsQ_TLgWFA59b7b3oFPxITDT8j3cV04p_O3yJtBKOBZa6ZarzRsKLi/pub?gid=1202110167&single=true&output=csv";

    Promise.all([
      fetch(teachingCSVUrl).then(response => response.text()),
      this.loadPeople(),
      this.loadContent(),
      this.loadPublications()
    ])
      .then(([teachingCsvText]) => {
        this.applyTeachingCsv(teachingCsvText);

        // Refresh particles after data changes resize the page.
        this.$nextTick(() => {
          window.dispatchEvent(new Event("resize"));
          this.updateSeoMeta();
        });
      })
      .catch(error => console.error("Error loading page data:", error));
  },
  beforeUnmount() {
    window.removeEventListener("popstate", this.setRouteFromPath);
    if (this.personObserver) {
      this.personObserver.disconnect();
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
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

.header-top {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lang-switch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(248, 250, 252, 0.14);
  border: 1px solid rgba(248, 250, 252, 0.2);
}

.lang-switch button {
  border: none;
  background: transparent;
  color: #e2e8f0;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 5px 9px;
  border-radius: 999px;
  cursor: pointer;
}

.lang-switch button.active {
  background: #ffffff;
  color: #0f172a;
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

.person-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  border: 1px solid rgba(15, 118, 110, 0.24);
  border-radius: 999px;
  background: #eef6f5;
  color: var(--accent-2);
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 8px 13px;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.person-back-btn:hover {
  background: var(--accent-2);
  border-color: var(--accent-2);
  color: #ffffff;
}

.person-publications {
  display: grid;
  gap: 12px;
}

.legend {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 0.85rem;
  color: var(--muted);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #ffffff;
}

.legend-swatch.conference {
  background: #e7f2ff;
  border-color: rgba(59, 130, 246, 0.3);
}

.legend-swatch.journal {
  background: #e7f7ee;
  border-color: rgba(16, 185, 129, 0.3);
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
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.person-timeline-content:hover {
  transform: scale(1.05);
  box-shadow: 0 28px 46px rgba(15, 23, 42, 0.26);
}

.person-timeline-content:focus-visible {
  outline: 2px solid rgba(15, 118, 110, 0.7);
  outline-offset: 2px;
}

.person-timeline-content.type-conference {
  background: #e7f2ff;
  border-color: rgba(59, 130, 246, 0.3);
}

.person-timeline-content.type-journal {
  background: #e7f7ee;
  border-color: rgba(16, 185, 129, 0.3);
}

@media (max-width: 768px) {
  .person-timeline {
    padding-left: 0;
  }

  .person-timeline::before,
  .person-timeline-connector {
    display: none;
  }

  .person-timeline-item {
    padding-left: 0;
  }
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
  flex: 1 1 260px;
}

.person-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.person-linkedin {
  display: inline-flex;
  align-items: center;
}

.profile-social-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.person-name-row h2 {
  font-size: 1.6rem;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.person-role {
  width: fit-content;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.1);
  color: var(--accent-2);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 5px 9px;
  text-transform: uppercase;
}

.person-email {
  color: var(--accent-2);
  font-size: 0.95rem;
  overflow-wrap: anywhere;
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

.person-load-more {
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted);
  padding: 6px 0 2px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 16px;
  padding: 8px 4px 0;
  color: rgba(75, 85, 99, 0.72);
  font-size: 0.78rem;
  line-height: 1.4;
}

.footer a {
  color: rgba(15, 118, 110, 0.86);
  font-weight: 700;
  text-decoration: none;
}

.footer a:hover {
  color: var(--accent);
}

.footer-separator {
  color: rgba(15, 23, 42, 0.24);
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
  .header-top {
    flex-direction: column;
    align-items: center;
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

  .content {
    margin-top: 14px;
    padding: 14px;
    border-radius: 14px;
  }

  .person-detail {
    gap: 18px;
  }

  .person-back-btn {
    width: 100%;
    justify-content: center;
  }

  .person-hero {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 12px;
    padding: 14px;
  }

  .person-photo {
    width: 104px;
    height: 104px;
  }

  .person-meta {
    width: 100%;
    min-width: 0;
    justify-items: center;
  }

  .person-name-row {
    justify-content: center;
    gap: 6px 8px;
  }

  .person-name-row h2 {
    font-size: 1.35rem;
  }

  .person-info {
    font-size: 0.9rem;
  }

  .legend {
    flex-wrap: wrap;
    justify-content: center;
  }

  .person-publications h2 {
    text-align: center;
  }

  .person-timeline-content:hover {
    transform: none;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  }
}

@media (max-width: 420px) {
  .portfolio-content {
    width: 100%;
    margin: 0;
    border-radius: 0;
    padding: 12px 10px 20px;
  }

  .header {
    border-radius: 14px;
  }

  .person-email {
    font-size: 0.86rem;
  }
}
</style>
