<template>
  <nav class="tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      :class="{ active: tab.id === modelValue }"
      @click="$emit('update:modelValue', tab.id)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script>
export default {
  name: "TabNav",
  props: {
    modelValue: {
      type: String,
      required: true
    },
    tabs: {
      type: Array,
      required: true
    }
  }
};
</script>

<style scoped>
.tabs {
  display: inline-flex;
  align-self: center;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  margin: 24px auto 0;
  padding: 6px;
  gap: 6px;
}

.tabs button {
  background: transparent;
  border: none;
  padding: 10px 22px;
  cursor: pointer;
  font-size: 0.98rem;
  transition: background-color 0.3s, color 0.3s, transform 0.2s;
  color: var(--muted);
  font-weight: 600;
  border-radius: 999px;
}

.tabs button.active {
  background: var(--ink);
  color: #fff;
}

.tabs button:hover {
  background: rgba(15, 23, 42, 0.12);
  color: var(--ink);
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .tabs {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
