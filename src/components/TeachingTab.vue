<template>
  <div class="teaching-section">
    <h2>{{ language === "sk" ? "Predmety" : "Subjects" }}</h2>
    <div class="teaching-grid">
      <article
        v-for="(subject, index) in subjects"
        :key="subject.name"
        class="term-card"
        :style="{ '--i': index }"
        :role="subject.link ? 'link' : null"
        :tabindex="subject.link ? 0 : null"
        @click="openSubject(subject.link)"
        @keydown.enter.prevent="openSubject(subject.link)"
      >
        <h3>{{ subjectName(subject) }}</h3>
        <p v-if="subjectDescription(subject)" class="subject-desc">{{ subjectDescription(subject) }}</p>
        <a v-if="subject.link" :href="subject.link" target="_blank" class="subject-link-btn" @click.stop>
          {{ language === "sk" ? "Otvorit link" : "Open Link" }}
        </a>
      </article>
    </div>
  </div>
</template>

<script>
export default {
  name: "TeachingTab",
  props: {
    subjects: {
      type: Array,
      required: true
    },
    language: {
      type: String,
      default: "en"
    }
  },
  methods: {
    openSubject(link) {
      if (!link) {
        return;
      }
      window.open(link, "_blank");
    },
    subjectName(subject) {
      if (this.language === "sk" && subject.nameSK) {
        return subject.nameSK;
      }
      return subject.name || "";
    },
    subjectDescription(subject) {
      if (this.language === "sk" && subject.descriptionSK) {
        return subject.descriptionSK;
      }
      return subject.description || "";
    }
  }
};
</script>

<style scoped>
.teaching-section h2 {
  margin-bottom: 24px;
  font-size: 1.5rem;
  color: var(--ink);
}

.teaching-section {
  color: var(--ink);
  display: grid;
  gap: 12px;
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
}

.teaching-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 16px;
  perspective: 1100px;
}

.term-card {
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  padding: 16px 18px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  animation: riseIn 0.6s ease both;
  animation-delay: calc(var(--i) * 0.05s);
  width: 100%;
  transition: transform 0.26s ease, box-shadow 0.26s ease, border-color 0.26s ease;
  transform-origin: center center;
  transform-style: preserve-3d;
  will-change: transform;
  position: relative;
  z-index: 1;
}

.term-card::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(140deg, rgba(15, 118, 110, 0.16), rgba(15, 23, 42, 0.05));
  opacity: 0;
  transition: opacity 0.26s ease;
  pointer-events: none;
}

.term-card:hover,
.term-card:focus-within,
.term-card:active {
  transform: perspective(1100px) rotateX(4deg) rotateY(-4deg) translateY(-4px) scale(1.1);
  box-shadow: 0 34px 60px rgba(15, 23, 42, 0.34);
  border-color: rgba(15, 118, 110, 0.42);
  z-index: 12;
}

.term-card:hover::before,
.term-card:focus-within::before,
.term-card:active::before {
  opacity: 1;
}

.term-card h3 {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: var(--ink);
}

.term-card h3,
.subject-desc,
.subject-link-btn {
  position: relative;
  z-index: 1;
  transition: transform 0.26s ease;
}

.term-card:hover h3,
.term-card:hover .subject-desc,
.term-card:hover .subject-link-btn,
.term-card:focus-within h3,
.term-card:focus-within .subject-desc,
.term-card:focus-within .subject-link-btn,
.term-card:active h3,
.term-card:active .subject-desc,
.term-card:active .subject-link-btn {
  transform: translateZ(22px);
}

.subject-desc {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.5;
}

.subject-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #eef6f5;
  color: var(--accent-2);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.subject-link-btn:hover {
  background: #0f766e;
  border-color: #0f766e;
  color: #ffffff;
}

@media (hover: none) {
  .subject-link-btn:hover {
    background: #eef6f5;
    border-color: rgba(15, 23, 42, 0.12);
    color: var(--accent);
  }
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
  .teaching-section {
    max-width: 100%;
  }

  .teaching-grid {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }
}

@media (max-width: 520px) {
  .teaching-grid {
    grid-template-columns: 1fr;
  }
}
</style>
