import { createRouter, createWebHistory } from 'vue-router'
import PortfolioPage from '../components/PortfolioPage.vue'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      name: 'portfolio',
      component: PortfolioPage
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
