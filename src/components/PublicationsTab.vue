<template>
  <div class="publications-section">
    <h2>Publications Timeline</h2>
    <div class="timeline">
      <div class="year-group" v-for="group in groupedPublications" :key="group.year">
        <div class="year-label">{{ group.year }}</div>
        <div
          class="timeline-item"
          v-for="(pub, index) in group.items"
          :key="index"
          :style="{ '--i': index }"
        >
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
</template>

<script>
export default {
  name: "PublicationsTab",
  props: {
    groupedPublications: {
      type: Array,
      required: true
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
    padding-left: 40px;
  }

  .timeline::before {
    left: 20px;
  }

  .timeline-item {
    padding-left: 20px;
  }

  .timeline-item-connector {
    left: -6px;
  }

  .timeline-content {
    width: 100%;
    max-width: none;
  }
}
</style>
