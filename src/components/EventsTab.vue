<template>
  <div class="events-section">
    <div class="events-heading">
      <h2>{{ language === "sk" ? "Udalosti" : "Events" }}</h2>
      <p>{{ introText }}</p>
      <a
        v-if="pressLinkUrl"
        :href="pressLinkUrl"
        target="_blank"
        class="press-link"
        @click="$emit('analytics', linkEvent(pressLinkLabel, pressLinkUrl, 'press'))"
      >
        {{ pressLinkLabel }}
      </a>
    </div>

    <div class="events-grid">
      <article
        v-for="(event, index) in visibleEvents"
        :key="`${event.title}-${index}`"
        class="event-card"
        :style="{ '--i': index }"
      >
        <h3>{{ eventTitle(event) }}</h3>
        <p>{{ eventDescription(event) }}</p>
        <a
          v-if="event.url"
          :href="event.url"
          target="_blank"
          class="event-link"
          @click="$emit('analytics', linkEvent(eventTitle(event), event.url, 'event'))"
        >
          {{ language === "sk" ? "Otvoriť" : "Open" }}
        </a>
      </article>
    </div>
  </div>
</template>

<script>
export default {
  name: "EventsTab",
  emits: ["analytics"],
  props: {
    events: {
      type: Object,
      required: true
    },
    language: {
      type: String,
      default: "en"
    }
  },
  computed: {
    introText() {
      if (this.language === "sk" && this.events.introSK) {
        return this.events.introSK;
      }
      return this.events.intro || "";
    },
    pressLinkLabel() {
      if (this.language === "sk" && this.events.pressLinkLabelSK) {
        return this.events.pressLinkLabelSK;
      }
      return this.events.pressLinkLabel || "KPI events";
    },
    pressLinkUrl() {
      return this.events.pressLinkUrl || "";
    },
    visibleEvents() {
      return Array.isArray(this.events.items)
        ? this.events.items.filter(event => event.visible !== false)
        : [];
    }
  },
  methods: {
    eventTitle(event) {
      if (this.language === "sk" && event.titleSK) {
        return event.titleSK;
      }
      return event.title || "";
    },
    eventDescription(event) {
      if (this.language === "sk" && event.descriptionSK) {
        return event.descriptionSK;
      }
      return event.description || "";
    },
    linkEvent(label, url, linkType) {
      return {
        action: "event_link_open",
        label,
        target: url,
        metadata: { linkType }
      };
    }
  }
};
</script>

<style scoped>
.events-section {
  color: var(--ink);
  display: grid;
  gap: 20px;
}

.events-heading {
  display: grid;
  gap: 10px;
  max-width: 760px;
}

.events-heading h2 {
  font-size: 1.5rem;
  color: var(--ink);
  margin: 0;
}

.events-heading p {
  color: var(--muted);
  line-height: 1.55;
  margin: 0;
}

.press-link,
.event-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.22);
  background: #eef6f5;
  color: var(--accent-2);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 700;
  padding: 8px 13px;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.press-link:hover,
.event-link:hover {
  background: var(--accent-2);
  border-color: var(--accent-2);
  color: #ffffff;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.event-card {
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 8px;
  background: #ffffff;
  padding: 18px;
  display: grid;
  align-content: start;
  gap: 10px;
  animation: riseIn 0.5s ease both;
  animation-delay: calc(var(--i) * 0.05s);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.event-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.14);
  border-color: rgba(15, 118, 110, 0.35);
}

.event-card h3 {
  font-size: 1.08rem;
  color: var(--ink);
  margin: 0;
}

.event-card p {
  color: var(--muted);
  line-height: 1.5;
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
  .events-grid {
    grid-template-columns: 1fr;
  }
}
</style>
