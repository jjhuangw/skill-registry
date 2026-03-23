import { createRouter, createWebHistory } from 'vue-router'
import SearchPage from './components/pages/SearchPage.vue'
import RegisterPage from './components/pages/RegisterPage.vue'
import SkillDetailPage from './components/pages/SkillDetailPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: SearchPage },
    { path: '/register', component: RegisterPage },
    { path: '/skills/:id', component: SkillDetailPage },
  ],
})
