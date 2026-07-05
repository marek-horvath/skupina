<template>
  <div class="publications-section">
    <h2>{{ language === "sk" ? "Časová os publikácií" : "Publications Timeline" }}</h2>
    <div class="legend">
      <span class="legend-item">
        <span class="legend-swatch conference"></span>
        {{ language === "sk" ? "Konferencia" : "Conference" }}
      </span>
      <span class="legend-item">
        <span class="legend-swatch journal"></span>
        {{ language === "sk" ? "Časopis" : "Journal" }}
      </span>
    </div>
    <div class="publication-filters">
      <input
        v-model="searchQuery"
        type="search"
        :placeholder="language === 'sk' ? 'Názov, autor, miesto...' : 'Title, author, venue...'"
      />
      <select v-model="yearFilter">
        <option value="">{{ language === "sk" ? "Všetky roky" : "All years" }}</option>
        <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
      </select>
      <select v-model="typeFilter">
        <option value="">{{ language === "sk" ? "Všetky typy" : "All types" }}</option>
        <option value="conference">{{ language === "sk" ? "Konferencia" : "Conference" }}</option>
        <option value="journal">{{ language === "sk" ? "Časopis" : "Journal" }}</option>
        <option value="book">{{ language === "sk" ? "Kniha" : "Book" }}</option>
        <option value="other">{{ language === "sk" ? "Iné" : "Other" }}</option>
      </select>
    </div>
    <div v-if="visibleGroups.length" class="timeline">
      <div class="year-group" v-for="group in visibleGroups" :key="group.year">
        <div class="year-label">{{ group.year }}</div>
        <div
          class="timeline-item"
          v-for="(pub, index) in group.items"
          :key="index"
          :style="{ '--i': index }"
        >
          <div class="timeline-item-connector"></div>
          <div
            class="timeline-content"
            :class="typeClass(pub.type)"
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
    <p v-else class="publication-empty">{{ language === "sk" ? "Nenašli sa žiadne publikácie." : "No publications found." }}</p>
    <div v-if="hasMore" ref="loadMore" class="load-more">{{ language === "sk" ? "Načítavam..." : "Loading more..." }}</div>
  </div>
</template>

<script>
export default {
  name: "PublicationsTab",
  emits: ["analytics"],
  props: {
    groupedPublications: {
      type: Array,
      required: true
    },
    language: {
      type: String,
      default: "en"
    }
  },
  data() {
    return {
      visibleCount: 10,
      pageSize: 10,
      observer: null,
      searchQuery: "",
      yearFilter: "",
      typeFilter: ""
    };
  },
  computed: {
    flatItems() {
      const items = [];
      this.groupedPublications.forEach(group => {
        group.items.forEach(pub => {
          items.push({ year: group.year, pub });
        });
      });
      return items;
    },
    filteredFlatItems() {
      const query = this.searchQuery.toLowerCase().trim();
      return this.flatItems.filter(item => {
        const pub = item.pub;
        const type = this.normalizedType(pub.type);
        const normalizedFilterType = this.typeFilter === "other" ? "" : this.typeFilter;
        const matchesQuery = !query || [
          pub.title,
          pub.authors,
          pub.venue,
          pub.date,
          pub.type
        ].join(" ").toLowerCase().includes(query);
        const matchesYear = !this.yearFilter || item.year === this.yearFilter;
        const matchesType = !this.typeFilter || type === normalizedFilterType;
        return matchesQuery && matchesYear && matchesType;
      });
    },
    yearOptions() {
      return Array.from(new Set(this.flatItems.map(item => item.year))).sort((a, b) => Number(b) - Number(a));
    },
    visibleGroups() {
      const groups = {};
      this.filteredFlatItems.slice(0, this.visibleCount).forEach(item => {
        if (!groups[item.year]) {
          groups[item.year] = [];
        }
        groups[item.year].push(item.pub);
      });
      return Object.keys(groups)
        .sort((a, b) => b - a)
        .map(year => ({ year, items: groups[year] }));
    },
    hasMore() {
      return this.visibleCount < this.filteredFlatItems.length;
    }
  },
  watch: {
    groupedPublications() {
      this.visibleCount = 10;
      this.$nextTick(() => {
        this.setupObserver();
      });
    },
    searchQuery() {
      this.resetVisibleItems();
    },
    yearFilter() {
      this.resetVisibleItems();
    },
    typeFilter() {
      this.resetVisibleItems();
    }
  },
  methods: {
    normalizedType(value) {
      return value ? value.toString().trim().toLowerCase() : "";
    },
    typeClass(value) {
      const normalized = this.normalizedType(value);
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
    resetVisibleItems() {
      this.visibleCount = 10;
      this.$nextTick(() => {
        this.setupObserver();
      });
    },
    setupObserver() {
      if (!("IntersectionObserver" in window)) {
        return;
      }
      if (this.observer) {
        this.observer.disconnect();
      }
      const target = this.$refs.loadMore;
      if (!target || !this.hasMore) {
        return;
      }
      this.observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            this.visibleCount = Math.min(this.visibleCount + this.pageSize, this.flatItems.length);
          }
        },
        { rootMargin: "200px" }
      );
      this.observer.observe(target);
    },
    openPublication(publication) {
      const url = typeof publication === "string" ? publication : publication.link;
      if (!url) {
        return;
      }
      if (typeof publication !== "string") {
        this.$emit("analytics", {
          action: "publication_open",
          label: publication.title,
          target: url,
          metadata: { venue: publication.venue || "" }
        });
      }
      window.open(url, "_blank");
    }
  },
  mounted() {
    this.setupObserver();
  },
  updated() {
    this.setupObserver();
  },
  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
};
</script>

<style scoped>
.publications-section {
  color: var(--ink, #0f172a);
  display: grid;
  gap: 16px;
  background: #ffffff;
  border-radius: 14px;
  position: relative;
  isolation: isolate;
}

.publications-section > * {
  position: relative;
  z-index: 1;
}

.publications-section h2 {
  text-align: left;
  margin-bottom: 8px;
  font-size: 1.5rem;
  color: var(--ink, #0f172a);
}

.legend {
  display: flex;
  gap: 16px;
  align-items: center;
  font-size: 0.85rem;
  color: var(--muted, #4b5563);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.publication-filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(120px, 0.35fr) minmax(140px, 0.4fr);
  gap: 10px;
}

.publication-filters input,
.publication-filters select {
  width: 100%;
  min-width: 0;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 8px;
  background: #ffffff;
  color: var(--ink, #0f172a);
  font: inherit;
  font-size: 0.9rem;
  padding: 10px 12px;
}

.publication-filters input:focus,
.publication-filters select:focus {
  outline: 2px solid rgba(15, 118, 110, 0.3);
  outline-offset: 1px;
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

.timeline {
  position: relative;
  margin: 0;
  max-width: 100%;
  width: 100%;
  padding: 8px 0 8px 56px;
  background: #ffffff;
}

.timeline::before {
  content: "";
  position: absolute;
  left: 34px;
  top: 0;
  bottom: 0;
  width: 4px;
  background: rgba(15, 118, 110, 0.35);
  border-radius: 999px;
}

.year-group {
  margin-bottom: 36px;
}

.year-label {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent-2, #0f766e);
  margin-bottom: 14px;
  text-align: left;
}

.timeline-item {
  position: relative;
  margin-bottom: 18px;
  padding-left: 28px;
  animation: riseIn 0.5s ease both;
  animation-delay: calc(var(--i) * 0.04s);
  display: flex;
  justify-content: flex-start;
}

.timeline-item-connector {
  position: absolute;
  left: -6px;
  top: 50%;
  width: 12px;
  height: 12px;
  background: var(--accent, #f15a29);
  border-radius: 50%;
  border: 3px solid var(--paper, #ffffff);
  transform: translateY(-50%);
}

.timeline-content {
  background: var(--paper, #ffffff);
  padding: 12px 16px 13px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  box-shadow: none;
  width: 60%;
  max-width: 640px;
  margin: 0;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

.timeline-content:hover {
  transform: scale(1.05);
  box-shadow: 0 28px 46px rgba(15, 23, 42, 0.26);
}

.timeline-content:focus-visible {
  outline: 2px solid rgba(15, 118, 110, 0.7);
  outline-offset: 2px;
}

.timeline-content.type-conference {
  background: #e7f2ff;
  border-color: rgba(59, 130, 246, 0.3);
}

.timeline-content.type-journal {
  background: #e7f7ee;
  border-color: rgba(16, 185, 129, 0.3);
}

.pub-authors {
  font-size: 0.82rem;
  color: var(--muted, #4b5563);
  display: block;
  margin-bottom: 4px;
  text-transform: none;
}

.pub-title {
  font-size: 1rem;
  color: var(--ink, #0f172a);
  margin-bottom: 4px;
  font-weight: 600;
}

.pub-venue a {
  font-size: 0.85rem;
  color: var(--accent-2, #0f766e);
  text-decoration: none;
  transition: color 0.3s;
}

.pub-venue a:hover {
  color: var(--accent, #f15a29);
}

.load-more {
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted, #4b5563);
  padding: 6px 0 2px;
}

.publication-empty {
  color: var(--muted, #4b5563);
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .timeline {
    padding: 0 6px;
  }

  .timeline::before {
    display: none;
  }

  .timeline-item {
    padding-left: 0;
  }

  .timeline-item-connector {
    display: none;
  }

  .timeline-content {
    width: 100%;
    max-width: none;
    margin: 0;
  }

  .year-label {
    transform: translateX(-5%);
  }

  .timeline-item {
    transform: translateX(-5%);
  }

  .timeline-content {
    transform: translateX(-5%);
  }

  .legend {
    flex-wrap: wrap;
  }

  .publication-filters {
    grid-template-columns: 1fr;
  }
}
</style>
