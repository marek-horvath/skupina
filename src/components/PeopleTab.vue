<template>
  <div class="people-section">
    <section class="people-group" v-if="people.professor.length">
      <h2>{{ sectionLabel("professor") }}</h2>
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
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'LinkedIn', linkedinUrl(person)))"
              aria-label="LinkedIn profile"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                alt="LinkedIn"
                class="linkedin-logo"
              />
            </a>
            <a
              v-if="orcidUrl(person)"
              :href="orcidUrl(person)"
              target="_blank"
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'ORCID', orcidUrl(person)))"
              aria-label="ORCID profile"
            >
              <img :src="getImage('orcid.png')" alt="ORCID" class="social-icon" />
            </a>
            <a
              v-if="webUrl(person)"
              :href="webUrl(person)"
              target="_blank"
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'Web', webUrl(person)))"
              aria-label="Personal website"
            >
              <img :src="getImage('web.png')" alt="Website" class="social-icon" />
            </a>
          </div>
          <div class="email-row">
            <p class="email">{{ person.email }}</p>
            <button class="copy-btn" @click.stop="copyEmail(person)">Copy</button>
          </div>
          <p>{{ personInfo(person) }}</p>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.associateProfessor.length">
      <h2>{{ sectionLabel("associate") }}</h2>
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
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'LinkedIn', linkedinUrl(person)))"
              aria-label="LinkedIn profile"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                alt="LinkedIn"
                class="linkedin-logo"
              />
            </a>
            <a
              v-if="orcidUrl(person)"
              :href="orcidUrl(person)"
              target="_blank"
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'ORCID', orcidUrl(person)))"
              aria-label="ORCID profile"
            >
              <img :src="getImage('orcid.png')" alt="ORCID" class="social-icon" />
            </a>
            <a
              v-if="webUrl(person)"
              :href="webUrl(person)"
              target="_blank"
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'Web', webUrl(person)))"
              aria-label="Personal website"
            >
              <img :src="getImage('web.png')" alt="Website" class="social-icon" />
            </a>
          </div>
          <div class="email-row">
            <p class="email">{{ person.email }}</p>
            <button class="copy-btn" @click.stop="copyEmail(person)">Copy</button>
          </div>
          <p>{{ personInfo(person) }}</p>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.researchAssistants.length">
      <h2>{{ sectionLabel("assistants") }}</h2>
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
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'LinkedIn', linkedinUrl(person)))"
              aria-label="LinkedIn profile"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                alt="LinkedIn"
                class="linkedin-logo"
              />
            </a>
            <a
              v-if="orcidUrl(person)"
              :href="orcidUrl(person)"
              target="_blank"
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'ORCID', orcidUrl(person)))"
              aria-label="ORCID profile"
            >
              <img :src="getImage('orcid.png')" alt="ORCID" class="social-icon" />
            </a>
            <a
              v-if="webUrl(person)"
              :href="webUrl(person)"
              target="_blank"
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'Web', webUrl(person)))"
              aria-label="Personal website"
            >
              <img :src="getImage('web.png')" alt="Website" class="social-icon" />
            </a>
          </div>
          <div class="email-row">
            <p class="email">{{ person.email }}</p>
            <button class="copy-btn" @click.stop="copyEmail(person)">Copy</button>
          </div>
          <p>{{ personInfo(person) }}</p>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.phdCandidates.length">
      <h2>{{ sectionLabel("phd") }}</h2>
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
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'LinkedIn', linkedinUrl(person)))"
              aria-label="LinkedIn profile"
            >
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                alt="LinkedIn"
                class="linkedin-logo"
              />
            </a>
            <a
              v-if="orcidUrl(person)"
              :href="orcidUrl(person)"
              target="_blank"
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'ORCID', orcidUrl(person)))"
              aria-label="ORCID profile"
            >
              <img :src="getImage('orcid.png')" alt="ORCID" class="social-icon" />
            </a>
            <a
              v-if="webUrl(person)"
              :href="webUrl(person)"
              target="_blank"
              class="social-link"
              @click.stop="$emit('analytics', linkEvent(person, 'Web', webUrl(person)))"
              aria-label="Personal website"
            >
              <img :src="getImage('web.png')" alt="Website" class="social-icon" />
            </a>
          </div>
          <div class="email-row">
            <p class="email">{{ person.email }}</p>
            <button class="copy-btn" @click.stop="copyEmail(person)">Copy</button>
          </div>
          <p>{{ personInfo(person) }}</p>
        </div>
      </div>
    </section>
    <section
      class="people-group names-grid"
      v-if="(people.exMembers && people.exMembers.length) || (people.students && people.students.length)"
    >
      <div class="names-col" v-if="people.exMembers && people.exMembers.length">
        <h2>{{ sectionLabel("ex") }}</h2>
        <ul class="names-list">
          <li v-for="(person, index) in people.exMembers" :key="'ex-' + index">{{ person.name }}</li>
        </ul>
      </div>

      <div class="names-col" v-if="people.students && people.students.length">
        <h2>{{ sectionLabel("students") }}</h2>
        <ul class="names-list">
          <li v-for="(person, index) in people.students" :key="'student-' + index">{{ person.name }}</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: "PeopleTab",
  emits: ["select", "analytics"],
  props: {
    people: {
      type: Object,
      required: true
    },
    getImage: {
      type: Function,
      required: true
    },
    language: {
      type: String,
      default: "en"
    }
  },
  methods: {
    socialUrl(person, label) {
      if (!person.links || !person.links.length) {
        return "";
      }
      const wanted = label.toLowerCase();
      const link = person.links.find(item => item.label && item.label.toLowerCase() === wanted);
      return link ? link.url : "";
    },
    linkedinUrl(person) {
      return this.socialUrl(person, "linkedin");
    },
    orcidUrl(person) {
      return this.socialUrl(person, "orcid");
    },
    webUrl(person) {
      return this.socialUrl(person, "web");
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
    sectionLabel(key) {
      const labels = this.language === "sk"
        ? {
            professor: "Profesor",
            associate: "Docent",
            assistants: "Odborni asistenti",
            phd: "Doktorandi",
            ex: "Byvali clenovia",
            students: "Studenti"
          }
        : {
            professor: "Professor",
            associate: "Associate Professor",
            assistants: "Research Assistants",
            phd: "PhD Candidates",
            ex: "Ex Members",
            students: "Students"
          };
      return labels[key] || key;
    },
    linkEvent(person, linkType, url) {
      return {
        action: "person_link_open",
        label: person.name,
        target: url,
        metadata: { linkType }
      };
    },
    copyEmail(person) {
      const email = person && person.email;
      if (!email) {
        return;
      }
      this.$emit("analytics", {
        action: "email_copy",
        label: person.name,
        target: email,
        metadata: { linkType: "Email / Copy" }
      });
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
  transition: transform 0.22s ease, box-shadow 0.22s ease;
  position: relative;
}

.people-section .card:hover {
  transform: scale(1.05) !important;
  box-shadow: 0 28px 46px rgba(15, 23, 42, 0.28) !important;
  z-index: 4;
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

.social-link {
  display: inline-flex;
  align-items: center;
}

.social-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
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


.names-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 28px;
  margin-top: 12px;
}

.names-col h2 {
  margin-bottom: 12px;
}

.names-list {
  list-style: disc;
  padding-left: 22px;
  display: grid;
  gap: 8px;
}

.names-list li {
  font-size: 1.04rem;
  line-height: 1.4;
  color: var(--ink);
}

@media (max-width: 900px) {
  .names-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

</style>
