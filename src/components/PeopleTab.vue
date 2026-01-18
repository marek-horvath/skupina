<template>
  <div class="people-section">
    <section class="people-group" v-if="people.professor.length">
      <h2>Professor</h2>
      <div class="people-cards">
        <div
          class="card"
          v-for="(person, index) in people.professor"
          :key="'prof-' + index"
          :style="{ '--i': index }"
        >
          <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
          <h3>{{ person.name }}</h3>
          <p class="email">{{ person.email }}</p>
          <p>{{ person.info }}</p>
          <div class="links">
            <a
              v-for="(link, idx) in person.links"
              :key="idx"
              :href="link.url"
              target="_blank"
              class="link-item"
            >
              <template v-if="link.label.toLowerCase() === 'linkedin'">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                  alt="LinkedIn"
                  class="linkedin-logo"
                />
              </template>
              <template v-else>
                {{ link.label }}
              </template>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.associateProfessor.length">
      <h2>Associate Professor</h2>
      <div class="people-cards">
        <div
          class="card"
          v-for="(person, index) in people.associateProfessor"
          :key="'assoc-' + index"
          :style="{ '--i': index }"
        >
          <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
          <h3>{{ person.name }}</h3>
          <p class="email">{{ person.email }}</p>
          <p>{{ person.info }}</p>
          <div class="links">
            <a
              v-for="(link, idx) in person.links"
              :key="idx"
              :href="link.url"
              target="_blank"
              class="link-item"
            >
              <template v-if="link.label.toLowerCase() === 'linkedin'">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                  alt="LinkedIn"
                  class="linkedin-logo"
                />
              </template>
              <template v-else>
                {{ link.label }}
              </template>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.researchAssistants.length">
      <h2>Research Assistants</h2>
      <div class="people-cards">
        <div
          class="card"
          v-for="(person, index) in people.researchAssistants"
          :key="'ra-' + index"
          :style="{ '--i': index }"
        >
          <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
          <h3>{{ person.name }}</h3>
          <p class="email">{{ person.email }}</p>
          <p>{{ person.info }}</p>
          <div class="links">
            <a
              v-for="(link, idx) in person.links"
              :key="idx"
              :href="link.url"
              target="_blank"
              class="link-item"
            >
              <template v-if="link.label.toLowerCase() === 'linkedin'">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                  alt="LinkedIn"
                  class="linkedin-logo"
                />
              </template>
              <template v-else>
                {{ link.label }}
              </template>
            </a>
          </div>
        </div>
      </div>
    </section>

    <section class="people-group" v-if="people.phdCandidates.length">
      <h2>PhD Candidates</h2>
      <div class="people-cards">
        <div
          class="card"
          v-for="(person, index) in people.phdCandidates"
          :key="'phd-' + index"
          :style="{ '--i': index }"
        >
          <img :src="getImage(person.image)" alt="Profile Picture" class="profile-pic" />
          <h3>{{ person.name }}</h3>
          <p class="email">{{ person.email }}</p>
          <p>{{ person.info }}</p>
          <div class="links">
            <a
              v-for="(link, idx) in person.links"
              :key="idx"
              :href="link.url"
              target="_blank"
              class="link-item"
            >
              <template v-if="link.label.toLowerCase() === 'linkedin'">
                <img
                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQJ04ydawRAAa5H68SNWFnch3O6DQEx9dsRxQ&s"
                  alt="LinkedIn"
                  class="linkedin-logo"
                />
              </template>
              <template v-else>
                {{ link.label }}
              </template>
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: "PeopleTab",
  props: {
    people: {
      type: Object,
      required: true
    },
    getImage: {
      type: Function,
      required: true
    }
  }
};
</script>
