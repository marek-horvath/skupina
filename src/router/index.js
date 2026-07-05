import { createRouter, createWebHistory } from 'vue-router'
import PortfolioPage from '../components/PortfolioPage.vue'
import AdminPage from '../components/AdminPage.vue'

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes: [
    {
      path: '/admin',
      name: 'admin',
      component: AdminPage
    },
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
