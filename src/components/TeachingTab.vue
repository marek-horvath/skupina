<template>
  <div class="teaching-section">
    <h2>Teaching by Subject</h2>
    <div class="teaching-grid">
      <article
        v-for="(subject, index) in subjects"
        :key="subject.name"
        class="term-card"
        :style="{ '--i': index }"
      >
        <h3>{{ subject.name }}</h3>
        <ul>
          <li v-for="(item, idx) in subject.offerings" :key="idx">{{ item }}</li>
        </ul>
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
}

.term-card h3 {
  font-size: 1.1rem;
  margin-bottom: 10px;
  color: var(--ink);
}

.term-card ul {
  list-style: none;
  padding-left: 0;
  color: var(--muted);
  display: grid;
  gap: 6px;
  line-height: 1.5;
}

.term-card li {
  padding-left: 16px;
  position: relative;
  font-size: 0.92rem;
  word-break: break-word;
}

.term-card li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.6em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
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
