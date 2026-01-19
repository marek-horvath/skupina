<template>
  <div class="people-section">
    <section class="people-group" v-if="people.professor.length">
      <h2>Professor</h2>
      <div class="people-cards">
        <div
          class="card" @click="$emit('select', person)"
          v-for="(person, index) in people.professor"
          :key="'prof-' + index"
          :style="{ '--i': index }"
        >
          <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
          <div class="name-row">
            <h3>{{ person.name }}</h3>
            <a
              v-if="linkedinUrl(person)"
              :href="linkedinUrl(person)"
              target="_blank"
              class="linkedin-link" @click.stop
              aria-label="LinkedIn profile"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                alt="LinkedIn"
                class="linkedin-logo"
              />
            </a>
          </div>
          <div class="email-row">
            <p class="email">{{ person.email }}</p>
            <button class="copy-btn" @click.stop="copyEmail(person.email)">Copy</button>
          </div>
          <p>{{ person.info }}</p>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.associateProfessor.length">
      <h2>Associate Professor</h2>
      <div class="people-cards">
        <div
          class="card" @click="$emit('select', person)"
          v-for="(person, index) in people.associateProfessor"
          :key="'assoc-' + index"
          :style="{ '--i': index }"
        >
          <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
          <div class="name-row">
            <h3>{{ person.name }}</h3>
            <a
              v-if="linkedinUrl(person)"
              :href="linkedinUrl(person)"
              target="_blank"
              class="linkedin-link" @click.stop
              aria-label="LinkedIn profile"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                alt="LinkedIn"
                class="linkedin-logo"
              />
            </a>
          </div>
          <div class="email-row">
            <p class="email">{{ person.email }}</p>
            <button class="copy-btn" @click.stop="copyEmail(person.email)">Copy</button>
          </div>
          <p>{{ person.info }}</p>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.researchAssistants.length">
      <h2>Research Assistants</h2>
      <div class="people-cards">
        <div
          class="card" @click="$emit('select', person)"
          v-for="(person, index) in people.researchAssistants"
          :key="'ra-' + index"
          :style="{ '--i': index }"
        >
          <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
          <div class="name-row">
            <h3>{{ person.name }}</h3>
            <a
              v-if="linkedinUrl(person)"
              :href="linkedinUrl(person)"
              target="_blank"
              class="linkedin-link" @click.stop
              aria-label="LinkedIn profile"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                alt="LinkedIn"
                class="linkedin-logo"
              />
            </a>
          </div>
          <div class="email-row">
            <p class="email">{{ person.email }}</p>
            <button class="copy-btn" @click.stop="copyEmail(person.email)">Copy</button>
          </div>
          <p>{{ person.info }}</p>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.phdCandidates.length">
      <h2>PhD Candidates</h2>
      <div class="people-cards">
        <div
          class="card" @click="$emit('select', person)"
          v-for="(person, index) in people.phdCandidates"
          :key="'phd-' + index"
          :style="{ '--i': index }"
        >
          <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
          <div class="name-row">
            <h3>{{ person.name }}</h3>
            <a
              v-if="linkedinUrl(person)"
              :href="linkedinUrl(person)"
              target="_blank"
              class="linkedin-link" @click.stop
              aria-label="LinkedIn profile"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                alt="LinkedIn"
                class="linkedin-logo"
              />
            </a>
          </div>
          <div class="email-row">
            <p class="email">{{ person.email }}</p>
            <button class="copy-btn" @click.stop="copyEmail(person.email)">Copy</button>
          </div>
          <p>{{ person.info }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: "PeopleTab",
  emits: ["select"],
  props: {
    people: {
      type: Object,
      required: true
    },
    getImage: {
      type: Function,
      required: true
    }
  },
  methods: {
    linkedinUrl(person) {
      if (!person.links || !person.links.length) {
        return "";
      }
      const link = person.links.find(item => item.label && item.label.toLowerCase() === "linkedin");
      return link ? link.url : "";
    },
    copyEmail(email) {
      if (!email) {
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email);
        return;
      }
      const textarea = document.createElement("textarea");
      textarea.value = email;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }
};
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.profile-pic {
  display: block;
  margin: 0 auto 10px;
}

.name-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.linkedin-link {
  display: inline-flex;
  align-items: center;
}

.email-row {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: #f3f4f6;
  max-width: 100%;
  gap: 6px;
  padding: 2px 6px;
}

.email {
  font-size: 0.78rem;
  line-height: 1.2;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.copy-btn {
  border: none;
  background: #9ca3af;
  color: #1f2937;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  cursor: pointer;
  line-height: 1;
}

.copy-btn:hover {
  background: #6b7280;
  color: #ffffff;
}
</style>
